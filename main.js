const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const DATA_DIR = path.join(app.getPath('documents'), 'InkNote');
const DATA_FILE = path.join(DATA_DIR, 'notebook.json');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const WIN_FILE = path.join(app.getPath('userData'), 'window.json');

const selftestArg = process.argv.find(a => a.startsWith('--selftest=') || a.startsWith('--demo='));
const SELFTEST = selftestArg ? selftestArg.slice(selftestArg.indexOf('=') + 1) : null;
const DEMO = !!selftestArg && selftestArg.startsWith('--demo=');

let win;
app.setName('InkNote');
if (process.platform === 'win32') app.setAppUserModelId('local.inknote.app');

if (!SELFTEST && !app.requestSingleInstanceLock()) app.quit();
app.on('second-instance', () => {
  if (!win || win.isDestroyed()) { createWindow(); return; }
  if (win.isMinimized()) win.restore();
  if (!win.isVisible()) win.show();
  ensureOnScreen(); win.focus();
});

function ensureOnScreen() {
  const { screen } = require('electron');
  const b = win.getBounds();
  const visible = screen.getAllDisplays().some(d => {
    const a = d.workArea;
    return b.x < a.x + a.width - 80 && b.x + b.width > a.x + 80 && b.y < a.y + a.height - 80 && b.y + 40 > a.y;
  });
  if (!visible) win.center();
}

function readJSON(f, d) { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } }

function createWindow() {
  const st = DEMO ? { w: 1520, h: 950 } : readJSON(WIN_FILE, {});
  win = new BrowserWindow({
    width: st.w || 1400, height: st.h || 900, x: st.x, y: st.y,
    minWidth: 760, minHeight: 520,
    backgroundColor: '#f3f3f3',
    title: 'InkNote',
    titleBarStyle: 'hidden',
    titleBarOverlay: { color: '#f3f3f3', symbolColor: '#333333', height: 44 },
    icon: path.join(__dirname, 'build', 'icon.png'),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      spellcheck: true,
    },
  });
  if (st.max && !SELFTEST) win.maximize();
  const reveal = () => { if (win && !win.isDestroyed() && !win.isVisible()) { ensureOnScreen(); win.show(); } };
  win.once('ready-to-show', reveal);
  setTimeout(reveal, 2500); // never stay invisible, even if loading is slow
  win.loadFile(path.join(__dirname, 'src', 'index.html'));
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  if (SELFTEST) win.webContents.on('console-message', (e, level, msg, line, src) => console.log(`[renderer ${level}] ${msg} (${src}:${line})`));
  win.webContents.on('will-navigate', e => e.preventDefault());
  win.on('close', () => {
    try {
      const b = win.getNormalBounds();
      fs.writeFileSync(WIN_FILE, JSON.stringify({ x: b.x, y: b.y, w: b.width, h: b.height, max: win.isMaximized() }));
    } catch {}
  });
}

function writeAtomic(json) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = DATA_FILE + '.tmp';
  fs.writeFileSync(tmp, json);
  fs.renameSync(tmp, DATA_FILE);
  dailyBackup(json);
}

function dailyBackup(json) {
  try {
    const d = new Date();
    const stamp = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const f = path.join(BACKUP_DIR, `notebook-${stamp}.json`);
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    fs.writeFileSync(f, json); // keeps the latest state of each day
    const all = fs.readdirSync(BACKUP_DIR).filter(n => n.startsWith('notebook-')).sort();
    while (all.length > 30) fs.unlinkSync(path.join(BACKUP_DIR, all.shift()));
  } catch {}
}

const sanitize = s => (s || 'Notes').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80) || 'Notes';

ipcMain.handle('nb:load', () => {
  if (SELFTEST) return null;
  try { return fs.readFileSync(DATA_FILE, 'utf8'); } catch { return null; }
});
ipcMain.handle('nb:save', (e, json) => { if (SELFTEST) return true; writeAtomic(json); return true; });
ipcMain.on('nb:save-sync', (e, json) => {
  try { if (!SELFTEST) writeAtomic(json); e.returnValue = true; } catch { e.returnValue = false; }
});
ipcMain.handle('nb:path', () => DATA_FILE);

ipcMain.handle('export:pdf', async (e, { html, name, silentPath }) => {
  let file = silentPath;
  if (!file) {
    const r = await dialog.showSaveDialog(win, {
      title: 'Export as PDF',
      defaultPath: path.join(app.getPath('documents'), sanitize(name) + '.pdf'),
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });
    if (r.canceled || !r.filePath) return { canceled: true };
    file = r.filePath;
  }
  const tmp = path.join(os.tmpdir(), `inknote-export-${Date.now()}.html`);
  fs.writeFileSync(tmp, html, 'utf8');
  const w = new BrowserWindow({ show: false, webPreferences: { sandbox: true } });
  try {
    await w.loadFile(tmp);
    await w.webContents.executeJavaScript(
      'Promise.all([document.fonts.ready, ...[...document.images].map(i => i.decode().catch(()=>0))]).then(()=>1)'
    );
    const data = await w.webContents.printToPDF({
      printBackground: true,
      preferCSSPageSize: true,
      margins: { marginType: 'none' },
    });
    fs.writeFileSync(file, data);
    return { ok: true, file };
  } catch (err) {
    return { ok: false, error: String(err && err.message || err) };
  } finally {
    w.destroy();
    fs.unlink(tmp, () => {});
  }
});

ipcMain.handle('shell:show', (e, f) => shell.showItemInFolder(f));
ipcMain.handle('shell:data', () => { fs.mkdirSync(DATA_DIR, { recursive: true }); return shell.openPath(DATA_DIR); });

ipcMain.handle('backup:export', async (e, json) => {
  const d = new Date().toISOString().slice(0, 10);
  const r = await dialog.showSaveDialog(win, {
    title: 'Save notebook backup',
    defaultPath: path.join(app.getPath('documents'), `InkNote-backup-${d}.inknote`),
    filters: [{ name: 'InkNote backup', extensions: ['inknote', 'json'] }],
  });
  if (r.canceled || !r.filePath) return null;
  fs.writeFileSync(r.filePath, json);
  return r.filePath;
});
ipcMain.handle('backup:import', async () => {
  const r = await dialog.showOpenDialog(win, {
    title: 'Restore notebook backup',
    filters: [{ name: 'InkNote backup', extensions: ['inknote', 'json'] }],
    properties: ['openFile'],
  });
  if (r.canceled || !r.filePaths[0]) return null;
  return fs.readFileSync(r.filePaths[0], 'utf8');
});

ipcMain.handle('win:titlebar', (e, { color, symbol }) => {
  try { win.setTitleBarOverlay({ color, symbolColor: symbol, height: 44 }); } catch {}
  try { win.setBackgroundColor(color); } catch {}
});
ipcMain.handle('win:fullscreen', () => { win.setFullScreen(!win.isFullScreen()); return win.isFullScreen(); });

// ---- self test (used only during development) ----
ipcMain.handle('selftest:get', () => (SELFTEST ? { dir: SELFTEST, demo: DEMO } : null));
ipcMain.handle('selftest:shot', async (e, name) => {
  const img = await win.webContents.capturePage();
  fs.writeFileSync(path.join(SELFTEST, name), img.toPNG());
});
ipcMain.handle('selftest:done', () => { setTimeout(() => app.quit(), 200); return true; });

app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
