// Renders the app icon to build/icon.png (run: npx electron tools/make-icon.js)
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8e2bc4"/><stop offset="1" stop-color="#5a1185"/></linearGradient></defs>
  <rect x="12" y="12" width="232" height="232" rx="52" fill="url(#g)"/>
  <rect x="58" y="44" width="140" height="172" rx="14" fill="#f6f7fb"/>
  <g stroke="#b8c6e3" stroke-width="3"><path d="M70 98h116M70 126h116M70 154h116M70 182h116"/></g>
  <path d="M84 44v172" stroke="#ef7a7a" stroke-width="3"/>
  <path d="M96 150c14-26 24-40 32-36s-6 30 4 30 18-34 30-30" fill="none" stroke="#1f1f1f" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
  <g transform="rotate(40 186 92)"><rect x="176" y="20" width="22" height="96" rx="5" fill="#ffd400"/><path d="M176 116h22l-11 26z" fill="#e9c58c"/><path d="M183 132h8l-4 10z" fill="#333"/></g>
</svg>`;

app.whenReady().then(async () => {
  const w = new BrowserWindow({ width: 256, height: 256, show: false, frame: false, transparent: true, useContentSize: true });
  await w.loadURL('data:text/html,' + encodeURIComponent(`<html><body style="margin:0;background:transparent">${svg}</body></html>`));
  await new Promise(r => setTimeout(r, 300));
  const img = await w.webContents.capturePage({ x: 0, y: 0, width: 256, height: 256 });
  fs.mkdirSync(path.join(__dirname, '..', 'build'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, '..', 'build', 'icon.png'), img.resize({ width: 256, height: 256 }).toPNG());
  app.quit();
});
