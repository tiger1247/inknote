/* InkNote — pen-first notebook. Plain JS, no framework. */
'use strict';

/* =========================================================================
   Constants & helpers
   ========================================================================= */
const PW = 794;            // page width in page units (= CSS px at 100%, A4 @ 96dpi)
const SHEET_H = 1123;      // A4 sheet height
const LINE_TOP = 132;      // first ruled line
const MARGIN_X = 60;
const getStroke = window.PF.getStroke;

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-5);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const r2 = v => Math.round(v * 100) / 100;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const ICONS = {
  search: '<path d="M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14z"/><path d="M20 20l-4-4"/>',
  share: '<path d="M12 15V3"/><path d="M8 7l4-4 4 4"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>',
  gear: '<path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  expand: '<path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/>',
  compress: '<path d="M4 14h6v6"/><path d="M20 10h-6V4"/><path d="M14 10l7-7"/><path d="M3 21l7-7"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
  redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>',
  text: '<path d="M5 7V5h14v2"/><path d="M12 5v14"/><path d="M9 19h6"/>',
  lasso: '<path d="M8.5 16.5C5 15.6 3 13.6 3 11.2 3 7.2 7 4.5 12 4.5s9 2.7 9 6.5-4 6.5-9 6.5c-1 0-1.9-.1-2.8-.3"/><path d="M8.5 16.5c-1.3.3-2 1.2-1.6 2.2.4 1 1.8 1.4 3.1.8"/>',
  space: '<path d="M12 3v18"/><path d="M8.5 6.5L12 3l3.5 3.5"/><path d="M8.5 17.5L12 21l3.5-3.5"/><path d="M3 12h4"/><path d="M17 12h4"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  image: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><path d="M9 9.2a1.4 1.4 0 1 0 0 .1"/><path d="M4 17l5-5 4 4 2.5-2.5L20 18"/>',
  line: '<path d="M5 19L19 5"/>',
  arrow: '<path d="M5 19L19 5"/><path d="M10 5h9v9"/>',
  rect: '<rect x="4" y="6" width="16" height="12" rx="1"/>',
  ellipse: '<ellipse cx="12" cy="12" rx="8.5" ry="6.5"/>',
  calendar: '<rect x="4" y="5.5" width="16" height="14.5" rx="2"/><path d="M4 10h16"/><path d="M8.5 3.5v4"/><path d="M15.5 3.5v4"/>',
  pageplus: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M12 11v6"/><path d="M9 14h6"/>',
  zoomin: '<path d="M10.5 4a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13z"/><path d="M20 20l-4.6-4.6"/><path d="M10.5 8v5"/><path d="M8 10.5h5"/>',
  zoomout: '<path d="M10.5 4a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13z"/><path d="M20 20l-4.6-4.6"/><path d="M8 10.5h5"/>',
  fit: '<path d="M4 9V4h5"/><path d="M20 9V4h-5"/><path d="M4 15v5h5"/><path d="M20 15v5h-5"/>',
  trash: '<path d="M4 7h16"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  cut: '<path d="M6 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/><path d="M18 15a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/><path d="M8.2 16.4L18 4"/><path d="M15.8 16.4L6 4"/>',
  paste: '<rect x="8.5" y="3" width="7" height="4" rx="1"/><path d="M8.5 5H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2.5"/>',
  dup: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M14 11v6"/><path d="M11 14h6"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  chevleft: '<path d="M14.5 5.5L8 12l6.5 6.5"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  sun: '<path d="M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8z"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M4.9 4.9l1.4 1.4"/><path d="M17.7 17.7l1.4 1.4"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="M4.9 19.1l1.4-1.4"/><path d="M17.7 6.3l1.4-1.4"/>',
  list: '<path d="M9 6h11"/><path d="M9 12h11"/><path d="M9 18h11"/><path d="M4.5 6h.01"/><path d="M4.5 12h.01"/><path d="M4.5 18h.01"/>',
  folder: '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
  front: '<rect x="8" y="8" width="12" height="12" rx="1.5"/><path d="M4 16V5a1 1 0 0 1 1-1h11"/>',
};
const icon = (n, cls = 'ic') => `<svg class="${cls}" viewBox="0 0 24 24">${ICONS[n] || ''}</svg>`;
function paintIcons(root = document) { root.querySelectorAll('i[data-ic]').forEach(i => { i.outerHTML = icon(i.dataset.ic); }); }

/* color utilities */
function hexToRgb(h) {
  h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function lum(h) { const [r, g, b] = hexToRgb(h).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * r + .7152 * g + .0722 * b; }
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h = 0, s = 0; const l = (mx + mn) / 2;
  if (mx !== mn) { const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; }
  return [h, s, l];
}
function hsl(h, s, l) { return `hsl(${Math.round(h * 360)},${Math.round(s * 100)}%,${Math.round(l * 100)}%)`; }
const adaptCache = new Map();
/** On dark paper, very dark inks are shown light so notes stay readable (like OneNote). */
function adaptColor(c, dark) {
  if (!dark || !c || c[0] !== '#') return c;
  let v = adaptCache.get(c); if (v) return v;
  const [h, s, l] = rgbToHsl(...hexToRgb(c));
  if (s < .18 && l < .45) v = '#ededed';
  else if (l < .42) v = hsl(h, Math.min(1, s * 1.05), .68);
  else v = c;
  adaptCache.set(c, v); return v;
}

/* =========================================================================
   Storage API (Electron preload, or browser fallback)
   ========================================================================= */
const API = window.api || {
  load: async () => localStorage.getItem('inknote'),
  save: async j => { try { localStorage.setItem('inknote', j); } catch (e) { console.warn(e); } return true; },
  saveSync: j => { try { localStorage.setItem('inknote', j); } catch {} return true; },
  dataPath: async () => 'browser localStorage',
  exportPdf: async ({ html }) => { const w = window.open('', '_blank'); w.document.write(html); w.document.close(); setTimeout(() => w.print(), 400); return { ok: true }; },
  showFile: async () => {}, openData: async () => {},
  backupExport: async j => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([j])); a.download = 'InkNote-backup.inknote'; a.click(); return 'download'; },
  backupImport: async () => null,
  titlebar: async () => {}, fullscreen: async () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); },
  selftest: async () => null,
};

/* =========================================================================
   Notebook model
   ========================================================================= */
const PAPERS = {
  auto: null, white: '#ffffff', blue: '#eef2f9', cream: '#fbf6e8', mint: '#edf6ef', rose: '#fbeff2',
  lav: '#f2effa', gray: '#efefef', dark: '#1e1f22', slate: '#22303a', board: '#1c3a2e',
};
const SEC_COLORS = ['#7719aa', '#0078d4', '#107c10', '#d83b01', '#c239b3', '#008272', '#ca5010', '#4f6bed', '#e3008c', '#986f0b'];
const PEN_COLORS = ['#111111', '#5f6368', '#9e9e9e', '#ffffff', '#d32f2f', '#e91e63', '#ad1457', '#9c27b0', '#673ab7', '#283593', '#1565c0', '#0288d1', '#00acc1', '#00897b', '#2e7d32', '#43a047', '#7cb342', '#c0ca33', '#fdd835', '#ffb300', '#ef6c00', '#f4511e', '#6d4c41', '#8d6e63'];
const HL_COLORS = ['#ffd400', '#ffff00', '#c6ff00', '#69f0ae', '#00e5ff', '#82b1ff', '#b388ff', '#ff80ab', '#ff9e80', '#ff9100', '#e0e0e0', '#a7ffeb'];
const TEXT_COLORS = [null, '#d32f2f', '#1565c0', '#2e7d32', '#ef6c00', '#7b1fa2'];

function defaultPens() {
  return [
    { tool: 'pencil', color: '#5f6368', size: 1.8 },
    { tool: 'hl', color: '#ffd400', size: 16 },
    { tool: 'pen', color: '#ef6c00', size: 2.4 },
    { tool: 'pen', color: '#d32f2f', size: 2.4 },
    { tool: 'pen', color: '#0288d1', size: 2.4 },
    { tool: 'pen', color: '#111111', size: 2.4 },
    { tool: 'pen', color: '#43a047', size: 2.4 },
    { tool: 'pen', color: '#1565c0', size: 2.4 },
    { tool: 'pen', color: '#6d4c41', size: 2.4 },
    { tool: 'hl', color: '#00e5ff', size: 16 },
    { tool: 'pen', color: '#283593', size: 2.4 },
    { tool: 'hl', color: '#c6ff00', size: 16 },
    { tool: 'pen', color: '#9c27b0', size: 2.4 },
    { tool: 'pen', color: '#00897b', size: 2.4 },
  ].map(p => ({ id: uid(), ...p }));
}
function defaultSettings() {
  return {
    theme: 'light', pens: defaultPens(), penId: null,
    eraser: { mode: 'stroke', size: 16 },
    pressure: 'medium', smoothing: 'medium', fingerDraw: false, straighten: true, breaks: true, sidebar: true,
    defaultBg: { type: 'ruled', color: 'auto', margin: true },
    textSize: 16,
    exportOpts: { range: 'page', paper: 'a4', lines: true, white: false },
  };
}
function newPage(bg) { const t = Date.now(); return { id: uid(), title: '', created: t, modified: t, bg: { ...(bg || nb.settings.defaultBg) }, items: [] }; }
function newSection(name, i = 0) { return { id: uid(), name, color: SEC_COLORS[i % SEC_COLORS.length], pages: [] }; }
function defaultNotebook() {
  const n = { version: 1, sections: [], cur: {}, settings: defaultSettings() };
  n.settings.penId = n.settings.pens[5].id;
  return n;
}

let nb, sec, page;
let pageH = SHEET_H;
let cam = { x: 0, y: 0, z: 1 };
const camByPage = new Map();
let tool = 'pen';
let shapeKind = 'line';
let sel = null;          // { ids:Set }
let editing = null;      // text editing state
let lastText = null;     // last edited text box (for font-size changes from the ribbon)
let act = null;          // active pointer action
let hover = null;        // [x,y] page coords of hovering pointer
let spaceDown = false;
let hiddenIds = null;    // items hidden from main layer (being transformed)
let spaceShift = null;   // {y0, dy} insert-space preview
let clip = null;         // internal clipboard
let pasteN = 0;
let selftest = null;

const pen = () => nb.settings.pens.find(p => p.id === nb.settings.penId) || nb.settings.pens[0];
const isDarkPaperColor = c => lum(c) < .25;
function paperOf(bg) { if (!bg.color || bg.color === 'auto') return resolvedTheme() === 'dark' ? PAPERS.dark : '#f4f6fb'; return PAPERS[bg.color] || bg.color; }
const darkPaper = () => isDarkPaperColor(paperOf(page.bg));
function resolvedTheme() { const t = nb.settings.theme; if (t === 'system') return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; return t; }

/* =========================================================================
   Geometry: stroke outlines, paths, bounding boxes, hit testing
   ========================================================================= */
const THIN = { off: 0, low: .35, medium: .62, high: .85 };
function strokeOpts(it, last) {
  if (it.tool === 'hl') return { size: it.size, thinning: 0, smoothing: .5, streamline: .45, simulatePressure: false, last };
  if (it.tool === 'pencil') return { size: it.size, thinning: (it.th ?? .62) * .6, smoothing: .55, streamline: .4, simulatePressure: !!it.sim, last };
  return { size: it.size, thinning: it.th ?? .62, smoothing: .5, streamline: .32, simulatePressure: !!it.sim, last };
}
function outlineToD(o) {
  const n = o.length; if (!n) return '';
  if (n < 3) { const [x, y] = o[0]; return `M${r2(x)},${r2(y)}h.01Z`; }
  let d = `M${r2(o[0][0])},${r2(o[0][1])}Q`;
  for (let i = 0; i < n; i++) {
    const a = o[i], b = o[(i + 1) % n];
    d += `${r2(a[0])},${r2(a[1])} ${r2((a[0] + b[0]) / 2)},${r2((a[1] + b[1]) / 2)} `;
  }
  return d + 'Z';
}
function fillOutline(c, o) {
  const n = o.length; if (n < 3) return;
  c.beginPath(); c.moveTo(o[0][0], o[0][1]);
  for (let i = 0; i < n; i++) { const a = o[i], b = o[(i + 1) % n]; c.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
  c.closePath(); c.fill();
}
/* ---- Ink engine v2: smoothed centre-line + round-jointed variable-width hull ----
   Every stroke = Catmull-Rom spline through the (filtered) pen samples, rendered as
   positive-winding strip polygons + round caps, filled once (nonzero) → crisp, no seams,
   identical on screen, while drawing, and in the PDF. */
const SENS = { off: 0, low: .22, medium: .4, high: .6 };
const SMOOTH = { off: null, low: [7, .09], medium: [3.5, .045], high: [1.6, .02] };
function inkRadius(it, p) { const k = it.k || 0; return Math.max(.16, it.size * .5 * (1 + k * (clamp(p, 0, 1) * 2 - 1))); }
const SMOOTH_PX = { off: 0, low: 2, medium: 3.6, high: 5.5 };
/* symmetric Gaussian smoothing along arc length: removes jitter without lag; ends stay pinned */
function smoothPts(P, sigma) {
  const n = P.length; if (!sigma || n < 4) return P;
  const s = [0]; for (let i = 1; i < n; i++) s.push(s[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const S = s[n - 1], out = new Array(n);
  out[0] = P[0]; out[n - 1] = P[n - 1];
  for (let i = 1; i < n - 1; i++) {
    const sg = Math.min(sigma, s[i] / 2, (S - s[i]) / 2);
    if (sg < .05) { out[i] = P[i]; continue; }
    const lim = 2.5 * sg, k2 = 1 / (2 * sg * sg); let wx = 0, wy = 0, wp = 0, ws = 0;
    for (let j = i; j >= 0 && s[i] - s[j] <= lim; j--) { const w = Math.exp(-((s[i] - s[j]) ** 2) * k2); wx += w * P[j][0]; wy += w * P[j][1]; wp += w * P[j][2]; ws += w; }
    for (let j = i + 1; j < n && s[j] - s[i] <= lim; j++) { const w = Math.exp(-((s[j] - s[i]) ** 2) * k2); wx += w * P[j][0]; wy += w * P[j][1]; wp += w * P[j][2]; ws += w; }
    out[i] = [wx / ws, wy / ws, wp / ws];
  }
  // pressure varies slowly in real writing → smooth it over a wider window (keeps width even)
  const ps = sigma * 3, res = out.map(p => p.slice());
  for (let i = 0; i < n; i++) {
    const lim = 2.5 * ps, k2 = 1 / (2 * ps * ps); let wp = 0, ws = 0;
    for (let j = i; j >= 0 && s[i] - s[j] <= lim; j--) { const w = Math.exp(-((s[i] - s[j]) ** 2) * k2); wp += w * out[j][2]; ws += w; }
    for (let j = i + 1; j < n && s[j] - s[i] <= lim; j++) { const w = Math.exp(-((s[j] - s[i]) ** 2) * k2); wp += w * out[j][2]; ws += w; }
    res[i][2] = wp / ws;
  }
  return res;
}
function centerline(it) {
  const P = smoothPts(it.pts, it.sm), n = P.length, out = [];
  if (n === 1) return [[P[0][0], P[0][1], inkRadius(it, P[0][2])]];
  for (let i = 0; i < n - 1; i++) {
    const p0 = P[i > 0 ? i - 1 : 0], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2 < n ? i + 2 : n - 1];
    const L = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const steps = Math.min(14, Math.max(1, Math.ceil(L / .8)));
    for (let s = 0; s < steps; s++) {
      const t = s / steps, t2 = t * t, t3 = t2 * t;
      const cr = k => .5 * (2 * p1[k] + (p2[k] - p0[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (3 * p1[k] - p0[k] - 3 * p2[k] + p3[k]) * t3);
      out.push([cr(0), cr(1), inkRadius(it, p1[2] + (p2[2] - p1[2]) * t)]);
    }
  }
  const l = P[n - 1]; out.push([l[0], l[1], inkRadius(it, l[2])]);
  return out;
}
function emitInk(it, S) {
  const C0 = centerline(it), C = [C0[0]];
  for (let i = 1; i < C0.length; i++) { const a = C[C.length - 1], b = C0[i]; if (Math.hypot(b[0] - a[0], b[1] - a[1]) > .04) C.push(b); else a[2] = Math.max(a[2], b[2]); }
  const n = C.length;
  if (n === 1) { S.circle(C[0][0], C[0][1], C[0][2]); return; }
  const N = [];
  for (let i = 0; i < n - 1; i++) { const dx = C[i + 1][0] - C[i][0], dy = C[i + 1][1] - C[i][1], d = Math.hypot(dx, dy); N.push([-dy / d, dx / d]); }
  const br = [0];
  for (let i = 1; i < n - 1; i++) { const a = N[i - 1], b = N[i]; if (a[0] * b[0] + a[1] * b[1] < .9) br.push(i); }
  br.push(n - 1);
  for (const i of br) S.circle(C[i][0], C[i][1], C[i][2]);
  for (let r = 0; r < br.length - 1; r++) {
    const s = br[r], e = br[r + 1], L = [], R = [], D = [];
    for (let i = s; i <= e; i++) {
      let nx, ny, sc = 1;
      if (i === s) [nx, ny] = N[i]; else if (i === e) [nx, ny] = N[i - 1];
      else { const a = N[i - 1], b = N[i]; nx = a[0] + b[0]; ny = a[1] + b[1]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l; sc = 1 / Math.max(.75, nx * b[0] + ny * b[1]); }
      const [x, y, rr] = C[i], w = rr * sc;
      L.push(x - nx * w, y - ny * w); R.push(x + nx * w, y + ny * w);
      const sn = N[Math.min(i, n - 2)]; D.push([sn[1], -sn[0]]);
    }
    S.poly(fwd(L, D), fwd(R, D));
  }
}
/* drop offset points that run backwards (inside of tight curves) so polygons never fold */
function fwd(A, D) {
  const out = [A[0], A[1]], m = D.length;
  for (let j = 1; j < m; j++) {
    const x = A[2 * j], y = A[2 * j + 1], lx = out[out.length - 2], ly = out[out.length - 1];
    if ((x - lx) * D[j][0] + (y - ly) * D[j][1] > 0 || j === m - 1) out.push(x, y);
  }
  return out;
}
function canvasSink(c) {
  return {
    circle(x, y, r) { c.moveTo(x + r, y); c.arc(x, y, r, 0, Math.PI * 2); c.closePath(); },
    poly(L, R) { c.moveTo(L[0], L[1]); for (let i = 2; i < L.length; i += 2) c.lineTo(L[i], L[i + 1]); for (let i = R.length - 2; i >= 0; i -= 2) c.lineTo(R[i], R[i + 1]); c.closePath(); },
  };
}
function svgSink() {
  const a = [];
  return {
    a,
    circle(x, y, r) { const R = r2(r); a.push(`M${r2(x + r)},${r2(y)}A${R},${R} 0 1 1 ${r2(x - r)},${r2(y)}A${R},${R} 0 1 1 ${r2(x + r)},${r2(y)}Z`); },
    poly(L, R) {
      let s = `M${r2(L[0])},${r2(L[1])}`;
      for (let i = 2; i < L.length; i += 2) s += `L${r2(L[i])},${r2(L[i + 1])}`;
      for (let i = R.length - 2; i >= 0; i -= 2) s += `L${r2(R[i])},${r2(R[i + 1])}`;
      a.push(s + 'Z');
    },
  };
}
function inkD(it) { const s = svgSink(); emitInk(it, s); return s.a.join(''); }
function makeOneEuro(cfg) {
  if (!cfg) return null;
  const [minCut, beta] = cfg, alpha = (c, dt) => 1 / (1 + 1 / (2 * Math.PI * c * dt));
  let x = null, y = null, rx = 0, ry = 0, vx = 0, vy = 0, t = 0;
  return (nx, ny, nt) => {
    if (x === null) { x = rx = nx; y = ry = ny; t = nt; return [x, y]; }
    const dt = Math.max(.001, (nt - t) / 1000); t = nt;
    const ad = alpha(1, dt);
    vx += ad * ((nx - rx) / dt - vx); vy += ad * ((ny - ry) / dt - vy); rx = nx; ry = ny;
    const a = alpha(minCut + beta * Math.hypot(vx, vy), dt);
    x += a * (nx - x); y += a * (ny - y);
    return [x, y];
  };
}

function shapeD(it) {
  const { x1, y1, x2, y2 } = it;
  switch (it.kind) {
    case 'arrow': {
      const a = Math.atan2(y2 - y1, x2 - x1), L = Math.max(10, it.size * 4.5);
      const h1 = [x2 - L * Math.cos(a - .42), y2 - L * Math.sin(a - .42)], h2 = [x2 - L * Math.cos(a + .42), y2 - L * Math.sin(a + .42)];
      return `M${r2(x1)},${r2(y1)}L${r2(x2)},${r2(y2)}M${r2(h1[0])},${r2(h1[1])}L${r2(x2)},${r2(y2)}L${r2(h2[0])},${r2(h2[1])}`;
    }
    case 'rect': {
      const x = Math.min(x1, x2), y = Math.min(y1, y2), w = Math.abs(x2 - x1), h = Math.abs(y2 - y1);
      return `M${r2(x)},${r2(y)}H${r2(x + w)}V${r2(y + h)}H${r2(x)}Z`;
    }
    case 'ellipse': {
      const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2, rx = Math.abs(x2 - x1) / 2, ry = Math.abs(y2 - y1) / 2;
      return `M${r2(cx - rx)},${r2(cy)}A${r2(rx)},${r2(ry)} 0 1 0 ${r2(cx + rx)},${r2(cy)}A${r2(rx)},${r2(ry)} 0 1 0 ${r2(cx - rx)},${r2(cy)}Z`;
    }
    default: return `M${r2(x1)},${r2(y1)}L${r2(x2)},${r2(y2)}`;
  }
}
const dCache = new WeakMap(), pathCache = new WeakMap(), bboxCache = new WeakMap(), polyCache = new WeakMap();
function itemD(it) {
  let d = dCache.get(it);
  if (d === undefined) { d = it.t === 'stroke' ? (it.v === 2 ? inkD(it) : outlineToD(getStroke(it.pts, strokeOpts(it, true)))) : shapeD(it); dCache.set(it, d); }
  return d;
}
function itemPath(it) { let p = pathCache.get(it); if (!p) { p = new Path2D(itemD(it)); pathCache.set(it, p); } return p; }
function itemOpacity(it) { if (it.t === 'stroke') return it.tool === 'hl' ? .38 : it.tool === 'pencil' ? .9 : 1; return it.op ?? 1; }
function layerOf(it) { if (it.t === 'image') return 0; if ((it.t === 'stroke' && it.tool === 'hl') || (it.t === 'shape' && it.hl)) return 1; return 2; }

const measureEl = () => $('#measure');
function textDims(it) {
  let b = bboxCache.get(it); if (b) return b;
  const m = measureEl();
  m.style.fontSize = it.size + 'px'; m.style.maxWidth = (it.w || Math.max(80, PW - it.x - 24)) + 'px';
  m.style.width = it.w ? it.w + 'px' : '';
  m.innerHTML = it.html || '&nbsp;';
  b = { x0: it.x, y0: it.y, x1: it.x + m.offsetWidth, y1: it.y + m.offsetHeight };
  bboxCache.set(it, b); return b;
}
function bbox(it) {
  if (it.t === 'text') return textDims(it);
  let b = bboxCache.get(it); if (b) return b;
  if (it.t === 'stroke') {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of it.pts) { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; }
    const h = it.size * (1 + (it.k || 0)) / 2 + 1; b = { x0: x0 - h, y0: y0 - h, x1: x1 + h, y1: y1 + h };
  } else if (it.t === 'shape') {
    const h = it.size / 2 + (it.kind === 'arrow' ? Math.max(10, it.size * 4.5) : 1);
    b = { x0: Math.min(it.x1, it.x2) - h, y0: Math.min(it.y1, it.y2) - h, x1: Math.max(it.x1, it.x2) + h, y1: Math.max(it.y1, it.y2) + h };
  } else b = { x0: it.x, y0: it.y, x1: it.x + it.w, y1: it.y + it.h };
  bboxCache.set(it, b); return b;
}
function unionBox(items) {
  let b = null;
  for (const it of items) { const c = bbox(it); if (!b) b = { ...c }; else { b.x0 = Math.min(b.x0, c.x0); b.y0 = Math.min(b.y0, c.y0); b.x1 = Math.max(b.x1, c.x1); b.y1 = Math.max(b.y1, c.y1); } }
  return b;
}
function contentBottom(items) { let m = 0; for (const it of items) m = Math.max(m, bbox(it).y1); return m; }

function distSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay, l = dx * dx + dy * dy;
  let t = l ? ((px - ax) * dx + (py - ay) * dy) / l : 0; t = clamp(t, 0, 1);
  const x = ax + t * dx - px, y = ay + t * dy - py; return Math.sqrt(x * x + y * y);
}
function shapePoly(it) {
  let p = polyCache.get(it); if (p) return p;
  const { x1, y1, x2, y2 } = it;
  if (it.kind === 'rect') { const x = Math.min(x1, x2), y = Math.min(y1, y2), X = Math.max(x1, x2), Y = Math.max(y1, y2); p = [[x, y], [X, y], [X, Y], [x, Y], [x, y]]; }
  else if (it.kind === 'ellipse') { const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2, rx = Math.abs(x2 - x1) / 2, ry = Math.abs(y2 - y1) / 2; p = []; for (let i = 0; i <= 48; i++) { const a = i / 48 * Math.PI * 2; p.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } }
  else p = [[x1, y1], [x2, y2]];
  polyCache.set(it, p); return p;
}
function hitItem(it, x, y, r) {
  const b = bbox(it);
  if (x < b.x0 - r || x > b.x1 + r || y < b.y0 - r || y > b.y1 + r) return false;
  if (it.t === 'text' || it.t === 'image') return true;
  const pts = it.t === 'stroke' ? it.pts : shapePoly(it);
  const rr = r + it.size / 2;
  if (pts.length === 1) return Math.hypot(pts[0][0] - x, pts[0][1] - y) <= rr;
  for (let i = 1; i < pts.length; i++) if (distSeg(x, y, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]) <= rr) return true;
  return false;
}
function densify(pts, gap) {
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (d > gap) { const n = Math.ceil(d / gap); for (let k = 1; k < n; k++) { const t = k / n; out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]); } }
    out.push(b);
  }
  return out;
}
/** Partial eraser: cut points within radius, return remaining pieces (or null if untouched). */
function splitStroke(it, cx, cy, r) {
  if (!hitItem(it, cx, cy, r)) return null;
  const rr = r + it.size * .35, rr2 = rr * rr;
  const pts = densify(it.pts, Math.max(.8, rr * .35));
  const runs = []; let cur = [];
  for (const p of pts) {
    if ((p[0] - cx) ** 2 + (p[1] - cy) ** 2 <= rr2) { if (cur.length) { runs.push(cur); cur = []; } }
    else cur.push(p);
  }
  if (cur.length) runs.push(cur);
  if (runs.length === 1 && runs[0].length === pts.length) return null;
  return runs.filter(r => r.length >= 2).map(run => ({ ...it, id: uid(), pts: run.map(p => [r2(p[0]), r2(p[1]), r2(p[2])]) }));
}
function inPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function transformItem(it, f) {
  const { tx = 0, ty = 0, s = 1, ox = 0, oy = 0 } = f;
  const X = v => r2(ox + (v - ox) * s + tx), Y = v => r2(oy + (v - oy) * s + ty);
  switch (it.t) {
    case 'stroke': return { ...it, pts: it.pts.map(p => [X(p[0]), Y(p[1]), p[2]]), size: r2(it.size * s) };
    case 'shape': return { ...it, x1: X(it.x1), y1: Y(it.y1), x2: X(it.x2), y2: Y(it.y2), size: r2(it.size * s) };
    case 'image': return { ...it, x: X(it.x), y: Y(it.y), w: r2(it.w * s), h: r2(it.h * s) };
    case 'text': return { ...it, x: X(it.x), y: Y(it.y), size: r2(it.size * s), w: it.w ? r2(it.w * s) : it.w };
  }
  return it;
}

/* =========================================================================
   Canvas setup & camera
   ========================================================================= */
const board = $('#board'), cMain = $('#cMain'), cLive = $('#cLive'), overlay = $('#overlay');
const mctx = cMain.getContext('2d');
const lctx = cLive.getContext('2d', { desynchronized: true });
let vw = 1, vh = 1, dpr = 1, bRect = { left: 0, top: 0 };
let colors = {};

function readColors() { const cs = getComputedStyle(document.documentElement); colors = { desk: cs.getPropertyValue('--desk').trim(), accent: cs.getPropertyValue('--accent').trim() }; }

function resize() {
  const r = board.getBoundingClientRect(); bRect = r;
  // integer CSS size so canvas pixels map 1:1 to screen pixels (no blur)
  vw = Math.max(1, Math.floor(r.width)); vh = Math.max(1, Math.floor(r.height)); dpr = window.devicePixelRatio || 1;
  for (const c of [cMain, cLive]) { c.width = Math.round(vw * dpr); c.height = Math.round(vh * dpr); c.style.width = vw + 'px'; c.style.height = vh + 'px'; }
  camChanged();
}
const toPage = (sx, sy) => [(sx - cam.x) / cam.z, (sy - cam.y) / cam.z];
const evPage = e => toPage(e.clientX - bRect.left, e.clientY - bRect.top);
const evScreen = e => [e.clientX - bRect.left, e.clientY - bRect.top];

function updatePageH() { pageH = Math.max(SHEET_H, Math.ceil((contentBottom(page.items) + SHEET_H * .55) / SHEET_H) * SHEET_H); }
function clampCam() {
  cam.z = clamp(cam.z, .2, 8);
  const pw = PW * cam.z, ph = pageH * cam.z;
  if (pw + 48 <= vw) cam.x = (vw - pw) / 2;
  else cam.x = clamp(cam.x, vw - pw - 40, 40);
  cam.y = clamp(cam.y, Math.min(24, vh - ph - 80), 24);
}
function camChanged() {
  clampCam();
  overlay.style.transform = `translate(${cam.x}px,${cam.y}px) scale(${cam.z})`;
  const pct = Math.round(cam.z * 100) + '%';
  $('#zoomLbl').textContent = pct; $('#zoomLbl2').textContent = pct;
  if (page) camByPage.set(page.id, { ...cam });
  requestRender();
}
function fitZoom() { return clamp((vw - 64) / PW, .3, 1.5); }
function zoomAt(f, sx = vw / 2, sy = vh / 2) {
  const z = clamp(cam.z * f, .2, 8); const k = z / cam.z;
  cam.x = sx - (sx - cam.x) * k; cam.y = sy - (sy - cam.y) * k; cam.z = z; camChanged();
}
function setZoom(z) { zoomAt(z / cam.z, vw / 2, vh / 2); }
function fitWidth() { const top = toPage(0, 0)[1]; cam.z = fitZoom(); cam.x = (vw - PW * cam.z) / 2; cam.y = -top * cam.z; camChanged(); }

/* =========================================================================
   Rendering
   ========================================================================= */
let needMain = false, needLive = false, raf = 0;
function requestRender() { needMain = needLive = true; schedule(); }
function requestLive() { needLive = true; schedule(); }
function schedule() { if (!raf) raf = requestAnimationFrame(frame); }
function frame() { raf = 0; if (needMain) { needMain = false; drawMain(); } if (needLive) { needLive = false; drawLive(); } }

function visRect() { const [x0, y0] = toPage(0, 0), [x1, y1] = toPage(vw, vh); return { x0, y0, x1, y1 }; }
function bgSpacing(t) { return { ruled: 28, narrow: 22, wide: 34, grid: 20, dots: 20 }[t] || 0; }
function bgInk(dark) { return dark ? { line: 'rgba(255,255,255,0.10)', margin: 'rgba(255,120,120,0.40)', dot: 'rgba(255,255,255,0.22)' } : { line: 'rgba(90,120,180,0.26)', margin: 'rgba(230,80,80,0.55)', dot: 'rgba(80,100,140,0.38)' }; }

function drawBackground(c, bg, y0, y1, dark) {
  const t = bg.type, sp = bgSpacing(t), ink = bgInk(dark);
  y0 = Math.max(0, y0); y1 = Math.min(pageH, y1);
  c.lineWidth = .8;
  if (t === 'ruled' || t === 'narrow' || t === 'wide') {
    c.strokeStyle = ink.line; c.beginPath();
    let y = LINE_TOP + Math.max(0, Math.floor((y0 - LINE_TOP) / sp)) * sp;
    for (; y <= y1; y += sp) { c.moveTo(0, y); c.lineTo(PW, y); }
    c.stroke();
  } else if (t === 'grid') {
    c.strokeStyle = ink.line; c.beginPath();
    for (let y = Math.floor(y0 / sp) * sp; y <= y1; y += sp) { c.moveTo(0, y); c.lineTo(PW, y); }
    for (let x = 0; x <= PW; x += sp) { c.moveTo(x, y0); c.lineTo(x, y1); }
    c.stroke();
  } else if (t === 'dots') {
    c.fillStyle = ink.dot;
    for (let y = Math.floor(y0 / sp) * sp; y <= y1; y += sp) for (let x = sp; x < PW; x += sp) c.fillRect(x - .9, y - .9, 1.8, 1.8);
  }
  if (bg.margin && t !== 'plain' && t !== 'grid' && t !== 'dots') {
    c.strokeStyle = ink.margin; c.beginPath(); c.moveTo(MARGIN_X, y0); c.lineTo(MARGIN_X, y1); c.stroke();
  }
}
function fmtDate(t) { return new Date(t).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); }
function fmtTime(t) { return new Date(t).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }); }
function drawHeader(c, pg, dark) {
  c.strokeStyle = dark ? 'rgba(255,255,255,.28)' : 'rgba(0,0,0,.28)'; c.lineWidth = 1;
  c.beginPath(); c.moveTo(MARGIN_X - 4, 78); c.lineTo(500, 78); c.stroke();
  c.fillStyle = dark ? 'rgba(255,255,255,.55)' : 'rgba(0,0,0,.5)';
  c.font = '13px "Segoe UI", system-ui, sans-serif'; c.textBaseline = 'top';
  c.fillText(fmtDate(pg.created), MARGIN_X + 2, 86);
  c.fillText(fmtTime(pg.created), MARGIN_X + 2 + Math.max(200, c.measureText(fmtDate(pg.created)).width + 32), 86);
}
const imgCache = new Map();
function getImg(src) {
  let im = imgCache.get(src);
  if (!im) { im = new Image(); im.onload = () => requestRender(); im.src = src; imgCache.set(src, im); }
  return im;
}
function drawItem(c, it, dark) {
  if (it.t === 'text') return;
  if (it.t === 'image') { const im = getImg(it.src); if (im.complete && im.naturalWidth) c.drawImage(im, it.x, it.y, it.w, it.h); return; }
  c.globalAlpha = itemOpacity(it);
  const col = adaptColor(it.color, dark);
  if (it.t === 'stroke') { c.fillStyle = col; c.fill(itemPath(it)); }
  else { c.strokeStyle = col; c.lineWidth = it.size; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke(itemPath(it)); }
  c.globalAlpha = 1;
}
function drawItems(c, items, v, dark) {
  for (let layer = 0; layer < 3; layer++) for (const it of items) {
    if (it.t === 'text' || layerOf(it) !== layer || (hiddenIds && hiddenIds.has(it.id))) continue;
    const b = bbox(it); const dy = spaceShift && b.y0 >= spaceShift.y0 ? spaceShift.dy : 0;
    if (b.y1 + dy < v.y0 || b.y0 + dy > v.y1 || b.x1 < v.x0 || b.x0 > v.x1) continue;
    if (dy) { c.save(); c.translate(0, dy); drawItem(c, it, dark); c.restore(); } else drawItem(c, it, dark);
  }
}
function drawMain() {
  const c = mctx, z = cam.z, dark = darkPaper();
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.fillStyle = colors.desk; c.fillRect(0, 0, cMain.width, cMain.height);
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.save(); c.shadowColor = 'rgba(0,0,0,.14)'; c.shadowBlur = 14; c.shadowOffsetY = 2;
  c.fillStyle = paperOf(page.bg); c.fillRect(cam.x, cam.y, PW * z, pageH * z); c.restore();
  c.setTransform(dpr * z, 0, 0, dpr * z, dpr * cam.x, dpr * cam.y);
  const v = visRect();
  c.save(); c.beginPath(); c.rect(0, 0, PW, pageH); c.clip();
  drawBackground(c, page.bg, v.y0, v.y1, dark);
  if (v.y0 < 120) drawHeader(c, page, dark);
  drawItems(c, page.items, v, dark);
  if (nb.settings.breaks) {
    c.strokeStyle = dark ? 'rgba(255,255,255,.22)' : 'rgba(0,0,0,.22)'; c.lineWidth = 1 / z; c.setLineDash([6 / z, 6 / z]);
    c.beginPath(); for (let y = SHEET_H; y < pageH; y += SHEET_H) if (y > v.y0 && y < v.y1) { c.moveTo(0, y); c.lineTo(PW, y); } c.stroke(); c.setLineDash([]);
  }
  c.restore();
  // text elements follow insert-space / move previews
  if (spaceShift) for (const it of page.items) if (it.t === 'text') { const el = textEls.get(it.id); if (el) el.style.transform = bbox(it).y0 >= spaceShift.y0 ? `translateY(${spaceShift.dy}px)` : ''; }
}

function drawLive() {
  const c = lctx, z = cam.z, dark = page ? darkPaper() : false;
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cLive.width, cLive.height);
  c.setTransform(dpr * z, 0, 0, dpr * z, dpr * cam.x, dpr * cam.y);
  if (act) switch (act.type) {
    case 'ink': {
      if (act.straight) { drawItem(c, straightItem(act), dark); break; }
      const it = { ...inkProto(act), pts: act.pts };
      c.globalAlpha = itemOpacity(it); c.fillStyle = adaptColor(it.color, dark);
      c.beginPath(); emitInk(it, canvasSink(c)); c.fill('nonzero');
      c.globalAlpha = 1; break;
    }
    case 'shape': drawItem(c, shapeFromAct(act), dark); break;
    case 'lasso': {
      c.strokeStyle = colors.accent; c.lineWidth = 1.5 / z; c.setLineDash([5 / z, 4 / z]);
      c.fillStyle = 'rgba(119,25,170,.06)';
      c.beginPath(); act.poly.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.closePath(); c.fill(); c.stroke(); c.setLineDash([]); break;
    }
    case 'space': {
      c.strokeStyle = colors.accent; c.lineWidth = 1.5 / z; c.setLineDash([6 / z, 4 / z]);
      c.beginPath(); c.moveTo(0, act.y0); c.lineTo(PW, act.y0); c.moveTo(0, act.y0 + act.dy); c.lineTo(PW, act.y0 + act.dy); c.stroke(); c.setLineDash([]);
      c.fillStyle = 'rgba(119,25,170,.07)'; c.fillRect(0, Math.min(act.y0, act.y0 + act.dy), PW, Math.abs(act.dy)); break;
    }
    case 'move': case 'scale': {
      const f = act.xf;
      for (let layer = 0; layer < 3; layer++) for (const it of page.items) if (sel.ids.has(it.id) && layerOf(it) === layer) {
        c.save(); c.translate(f.ox + f.tx, f.oy + f.ty); c.scale(f.s, f.s); c.translate(-f.ox, -f.oy); drawItem(c, it, dark); c.restore();
      }
      break;
    }
  }
  // selection box
  const sb = $('#selbar');
  if (sel && sel.ids.size && !(act && (act.type === 'lasso'))) {
    let b = selBox();
    if (b) {
      if (act && act.xf) { const f = act.xf; const T = (x, o, t) => o + (x - o) * f.s + t; b = { x0: T(b.x0, f.ox, f.tx), y0: T(b.y0, f.oy, f.ty), x1: T(b.x1, f.ox, f.tx), y1: T(b.y1, f.oy, f.ty) }; }
      const s0 = [b.x0 * z + cam.x - 6, b.y0 * z + cam.y - 6], s1 = [b.x1 * z + cam.x + 6, b.y1 * z + cam.y + 6];
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.strokeStyle = colors.accent; c.lineWidth = 1.2; c.setLineDash([5, 4]);
      c.strokeRect(s0[0], s0[1], s1[0] - s0[0], s1[1] - s0[1]); c.setLineDash([]);
      c.fillStyle = '#fff'; c.lineWidth = 1.6;
      c.beginPath(); c.rect(s1[0] - 6, s1[1] - 6, 12, 12); c.fill(); c.stroke();
      if (!act) {
        sb.classList.add('on');
        const w = sb.offsetWidth, h = sb.offsetHeight;
        let top = s0[1] - h - 10; if (top < 8) top = s1[1] + 12; if (top + h > vh - 8) top = Math.max(8, s0[1] + 8);
        sb.style.left = clamp((s0[0] + s1[0]) / 2 - w / 2, 8, vw - w - 8) + 'px'; sb.style.top = top + 'px';
      } else sb.classList.remove('on');
    }
  } else sb.classList.remove('on');
  // eraser cursor
  if (hover && (tool === 'eraser' || (act && act.type === 'erase'))) {
    const r = nb.settings.eraser.size / 2;
    c.setTransform(dpr * z, 0, 0, dpr * z, dpr * cam.x, dpr * cam.y);
    c.lineWidth = 1.2 / z; c.strokeStyle = 'rgba(0,0,0,.6)'; c.fillStyle = 'rgba(255,255,255,.35)';
    c.beginPath(); c.arc(hover[0], hover[1], r, 0, 7); c.fill(); c.stroke();
    c.strokeStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.arc(hover[0], hover[1], r + 1.2 / z, 0, 7); c.stroke();
  }
}

/* =========================================================================
   Text overlay (DOM)
   ========================================================================= */
const textEls = new Map();
function clearTextEls() { for (const el of textEls.values()) el.remove(); textEls.clear(); }
function styleText(el, it) {
  el.style.left = it.x + 'px'; el.style.top = it.y + 'px'; el.style.fontSize = it.size + 'px';
  el.style.maxWidth = (it.w || Math.max(80, PW - it.x - 24)) + 'px'; el.style.width = it.w ? it.w + 'px' : '';
  el.style.color = it.color ? adaptColor(it.color, darkPaper()) : '';
}
function syncOverlay() {
  const seen = new Set();
  for (const it of page.items) {
    if (it.t !== 'text') continue;
    seen.add(it.id);
    let el = textEls.get(it.id);
    if (!el) {
      el = document.createElement('div'); el.className = 'tbox'; el.dataset.id = it.id; el.spellcheck = true;
      el.addEventListener('blur', () => { if (editing && editing.id === it.id) setTimeout(() => { if (editing && editing.id === it.id && document.activeElement !== el) commitText(); }, 0); });
      el.addEventListener('keydown', e => {
        if (e.key === 'Escape') { e.preventDefault(); el.blur(); }
        else if (e.key === 'Tab') { e.preventDefault(); document.execCommand('insertText', false, '    '); }
        e.stopPropagation();
      });
      el.addEventListener('paste', e => { e.preventDefault(); e.stopPropagation(); const t = e.clipboardData.getData('text/plain'); document.execCommand('insertText', false, t); });
      overlay.appendChild(el); textEls.set(it.id, el);
    }
    if (el._it !== it) { el._it = it; if (!(editing && editing.id === it.id)) el.innerHTML = it.html; styleText(el, it); }
    el.style.transform = '';
  }
  for (const [id, el] of textEls) if (!seen.has(id)) { el.remove(); textEls.delete(id); }
}
function createText(x, y, html = '') {
  const it = { id: uid(), t: 'text', x: r2(x), y: r2(y), html, size: nb.settings.textSize || 16, color: null };
  const before = page.items;
  page.items = [...page.items, it];
  syncOverlay();
  startEdit(it.id, before, true);
}
function startEdit(id, before = page.items, isNew = false, caretAt) {
  const el = textEls.get(id); if (!el) return;
  editing = { id, before, isNew, html: el.innerHTML };
  el.contentEditable = 'true'; el.classList.add('editing'); el.focus();
  const s = window.getSelection(); let r = null;
  if (caretAt && document.caretRangeFromPoint) r = document.caretRangeFromPoint(caretAt[0], caretAt[1]);
  if (!r || !el.contains(r.startContainer)) { r = document.createRange(); r.selectNodeContents(el); r.collapse(false); }
  s.removeAllRanges(); s.addRange(r);
}
function commitText() {
  if (!editing) return;
  const e = editing; editing = null; lastText = { id: e.id, t: Date.now() };
  const el = textEls.get(e.id); if (!el) return;
  el.contentEditable = 'false'; el.classList.remove('editing');
  const html = el.innerHTML.replace(/(<br>)+$/, '');
  const empty = el.textContent.trim() === '';
  if (empty) {
    if (e.isNew) { page.items = e.before; syncOverlay(); requestRender(); return; }
    commitFrom(e.before, page.items.filter(i => i.id !== e.id)); return;
  }
  if (!e.isNew && html === e.html) return;
  commitFrom(e.before, page.items.map(i => i.id === e.id ? { ...i, html } : i));
}

/* =========================================================================
   History & persistence
   ========================================================================= */
const hist = new Map();
function H() { let h = hist.get(page.id); if (!h) { h = { u: [], r: [] }; hist.set(page.id, h); } return h; }
function commitFrom(before, after) {
  const h = H(); h.u.push({ before, after }); if (h.u.length > 400) h.u.shift(); h.r.length = 0;
  page.items = after; changed();
}
function commit(after) { commitFrom(page.items, after); }
function undo() { if (editing) commitText(); const h = H(), e = h.u.pop(); if (!e) return; h.r.push(e); page.items = e.before; pruneSel(); changed(); }
function redo() { if (editing) commitText(); const h = H(), e = h.r.pop(); if (!e) return; h.u.push(e); page.items = e.after; pruneSel(); changed(); }
function pruneSel() { if (!sel) return; const ids = new Set(page.items.map(i => i.id)); for (const id of [...sel.ids]) if (!ids.has(id)) sel.ids.delete(id); if (!sel.ids.size) sel = null; }
function changed() {
  page.modified = Date.now();
  updatePageH(); syncOverlay(); clampCam(); requestRender(); markDirty(); updateUndo(); renderPageListSoon();
}
function updateUndo() {
  const h = H();
  $$('[data-act="undo"]').forEach(b => b.disabled = !h.u.length);
  $$('[data-act="redo"]').forEach(b => b.disabled = !h.r.length);
}
let saveTimer = 0, dirty = false;
function markDirty() { dirty = true; if (selftest) return; clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 800); }
async function saveNow() {
  clearTimeout(saveTimer); if (!dirty || selftest) return; dirty = false;
  try { await API.save(serialize()); } catch (e) { dirty = true; toast('Could not save: ' + e.message); }
}
function serialize() {
  nb.cur = { s: sec.id, p: page.id };
  return JSON.stringify(nb);
}
window.addEventListener('beforeunload', () => { if (editing) commitText(); if (dirty && !selftest) API.saveSync(serialize()); });

/* =========================================================================
   Pointer input
   ========================================================================= */
const touches = new Map();
let gesture = null;
function capture(id) { try { board.setPointerCapture(id); } catch {} }
const sensitivity = () => SENS[nb.settings.pressure] ?? .4;
function rawPressure(ev) { if (ev.pointerType !== 'pen') return .5; return ev.pressure > 0 ? clamp(ev.pressure, .02, 1) : 0; }
function inkProto(a) {
  const tl = a.pen.tool;
  return { t: 'stroke', v: 2, tool: tl, color: a.pen.color, size: a.pen.size, k: !a.isPen || tl === 'hl' ? 0 : tl === 'pencil' ? a.k * .6 : a.k, sm: a.sm };
}
/* add one pen sample: 1€-filtered position (screen px), eased pressure */
function inkSample(a, ev) {
  const [sx, sy] = evScreen(ev);
  const [fx, fy] = a.flt ? a.flt(sx, sy, ev.timeStamp) : [sx, sy];
  const [px, py] = toPage(fx, fy);
  const rp = rawPressure(ev);
  if (rp > 0) { a.pf = a.pf == null ? rp : a.pf + .3 * (rp - a.pf); if (a.pts.length === 1 && a.lowStart) { a.pts[0][2] = r2(a.pf); a.lowStart = false; } }
  const pr = r2(a.pf ?? .5), last = a.pts[a.pts.length - 1];
  if (Math.hypot(px - last[0], py - last[1]) < .3 / cam.z) { last[2] = Math.max(last[2], pr); return; }
  a.pts.push([r2(px), r2(py), pr]);
}
function straightItem(a) {
  const p = a.pen;
  return { id: uid(), t: 'shape', kind: 'line', x1: r2(a.a[0]), y1: r2(a.a[1]), x2: r2(a.b[0]), y2: r2(a.b[1]), color: p.color, size: p.tool === 'hl' ? p.size : p.size * .85, op: p.tool === 'hl' ? .38 : p.tool === 'pencil' ? .9 : 1, hl: p.tool === 'hl' || undefined };
}
function shapeFromAct(a) {
  let [x1, y1] = a.a, [x2, y2] = a.b;
  if (a.shift) {
    if (a.kind === 'rect' || a.kind === 'ellipse') { const d = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)); x2 = x1 + Math.sign(x2 - x1 || 1) * d; y2 = y1 + Math.sign(y2 - y1 || 1) * d; }
    else { const ang = Math.round(Math.atan2(y2 - y1, x2 - x1) / (Math.PI / 12)) * (Math.PI / 12), L = Math.hypot(x2 - x1, y2 - y1); x2 = x1 + L * Math.cos(ang); y2 = y1 + L * Math.sin(ang); }
  }
  const p = a.pen;
  return { id: uid(), t: 'shape', kind: a.kind, x1: r2(x1), y1: r2(y1), x2: r2(x2), y2: r2(y2), color: p.color, size: p.tool === 'hl' ? p.size : Math.max(1, p.size * .85), op: p.tool === 'hl' ? .38 : 1, hl: p.tool === 'hl' || undefined };
}
function snapAngle(a, b) {
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const st = Math.PI / 4, sn = Math.round(ang / st) * st;
  return Math.abs(ang - sn) < .07 ? [a[0] + L * Math.cos(sn), a[1] + L * Math.sin(sn)] : b;
}

board.addEventListener('pointerdown', onDown);
board.addEventListener('pointermove', onMove);
board.addEventListener('pointerup', onUp);
board.addEventListener('pointercancel', onUp);
board.addEventListener('pointerleave', () => { if (!act) { hover = null; requestLive(); } });
board.addEventListener('contextmenu', e => e.preventDefault());

function onDown(e) {
  if (e.target.closest('#title, .tbox.editing, #selbar, #zoomCtl, #btnSidebar')) return;
  closePops();
  if (document.activeElement && document.activeElement.id === 'title') document.activeElement.blur();
  e.preventDefault();
  const [sx, sy] = evScreen(e);
  if (e.pointerType === 'touch') {
    touches.set(e.pointerId, { x: sx, y: sy });
    capture(e.pointerId);
    if (touches.size >= 2 || !nb.settings.fingerDraw) { if (act && act.ptype === 'touch') cancelAct(); startGesture(); return; }
  }
  if (act) return;
  if (editing) commitText();
  capture(e.pointerId);
  if (e.button === 1 || spaceDown || tool === 'hand' || (e.pointerType === 'mouse' && e.button === 2)) {
    act = { type: 'pan', id: e.pointerId, sx, sy, cx: cam.x, cy: cam.y }; setCursor('grabbing'); return;
  }
  const penEraser = e.pointerType === 'pen' && ((e.buttons & 32) || e.button === 5 || (e.buttons & 2));
  const t = penEraser ? 'eraser' : tool;
  const [x, y] = evPage(e);
  const base = { id: e.pointerId, ptype: e.pointerType };
  switch (t) {
    case 'pen': {
      const rp = rawPressure(e);
      act = { ...base, type: 'ink', pen: { ...pen() }, k: sensitivity(), isPen: e.pointerType === 'pen', pts: [[r2(x), r2(y), rp > .05 ? r2(rp) : .35]],
        pf: rp > .05 ? rp : null, lowStart: !(rp > .05), sm: r2((SMOOTH_PX[nb.settings.smoothing || 'medium'] ?? 3) / cam.z), flt: makeOneEuro(SMOOTH[nb.settings.smoothing || 'medium']), hx: sx, hy: sy };
      if (act.flt) act.flt(sx, sy, e.timeStamp);
      armHold(act); drawLive(); break;
    }
    case 'eraser': {
      act = { ...base, type: 'erase', before: page.items, last: [x, y], mode: penEraser ? 'stroke' : nb.settings.eraser.mode };
      hover = [x, y]; eraseSeg(x, y, x, y); break;
    }
    case 'lasso': {
      const b = sel && selBox();
      if (b) {
        const z = cam.z, hx = b.x1 * z + cam.x + 6, hy = b.y1 * z + cam.y + 6;
        if (Math.abs(sx - hx) < 12 && Math.abs(sy - hy) < 12) { act = { ...base, type: 'scale', b, start: [x, y], xf: { tx: 0, ty: 0, s: 1, ox: b.x0, oy: b.y0 } }; hideSel(); break; }
        if (x >= b.x0 - 6 / z && x <= b.x1 + 6 / z && y >= b.y0 - 6 / z && y <= b.y1 + 6 / z) { act = { ...base, type: 'move', start: [x, y], xf: { tx: 0, ty: 0, s: 1, ox: 0, oy: 0 } }; hideSel(); break; }
      }
      sel = null; act = { ...base, type: 'lasso', poly: [[x, y]] }; requestLive(); break;
    }
    case 'text': {
      const hit = topHit(x, y, 4 / cam.z, i => i.t === 'text');
      if (hit) startEdit(hit.id, page.items, false, [e.clientX, e.clientY]);
      else createText(x - 4, y - (nb.settings.textSize || 16) * .9);
      try { board.releasePointerCapture(e.pointerId); } catch {}
      break;
    }
    case 'space': act = { ...base, type: 'space', y0: y, dy: 0 }; break;
    case 'shape': act = { ...base, type: 'shape', kind: shapeKind, pen: { ...pen() }, a: [x, y], b: [x, y], shift: e.shiftKey }; break;
  }
}

function onMove(e) {
  const [sx, sy] = evScreen(e);
  if (e.pointerType === 'touch' && touches.has(e.pointerId)) { touches.set(e.pointerId, { x: sx, y: sy }); if (gesture) { updateGesture(); return; } }
  if (!act || act.id !== e.pointerId) {
    if (tool === 'eraser' || (e.pointerType === 'pen' && (e.buttons & 32))) { hover = evPage(e); requestLive(); }
    return;
  }
  const [x, y] = evPage(e);
  switch (act.type) {
    case 'pan': cam.x = act.cx + sx - act.sx; cam.y = act.cy + sy - act.sy; camChanged(); break;
    case 'ink': {
      if (act.straight) { act.b = snapAngle(act.a, [x, y]); drawLive(); break; }
      const evs = (e.getCoalescedEvents && e.getCoalescedEvents()) || []; if (!evs.length) evs.push(e);
      for (const ev of evs) inkSample(act, ev);
      if (Math.hypot(sx - act.hx, sy - act.hy) > 4) { act.hx = sx; act.hy = sy; armHold(act); }
      drawLive(); break;
    }
    case 'erase': {
      const evs = (e.getCoalescedEvents && e.getCoalescedEvents()) || [e];
      for (const ev of (evs.length ? evs : [e])) { const [px, py] = evPage(ev); eraseSeg(act.last[0], act.last[1], px, py); act.last = [px, py]; }
      hover = [x, y]; requestLive(); break;
    }
    case 'lasso': { const l = act.poly[act.poly.length - 1]; if (Math.hypot(x - l[0], y - l[1]) * cam.z > 2) act.poly.push([x, y]); requestLive(); break; }
    case 'move': act.xf.tx = x - act.start[0]; act.xf.ty = y - act.start[1]; moveTextPreview(); requestLive(); break;
    case 'scale': {
      const b = act.b, w = b.x1 - b.x0 || 1, h = b.y1 - b.y0 || 1;
      act.xf.s = clamp(((x - b.x0) * w + (y - b.y0) * h) / (w * w + h * h), .05, 20); moveTextPreview(); requestLive(); break;
    }
    case 'space': act.dy = y - act.y0; spaceShift = { y0: act.y0, dy: act.dy }; requestRender(); break;
    case 'shape': act.b = [x, y]; act.shift = e.shiftKey; requestLive(); break;
  }
}

function onUp(e) {
  if (e.pointerType === 'touch' && touches.has(e.pointerId)) {
    touches.delete(e.pointerId);
    if (gesture) { gesture = null; if (touches.size) startGesture(); return; }
  }
  if (!act || act.id !== e.pointerId) return;
  const a = act; act = null;
  switch (a.type) {
    case 'pan': setCursor(); break;
    case 'ink': {
      clearTimeout(a.ht);
      if (a.straight) { if (Math.hypot(a.b[0] - a.a[0], a.b[1] - a.a[1]) > .5) commit([...page.items, straightItem(a)]); }
      else {
        // land the stroke exactly where the pen lifted (the smoothing filter trails slightly)
        if (e.type !== 'pointercancel') {
          const [x, y] = evPage(e), last = a.pts[a.pts.length - 1];
          if (a.pts.length > 1 && Math.hypot(x - last[0], y - last[1]) > .3 / cam.z) a.pts.push([r2(x), r2(y), last[2]]);
        }
        commit([...page.items, { id: uid(), ...inkProto(a), pts: a.pts }]);
      }
      break;
    }
    case 'erase':
      if (page.items !== a.before) { const after = page.items; page.items = a.before; commitFrom(a.before, after); }
      if (tool !== 'eraser') hover = null;
      requestLive(); break;
    case 'lasso': finishLasso(a.poly); break;
    case 'move': case 'scale': {
      hiddenIds = null;
      const f = a.xf;
      if (f.tx || f.ty || f.s !== 1) commit(page.items.map(it => sel.ids.has(it.id) ? transformItem(it, f) : it));
      else { syncOverlay(); requestRender(); }
      break;
    }
    case 'space': {
      spaceShift = null;
      if (Math.abs(a.dy) > 1) commit(page.items.map(it => bbox(it).y0 >= a.y0 ? transformItem(it, { ty: a.dy }) : it));
      else { syncOverlay(); requestRender(); }
      break;
    }
    case 'shape': { const it = shapeFromAct(a); if (Math.hypot(it.x2 - it.x1, it.y2 - it.y1) > 2) commit([...page.items, it]); else requestLive(); break; }
  }
}
function cancelAct() { if (!act) return; if (act.type === 'erase') page.items = act.before; act = null; hiddenIds = null; spaceShift = null; syncOverlay(); requestRender(); }

/* hold still to turn a stroke into a straight line */
function armHold(a) {
  clearTimeout(a.ht);
  if (!nb.settings.straighten) return;
  a.ht = setTimeout(() => {
    if (act !== a || a.straight) return;
    const p0 = a.pts[0], p1 = a.pts[a.pts.length - 1], L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
    if (L * cam.z < 36) return;
    let md = 0; for (const p of a.pts) md = Math.max(md, distSeg(p[0], p[1], p0[0], p0[1], p1[0], p1[1]));
    if (md > Math.max(5, L * .1)) return;
    a.straight = true; a.a = [p0[0], p0[1]]; a.b = snapAngle(a.a, [p1[0], p1[1]]); drawLive();
  }, 650);
}

function eraseSeg(x0, y0, x1, y1) {
  const r = nb.settings.eraser.size / 2, d = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(d / (r * .5)));
  let items = page.items;
  for (let k = 0; k <= n; k++) {
    const t = k / n, cx = x0 + (x1 - x0) * t, cy = y0 + (y1 - y0) * t;
    let out = null;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.t !== 'stroke' && it.t !== 'shape') { if (out) out.push(it); continue; }
      if (act.mode === 'stroke' || it.t === 'shape') {
        if (hitItem(it, cx, cy, r)) { if (!out) out = items.slice(0, i); } else if (out) out.push(it);
      } else {
        const parts = splitStroke(it, cx, cy, r);
        if (parts === null) { if (out) out.push(it); } else { if (!out) out = items.slice(0, i); out.push(...parts); }
      }
    }
    if (out) items = out;
  }
  if (items !== page.items) { page.items = items; requestRender(); }
}

function startGesture() {
  const pts = [...touches.values()];
  if (pts.length === 1) gesture = { n: 1, sx: pts[0].x, sy: pts[0].y, cx: cam.x, cy: cam.y };
  else { const [a, b] = pts; const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2; gesture = { n: 2, d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, z0: cam.z, pm: toPage(mx, my) }; }
}
function updateGesture() {
  const pts = [...touches.values()];
  if (gesture.n === 1 && pts.length === 1) { cam.x = gesture.cx + pts[0].x - gesture.sx; cam.y = gesture.cy + pts[0].y - gesture.sy; }
  else if (gesture.n === 2 && pts.length >= 2) {
    const [a, b] = pts, mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    cam.z = clamp(gesture.z0 * Math.hypot(a.x - b.x, a.y - b.y) / gesture.d0, .2, 8);
    cam.x = mx - gesture.pm[0] * cam.z; cam.y = my - gesture.pm[1] * cam.z;
  }
  camChanged();
}

board.addEventListener('wheel', e => {
  e.preventDefault();
  let dx = e.deltaX, dy = e.deltaY; if (e.deltaMode === 1) { dx *= 18; dy *= 18; }
  if (e.ctrlKey) { const [sx, sy] = evScreen(e); zoomAt(Math.exp(-dy * (Math.abs(dy) < 40 ? .012 : .0022)), sx, sy); return; }
  if (e.shiftKey && !dx) { dx = dy; dy = 0; }
  cam.x -= dx; cam.y -= dy; camChanged();
}, { passive: false });

/* =========================================================================
   Selection
   ========================================================================= */
function selItems() { return sel ? page.items.filter(i => sel.ids.has(i.id)) : []; }
function selBox() { const it = selItems(); return it.length ? unionBox(it) : null; }
function hideSel() { hiddenIds = sel.ids; setCursor(act.type === 'scale' ? 'nwse' : 'move'); requestRender(); }
function moveTextPreview() {
  const f = act.xf;
  for (const it of selItems()) if (it.t === 'text') {
    const el = textEls.get(it.id); if (!el) continue;
    const nx = f.ox + (it.x - f.ox) * f.s + f.tx, ny = f.oy + (it.y - f.oy) * f.s + f.ty;
    el.style.transformOrigin = '0 0'; el.style.transform = `translate(${nx - it.x}px,${ny - it.y}px) scale(${f.s})`;
  }
}
function topHit(x, y, r, filter = () => true) {
  for (let layer = 2; layer >= 0; layer--) for (let i = page.items.length - 1; i >= 0; i--) {
    const it = page.items[i];
    if (it.t === 'text' ? layer !== 2 : layerOf(it) !== layer) continue;
    if (filter(it) && hitItem(it, x, y, r)) return it;
  }
  return null;
}
function finishLasso(poly) {
  let len = 0; for (let i = 1; i < poly.length; i++) len += Math.hypot(poly[i][0] - poly[i - 1][0], poly[i][1] - poly[i - 1][1]);
  const ids = new Set();
  if (len * cam.z < 8) { const it = topHit(poly[0][0], poly[0][1], 6 / cam.z); if (it) ids.add(it.id); }
  else for (const it of page.items) {
    let ok = false;
    if (it.t === 'stroke') {
      const n = it.pts.length, step = Math.max(1, Math.floor(n / 40)); let a = 0, c = 0;
      for (let i = 0; i < n; i += step) { c++; if (inPoly(it.pts[i][0], it.pts[i][1], poly)) a++; }
      ok = a / c >= .6;
    } else if (it.t === 'shape') ok = inPoly(it.x1, it.y1, poly) && inPoly(it.x2, it.y2, poly);
    else { const b = bbox(it); ok = inPoly((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, poly); }
    if (ok) ids.add(it.id);
  }
  sel = ids.size ? { ids } : null;
  requestLive();
}
function deleteSel() { if (!sel) return; const ids = sel.ids; sel = null; commit(page.items.filter(i => !ids.has(i.id))); }
function copySel(cut) {
  const items = selItems(); if (!items.length) return false;
  clip = JSON.parse(JSON.stringify(items)); pasteN = 0;
  try { navigator.clipboard.writeText('inknote-clip:' + Date.now()); } catch {}
  if (cut) deleteSel();
  toast(cut ? 'Cut' : 'Copied'); return true;
}
function pasteClip(at) {
  if (!clip || !clip.length) return;
  pasteN++;
  let f = { tx: 24 * pasteN, ty: 24 * pasteN };
  if (at) { const b = unionBox(clip); f = { tx: at[0] - (b.x0 + b.x1) / 2, ty: at[1] - (b.y0 + b.y1) / 2 }; }
  const items = clip.map(it => transformItem({ ...it, id: uid() }, f));
  commit([...page.items, ...items]);
  sel = { ids: new Set(items.map(i => i.id)) }; setTool('lasso'); requestLive();
}
function duplicateSel() { const items = selItems(); if (!items.length) return; const dup = items.map(it => transformItem({ ...it, id: uid() }, { tx: 24, ty: 24 })); commit([...page.items, ...dup]); sel = { ids: new Set(dup.map(i => i.id)) }; requestLive(); }
function recolorSel(color) {
  if (!sel) return;
  commit(page.items.map(it => {
    if (!sel.ids.has(it.id)) return it;
    if (it.t === 'stroke' || it.t === 'shape') { if (it.tool === 'hl' || it.hl) return it; return { ...it, color }; }
    if (it.t === 'text') return { ...it, color: color === '#111111' ? null : color, html: it.html.replace(/<font[^>]*>|<\/font>/gi, '') };
    return it;
  }));
}
function selectAll() { if (!page.items.length) return; sel = { ids: new Set(page.items.map(i => i.id)) }; setTool('lasso'); requestLive(); }
function renderSelbar() {
  const sb = $('#selbar');
  sb.innerHTML = `
    <button class="ib" data-s="cut" title="Cut">${icon('cut')}</button>
    <button class="ib" data-s="copy" title="Copy">${icon('copy')}</button>
    <button class="ib" data-s="dup" title="Duplicate (Ctrl+D)">${icon('dup')}</button>
    <button class="ib" data-s="front" title="Bring to front">${icon('front')}</button>
    <button class="ib" data-s="del" title="Delete">${icon('trash')}</button>
    <span class="sep" style="height:20px;margin:0 4px"></span>
    ${['#111111', '#d32f2f', '#1565c0', '#2e7d32', '#ef6c00', '#9c27b0'].map(c => `<span class="sw" data-c="${c}" style="background:${c}" title="Recolor"></span>`).join('')}`;
  sb.addEventListener('pointerdown', e => e.stopPropagation());
  sb.addEventListener('click', e => {
    const b = e.target.closest('[data-s]'), s = e.target.closest('[data-c]');
    if (s) return recolorSel(s.dataset.c);
    if (!b) return;
    ({ cut: () => copySel(true), copy: () => copySel(false), dup: duplicateSel, del: deleteSel,
       front: () => { const ids = sel.ids; commit([...page.items.filter(i => !ids.has(i.id)), ...page.items.filter(i => ids.has(i.id))]); } })[b.dataset.s]();
  });
}

/* =========================================================================
   Images
   ========================================================================= */
function fileToDataURL(f) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); }); }
function loadImage(src) { return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; }); }
async function insertImageFile(file, at) {
  try {
    let src = await fileToDataURL(file);
    let im = await loadImage(src);
    const MAX = 2000;
    if (im.naturalWidth > MAX || im.naturalHeight > MAX) {
      const k = MAX / Math.max(im.naturalWidth, im.naturalHeight);
      const cv = document.createElement('canvas'); cv.width = Math.round(im.naturalWidth * k); cv.height = Math.round(im.naturalHeight * k);
      cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
      src = file.type === 'image/png' ? cv.toDataURL('image/png') : cv.toDataURL('image/jpeg', .9);
      im = await loadImage(src);
    }
    let w = Math.min(PW - 2 * MARGIN_X - 20, im.naturalWidth / (window.devicePixelRatio || 1)), h = w * im.naturalHeight / im.naturalWidth;
    const v = visRect();
    let x = at ? at[0] - w / 2 : (PW - w) / 2, y = at ? at[1] - h / 2 : Math.max(LINE_TOP, v.y0 + 40);
    x = clamp(x, 0, PW - w);
    const it = { id: uid(), t: 'image', x: r2(x), y: r2(y), w: r2(w), h: r2(h), src };
    commit([...page.items, it]);
    sel = { ids: new Set([it.id]) }; setTool('lasso');
  } catch (e) { toast('Could not insert picture'); }
}
$('#filePic').addEventListener('change', async e => { for (const f of e.target.files) await insertImageFile(f); e.target.value = ''; });
board.addEventListener('dragover', e => e.preventDefault());
board.addEventListener('drop', async e => {
  e.preventDefault(); const at = evPage(e);
  for (const f of e.dataTransfer.files) if (f.type.startsWith('image/')) await insertImageFile(f, at);
});
document.addEventListener('paste', async e => {
  if (e.target.closest && e.target.closest('input, .tbox.editing')) return;
  const files = [...(e.clipboardData?.files || [])].filter(f => f.type.startsWith('image/'));
  if (files.length) { e.preventDefault(); for (const f of files) await insertImageFile(f); return; }
  const txt = e.clipboardData?.getData('text/plain') || '';
  if (txt.startsWith('inknote-clip:') && clip) { e.preventDefault(); pasteClip(); return; }
  if (clip && !txt) { pasteClip(); return; }
  if (txt.trim()) { e.preventDefault(); const v = visRect(); createText(MARGIN_X + 12, Math.max(LINE_TOP, v.y0 + 60)); document.execCommand('insertText', false, txt); commitText(); }
});

/* =========================================================================
   Tools & ribbon UI
   ========================================================================= */
function penCursor() {
  const p = pen(); const c = adaptColor(p.color, darkPaper());
  const r = p.tool === 'hl' ? 5 : 2.5, s = 16;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}"><circle cx="8" cy="8" r="${r}" fill="${c}" stroke="${darkPaper() ? '#000' : '#fff'}" stroke-width="1"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") 8 8, crosshair`;
}
function setCursor(kind) {
  board.className = '';
  board.style.cursor = '';
  if (kind) { board.classList.add('c-' + kind); return; }
  if (spaceDown) { board.classList.add('c-grab'); return; }
  if (tool === 'pen') board.style.cursor = penCursor();
  else board.classList.add('c-' + tool);
}
function setTool(t) {
  if (t !== 'lasso' && sel) { sel = null; requestLive(); }
  if (editing && t !== 'text') commitText();
  tool = t;
  $$('[data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === t));
  $$('[data-shape]').forEach(b => b.classList.toggle('on', t === 'shape' && b.dataset.shape === shapeKind));
  $$('.pen-btn').forEach(b => b.classList.toggle('on', t === 'pen' && b.dataset.id === nb.settings.penId));
  $('#btnShapes').innerHTML = icon(shapeKind);
  if (t !== 'eraser') hover = null;
  setCursor(); requestLive();
}

function penSVG(p) {
  const c = p.color;
  const body = '#f5f5f5', edge = '#c9c9c9';
  if (p.tool === 'hl') return `<svg viewBox="0 0 26 46"><path d="M7.5 19 L9 7 L18 4 L18.5 19Z" fill="${c}"/><rect x="5" y="18" width="16" height="30" rx="3" fill="${body}" stroke="${edge}"/><rect x="5.5" y="18.5" width="15" height="7" fill="${c}"/></svg>`;
  if (p.tool === 'pencil') return `<svg viewBox="0 0 26 46"><path d="M8 19 L13 3 L18 19Z" fill="#e8c38a"/><path d="M11.3 8.5 L13 3 L14.7 8.5Z" fill="${c}"/><rect x="7.5" y="18" width="11" height="30" rx="1.5" fill="${body}" stroke="${edge}"/><rect x="8" y="22" width="10" height="4" fill="${c}"/></svg>`;
  return `<svg viewBox="0 0 26 46"><path d="M8.5 19 L11.5 8 L14.5 8 L17.5 19Z" fill="${c}"/><path d="M11.5 8 L13 2.5 L14.5 8Z" fill="${c}" opacity=".75"/><rect x="7" y="18" width="12" height="30" rx="2.5" fill="${body}" stroke="${edge}"/><rect x="7.5" y="21" width="11" height="5" fill="${c}"/></svg>`;
}
function renderPens() {
  const wrap = $('#pens'); wrap.innerHTML = '';
  nb.settings.pens.forEach((p, i) => {
    const b = document.createElement('button');
    b.className = 'pen-btn' + (tool === 'pen' && p.id === nb.settings.penId ? ' on' : '');
    b.dataset.id = p.id; b.title = `${p.tool === 'hl' ? 'Highlighter' : p.tool === 'pencil' ? 'Pencil' : 'Pen'}${i < 9 ? ` (${i + 1})` : ''} — click again for colour & thickness`;
    b.innerHTML = penSVG(p);
    b.addEventListener('click', () => { if (tool === 'pen' && nb.settings.penId === p.id) openPenPop(b, p); else selectPen(p.id); });
    b.addEventListener('contextmenu', e => { e.preventDefault(); selectPen(p.id); openPenPop(b, p); });
    wrap.appendChild(b);
  });
}
function selectPen(id) { nb.settings.penId = id; setTool('pen'); markDirty(); }
function eraserSVG() { return `<svg viewBox="0 0 26 40"><rect x="5" y="4" width="16" height="13" rx="4" fill="#f48fb1"/><rect x="5" y="15" width="16" height="30" rx="2" fill="#f5f5f5" stroke="#c9c9c9"/><rect x="5.5" y="15.5" width="15" height="4" fill="#cfd8dc"/></svg>`; }

/* ---------- popovers ---------- */
function closePops() { $('#pops').innerHTML = ''; }
function openPop(anchor, html, { align = 'left', cls = '' } = {}) {
  closePops();
  const p = document.createElement('div'); p.className = 'pop ' + cls; p.innerHTML = html;
  $('#pops').appendChild(p);
  const r = anchor.getBoundingClientRect ? anchor.getBoundingClientRect() : anchor;
  let left = align === 'right' ? r.right - p.offsetWidth : r.left;
  left = clamp(left, 8, innerWidth - p.offsetWidth - 8);
  let top = r.bottom + 6; if (top + p.offsetHeight > innerHeight - 8) top = Math.max(8, r.top - p.offsetHeight - 6);
  p.style.left = left + 'px'; p.style.top = top + 'px';
  p.addEventListener('pointerdown', e => e.stopPropagation());
  return p;
}
document.addEventListener('pointerdown', e => { if (!e.target.closest('.pop')) closePops(); });

function openPenPop(anchor, p) {
  const colorsFor = t => t === 'hl' ? HL_COLORS : PEN_COLORS;
  const range = t => t === 'hl' ? [6, 40, 1] : [.5, 14, .1];
  const pop = openPop(anchor, '');
  const render = () => {
    const [mn, mx, st] = range(p.tool);
    pop.innerHTML = `
      <div class="seg" style="margin-bottom:12px">
        ${[['pen', 'Pen'], ['pencil', 'Pencil'], ['hl', 'Highlighter']].map(([k, l]) => `<button data-k="${k}" class="${p.tool === k ? 'on' : ''}">${l}</button>`).join('')}
      </div>
      <div class="preview"><svg width="200" height="34"><path d="M10 22 C 50 4, 80 30, 110 16 S 170 8, 190 20" stroke="${p.color}" stroke-opacity="${p.tool === 'hl' ? .45 : 1}" stroke-width="${p.size}" fill="none" stroke-linecap="round"/></svg></div>
      <h4>Thickness</h4>
      <div class="row"><input type="range" min="${mn}" max="${mx}" step="${st}" value="${p.size}" id="pz"><span class="val">${(+p.size).toFixed(p.tool === 'hl' ? 0 : 1)}</span></div>
      <h4>Colour</h4>
      <div class="grid">${colorsFor(p.tool).map(c => `<span class="sw ${c === p.color ? 'on' : ''}" data-c="${c}" style="background:${c}"></span>`).join('')}
        <label class="sw" title="Custom colour" style="background:conic-gradient(red,yellow,lime,cyan,blue,magenta,red);overflow:hidden"><input type="color" id="pc" value="${p.color.length === 7 ? p.color : '#000000'}" style="opacity:0;width:100%;height:100%"></label></div>
      <div class="row" style="justify-content:space-between;margin:4px 0 0">
        <button class="btn danger" id="pdel">Remove pen</button>
        <button class="btn" id="pdup">Duplicate</button>
      </div>`;
    pop.querySelectorAll('[data-k]').forEach(b => b.onclick = () => {
      p.tool = b.dataset.k;
      if (p.tool === 'hl') { if (p.size < 6) p.size = 16; if (!HL_COLORS.includes(p.color)) p.color = HL_COLORS[0]; }
      else if (p.size > 14) p.size = p.tool === 'pencil' ? 1.8 : 2.4;
      update(); render();
    });
    const pz = pop.querySelector('#pz');
    pz.oninput = () => { p.size = +pz.value; pop.querySelector('.val').textContent = (+p.size).toFixed(p.tool === 'hl' ? 0 : 1); pop.querySelector('.preview path').setAttribute('stroke-width', p.size); update(); };
    pop.querySelectorAll('[data-c]').forEach(s => s.onclick = () => { p.color = s.dataset.c; update(); render(); });
    pop.querySelector('#pc').oninput = e => { p.color = e.target.value; update(); pop.querySelector('.preview path').setAttribute('stroke', p.color); };
    pop.querySelector('#pdel').onclick = () => {
      const ps = nb.settings.pens; if (ps.length <= 1) return;
      const i = ps.indexOf(p); ps.splice(i, 1); nb.settings.penId = ps[Math.max(0, i - 1)].id; closePops(); renderPens(); setTool('pen'); markDirty();
    };
    pop.querySelector('#pdup').onclick = () => { const n = { ...p, id: uid() }; const ps = nb.settings.pens; ps.splice(ps.indexOf(p) + 1, 0, n); nb.settings.penId = n.id; closePops(); renderPens(); setTool('pen'); markDirty(); };
  };
  const update = () => { const b = $(`.pen-btn[data-id="${p.id}"]`); if (b) b.innerHTML = penSVG(p); setCursor(); markDirty(); };
  render();
}
function openEraserPop(anchor) {
  const s = nb.settings.eraser;
  const pop = openPop(anchor, '');
  const render = () => {
    pop.innerHTML = `
      <h4>Eraser</h4>
      <div class="seg" style="margin-bottom:12px">
        <button data-m="stroke" class="${s.mode === 'stroke' ? 'on' : ''}">Stroke eraser</button>
        <button data-m="partial" class="${s.mode === 'partial' ? 'on' : ''}">Point eraser</button>
      </div>
      <h4>Size</h4>
      <div class="seg">${[[6, 'Small'], [16, 'Medium'], [32, 'Large'], [60, 'X-Large']].map(([v, l]) => `<button data-s="${v}" class="${s.size === v ? 'on' : ''}">${l}</button>`).join('')}</div>
      <div class="note" style="margin-top:10px">Tip: the eraser end of your pen, or holding the pen's lower barrel button, erases strokes too.</div>
      <button class="btn danger" id="eclear" style="margin-top:6px">Erase all ink on this page</button>`;
    pop.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { s.mode = b.dataset.m; markDirty(); render(); });
    pop.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { s.size = +b.dataset.s; markDirty(); render(); });
    pop.querySelector('#eclear').onclick = () => { closePops(); const n = page.items.filter(i => i.t !== 'stroke' && i.t !== 'shape'); if (n.length !== page.items.length) { commit(n); toast('Ink cleared — Ctrl+Z to undo'); } };
  };
  render();
}
function openShapesPop(anchor) {
  const pop = openPop(anchor, `<h4>Shapes</h4><div class="row" style="margin:0">${['line', 'arrow', 'rect', 'ellipse'].map(k => `<button class="ib ${k === shapeKind ? 'on' : ''}" data-k="${k}" title="${k}">${icon(k)}</button>`).join('')}</div>
    <div class="note" style="margin-top:8px">Hold Shift for straight angles / perfect squares & circles. Uses the colour of your current pen.<br>Tip: while writing, pause with the pen down to snap a stroke into a straight line.</div>`);
  pop.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { shapeKind = b.dataset.k; closePops(); setTool('shape'); });
}
function showMenu(x, y, entries) {
  const pop = openPop({ left: x, right: x, top: y, bottom: y }, '', { cls: 'menu' });
  for (const en of entries) {
    if (en === '-') { pop.appendChild(document.createElement('hr')); continue; }
    const b = document.createElement('button'); b.textContent = en.label; if (en.danger) b.className = 'danger';
    b.onclick = () => { closePops(); en.fn(); }; pop.appendChild(b);
  }
}
function modal(html) {
  const back = document.createElement('div'); back.className = 'modal-back';
  back.innerHTML = `<div class="modal">${html}</div>`; document.body.appendChild(back);
  back.addEventListener('pointerdown', e => { if (e.target === back) back.remove(); });
  const onKey = e => { if (e.key === 'Escape') { back.remove(); document.removeEventListener('keydown', onKey, true); } };
  document.addEventListener('keydown', onKey, true);
  return back;
}
function confirmBox(title, msg, okLabel = 'Delete') {
  return new Promise(res => {
    const m = modal(`<h3>${esc(title)}</h3><div>${esc(msg)}</div><div class="actions"><button class="btn" data-r="0">Cancel</button><button class="btn primary" data-r="1">${esc(okLabel)}</button></div>`);
    m.querySelectorAll('[data-r]').forEach(b => b.onclick = () => { m.remove(); res(b.dataset.r === '1'); });
  });
}
let toastT = 0;
function toast(msg, action) {
  const t = $('#toast'); t.innerHTML = `<span>${esc(msg)}</span>`;
  if (action) { const b = document.createElement('button'); b.textContent = action.label; b.onclick = () => { action.fn(); t.classList.remove('on'); }; t.appendChild(b); }
  t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), action ? 6000 : 2200);
}

/* ---------- ribbon wiring ---------- */
function switchTab(name) {
  $$('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === name));
  $$('.rib').forEach(r => r.classList.toggle('on', r.dataset.rib === name));
}
const ACTIONS = {
  undo, redo,
  cut: () => copySel(true), copy: () => copySel(false),
  paste: () => { if (clip) pasteClip(); else toast('Nothing copied yet (images: press Ctrl+V)'); },
  delete: deleteSel,
  picture: () => $('#filePic').click(),
  stamp: () => { const v = visRect(); createText(MARGIN_X + 12, Math.max(LINE_TOP - 22, v.y0 + 40)); document.execCommand('insertText', false, `${fmtDate(Date.now())}, ${fmtTime(Date.now())}`); commitText(); },
  newpage: () => addPage(),
  zoomin: () => zoomAt(1.2), zoomout: () => zoomAt(1 / 1.2), zoom100: () => setZoom(1), fit: fitWidth,
  bgall: async () => { if (await confirmBox('Apply background to all pages?', 'Every page in every subject will use this paper style and colour.', 'Apply')) { for (const s of nb.sections) for (const p of s.pages) p.bg = { ...page.bg }; nb.settings.defaultBg = { ...page.bg }; markDirty(); toast('Applied to all pages'); } },
  theme: () => { nb.settings.theme = resolvedTheme() === 'dark' ? 'light' : 'dark'; applyTheme(); markDirty(); },
};
function wireRibbon() {
  $('#ribbon').addEventListener('mousedown', e => { if (e.target.closest('button') && editing) e.preventDefault(); });
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-act]'); if (a && ACTIONS[a.dataset.act]) { ACTIONS[a.dataset.act](); return; }
    const t = e.target.closest('[data-tool]');
    if (t) {
      const name = t.dataset.tool;
      if (name === 'eraser' && tool === 'eraser') return openEraserPop(t);
      if (name === 'shape' && t.id === 'btnShapes') return tool === 'shape' ? openShapesPop(t) : setTool('shape');
      return setTool(name);
    }
    const s = e.target.closest('[data-shape]'); if (s) { shapeKind = s.dataset.shape; setTool('shape'); return; }
    const f = e.target.closest('[data-fmt]'); if (f) { applyFormat(f.dataset.fmt); return; }
  });
  $$('#tabs button').forEach(b => b.addEventListener('click', () => switchTab(b.dataset.tab)));
  $('#btnEraser').innerHTML = eraserSVG();
  $('#btnAddPen').addEventListener('click', () => {
    const p = { id: uid(), tool: 'pen', color: '#111111', size: 2.4 };
    nb.settings.pens.push(p); nb.settings.penId = p.id; renderPens(); setTool('pen'); markDirty();
    openPenPop($(`.pen-btn[data-id="${p.id}"]`), p);
  });
  // text formatting
  $('#fontSize').addEventListener('change', e => {
    const v = +e.target.value; nb.settings.textSize = v; markDirty();
    if (editing) { const id = editing.id; const el = textEls.get(id); el.style.fontSize = v + 'px'; page.items = page.items.map(i => i.id === id ? { ...i, size: v } : i); el._it = page.items.find(i => i.id === id); el.focus(); }
    else if (sel) commit(page.items.map(i => sel.ids.has(i.id) && i.t === 'text' ? { ...i, size: v } : i));
    else if (lastText && Date.now() - lastText.t < 8000 && page.items.some(i => i.id === lastText.id)) {
      commit(page.items.map(i => i.id === lastText.id ? { ...i, size: v } : i));
      const it = page.items.find(i => i.id === lastText.id); startEdit(it.id);
    }
  });
  const tc = $('#textColors');
  tc.innerHTML = TEXT_COLORS.map(c => `<span class="sw" data-tc="${c || ''}" title="Text colour" style="background:${c || 'var(--paper-ink, #222)'}"></span>`).join('');
  tc.addEventListener('mousedown', e => e.preventDefault());
  tc.addEventListener('click', e => {
    const s = e.target.closest('[data-tc]'); if (!s) return; const c = s.dataset.tc;
    if (editing) document.execCommand('foreColor', false, c || (darkPaper() ? '#ededed' : '#1f1f1f'));
    else if (sel) recolorSel(c || '#111111');
  });
  // view
  $('#bgTypes').addEventListener('click', e => { const b = e.target.closest('[data-bg]'); if (!b) return; page.bg = { ...page.bg, type: b.dataset.bg }; nb.settings.defaultBg = { ...page.bg }; bgChanged(); });
  const pc = $('#paperColors');
  pc.innerHTML = Object.keys(PAPERS).map(k => `<span class="sw ${k === 'auto' ? 'auto' : ''}" data-paper="${k}" title="${k === 'auto' ? 'Follow theme' : k}" style="${k === 'auto' ? '' : 'background:' + PAPERS[k]}"></span>`).join('');
  pc.addEventListener('click', e => { const s = e.target.closest('[data-paper]'); if (!s) return; page.bg = { ...page.bg, color: s.dataset.paper }; nb.settings.defaultBg = { ...page.bg }; bgChanged(); });
  $('#chkMargin').addEventListener('change', e => { page.bg = { ...page.bg, margin: e.target.checked }; nb.settings.defaultBg = { ...page.bg }; bgChanged(); });
  $('#chkBreaks').addEventListener('change', e => { nb.settings.breaks = e.target.checked; markDirty(); requestRender(); });
  // top bar
  $('#btnExport').addEventListener('click', openExport);
  $('#btnSettings').addEventListener('click', e => openSettings(e.currentTarget));
  $('#btnFull').addEventListener('click', toggleFull);
  $('#btnSidebar').addEventListener('click', () => { nb.settings.sidebar = !nb.settings.sidebar; applySidebar(); markDirty(); });
  $('#sidebar').addEventListener('transitionend', resize);
  $('#zoomCtl').addEventListener('pointerdown', e => e.stopPropagation());
}
function applyFormat(cmd) {
  if (editing) { document.execCommand(cmd, false, null); return; }
  if (sel) {
    const tag = { bold: 'b', italic: 'i', underline: 'u' }[cmd]; if (!tag) return;
    commit(page.items.map(i => sel.ids.has(i.id) && i.t === 'text' ? { ...i, html: `<${tag}>${i.html}</${tag}>` } : i));
  } else toast('Click into a text box first (T)');
}
function bgChanged() { markDirty(); syncBgUI(); syncOverlayColors(); requestRender(); setCursor(); }
function syncBgUI() {
  $$('#bgTypes [data-bg]').forEach(b => b.classList.toggle('on', b.dataset.bg === page.bg.type));
  $$('#paperColors [data-paper]').forEach(b => b.classList.toggle('on', b.dataset.paper === (page.bg.color || 'auto')));
  $('#chkMargin').checked = !!page.bg.margin; $('#chkBreaks').checked = !!nb.settings.breaks;
}
function syncOverlayColors() {
  overlay.style.setProperty('--paper-ink', darkPaper() ? '#ececec' : '#1f1f1f');
  for (const it of page.items) if (it.t === 'text') { const el = textEls.get(it.id); if (el) styleText(el, it); }
}
function applyTheme() {
  const t = resolvedTheme();
  document.documentElement.dataset.theme = t;
  readColors();
  $('#themeLbl').textContent = t === 'dark' ? 'Light' : 'Dark';
  const ti = $('#ribbon [data-act="theme"] svg'); if (ti) ti.outerHTML = icon(t === 'dark' ? 'sun' : 'moon');
  API.titlebar(t === 'dark' ? { color: '#1f1f1f', symbol: '#e6e6e6' } : { color: '#f3f3f3', symbol: '#333333' });
  if (page) { syncOverlayColors(); setCursor(); }
  requestRender();
}
function applySidebar() { $('#sidebar').classList.toggle('hide', !nb.settings.sidebar); $('#btnSidebar').classList.toggle('flip', !nb.settings.sidebar); setTimeout(resize, 200); }
async function toggleFull() { const fs = await API.fullscreen(); $('#btnFull').innerHTML = icon(fs ? 'compress' : 'expand'); }

/* =========================================================================
   Sections & pages (sidebar)
   ========================================================================= */
function pageLabel(p) {
  if (p.title.trim()) return p.title;
  const t = p.items.find(i => i.t === 'text');
  if (t) { const d = document.createElement('div'); d.innerHTML = t.html; const s = d.textContent.trim(); if (s) return s.slice(0, 60); }
  return '';
}
function renderSections() {
  const L = $('#secList'); L.innerHTML = '';
  nb.sections.forEach(s => {
    const b = document.createElement('button'); b.className = 'sec-item' + (s === sec ? ' on' : ''); b.style.setProperty('--c', s.color);
    b.textContent = s.name; b.title = s.name;
    b.onclick = () => openSection(s);
    b.ondblclick = () => renameSection(s, b);
    b.oncontextmenu = e => {
      e.preventDefault();
      showMenu(e.clientX, e.clientY, [
        { label: 'Rename', fn: () => renameSection(s, b) },
        { label: 'Change colour', fn: () => { s.color = SEC_COLORS[(SEC_COLORS.indexOf(s.color) + 1) % SEC_COLORS.length]; renderSections(); markDirty(); } },
        { label: 'Move up', fn: () => moveIn(nb.sections, s, -1, renderSections) },
        { label: 'Move down', fn: () => moveIn(nb.sections, s, 1, renderSections) },
        '-',
        { label: 'Delete subject', danger: true, fn: () => deleteSection(s) },
      ]);
    };
    L.appendChild(b);
  });
}
function renameSection(s, el) {
  const inp = document.createElement('input'); inp.className = 'rename'; inp.value = s.name;
  el.replaceWith(inp); inp.focus(); inp.select();
  const done = () => { s.name = inp.value.trim() || s.name; markDirty(); renderSections(); $('#secName').textContent = sec.name; };
  inp.onblur = done; inp.onkeydown = e => { if (e.key === 'Enter') inp.blur(); if (e.key === 'Escape') { inp.value = s.name; inp.blur(); } e.stopPropagation(); };
}
function moveIn(arr, x, d, rerender) { const i = arr.indexOf(x), j = i + d; if (j < 0 || j >= arr.length) return; arr.splice(i, 1); arr.splice(j, 0, x); markDirty(); rerender(); }
let plTimer = 0;
function renderPageListSoon() { clearTimeout(plTimer); plTimer = setTimeout(renderPages, 300); }
function renderPages() {
  const q = $('#search').value.trim().toLowerCase();
  const L = $('#pageList'); L.innerHTML = '';
  let list;
  if (q) {
    $('#secName').textContent = 'Search results';
    list = [];
    for (const s of nb.sections) for (const p of s.pages) {
      const txt = (p.title + ' ' + p.items.filter(i => i.t === 'text').map(i => { const d = document.createElement('div'); d.innerHTML = i.html; return d.textContent; }).join(' ')).toLowerCase();
      if (txt.includes(q)) list.push([s, p]);
    }
    if (!list.length) L.innerHTML = '<div class="empty-msg">No pages match. (Handwriting isn\'t searchable — titles and typed text are.)</div>';
  } else { $('#secName').textContent = sec.name; list = sec.pages.map(p => [sec, p]); }
  for (const [s, p] of list) {
    const b = document.createElement('button'); b.className = 'page-item' + (p === page ? ' on' : '');
    const lbl = pageLabel(p);
    b.innerHTML = `<div class="t ${lbl ? '' : 'empty'}">${esc(lbl || 'Untitled page')}</div><div class="d">${q ? esc(s.name) + ' · ' : ''}${new Date(p.created).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</div>`;
    b.onclick = () => { if (s !== sec) { sec = s; renderSections(); } openPage(p); };
    b.oncontextmenu = e => {
      e.preventDefault();
      showMenu(e.clientX, e.clientY, [
        { label: 'Rename', fn: () => { openPage(p); $('#title').focus(); $('#title').select(); } },
        { label: 'Duplicate', fn: () => { const c = JSON.parse(JSON.stringify(p)); c.id = uid(); c.title = (p.title || 'Untitled') + ' (copy)'; c.items.forEach(i => i.id = uid()); s.pages.splice(s.pages.indexOf(p) + 1, 0, c); markDirty(); openPage(c); } },
        { label: 'Move up', fn: () => moveIn(s.pages, p, -1, renderPages) },
        { label: 'Move down', fn: () => moveIn(s.pages, p, 1, renderPages) },
        ...nb.sections.filter(o => o !== s).slice(0, 8).map(o => ({ label: `Move to “${o.name}”`, fn: () => { s.pages.splice(s.pages.indexOf(p), 1); o.pages.unshift(p); if (!s.pages.length) s.pages.push(newPage()); sec = o; markDirty(); renderSections(); openPage(p); } })),
        { label: 'Export this page as PDF', fn: () => { openPage(p); openExport(); } },
        '-',
        { label: 'Delete page', danger: true, fn: () => deletePage(s, p) },
      ]);
    };
    L.appendChild(b);
  }
}
function openSection(s) { if (editing) commitText(); sec = s; $('#search').value = ''; renderSections(); openPage(s.pages[0]); }
function openPage(p) {
  if (editing) commitText();
  if (page) camByPage.set(page.id, { ...cam });
  act = null; sel = null; hiddenIds = null; spaceShift = null;
  page = p; clearTextEls(); updatePageH();
  $('#title').value = p.title;
  const c = camByPage.get(p.id);
  if (c) cam = { ...c }; else { cam.z = fitZoom(); cam.x = (vw - PW * cam.z) / 2; cam.y = 24; }
  syncOverlay(); syncBgUI(); syncOverlayColors(); camChanged(); updateUndo(); renderPages(); setCursor(); markDirty();
}
function addPage() {
  const p = newPage(page ? page.bg : undefined);
  const i = sec.pages.indexOf(page);
  sec.pages.splice(i >= 0 ? i + 1 : sec.pages.length, 0, p);
  $('#search').value = '';
  openPage(p); markDirty();
  setTimeout(() => $('#title').focus(), 30);
}
async function deletePage(s, p) {
  if (p.items.length && !(await confirmBox('Delete this page?', `“${pageLabel(p) || 'Untitled page'}” will be removed. (A daily backup is kept in Documents\\InkNote\\backups.)`))) return;
  const i = s.pages.indexOf(p); s.pages.splice(i, 1);
  if (!s.pages.length) s.pages.push(newPage());
  hist.delete(p.id); markDirty();
  if (p === page) openPage(s.pages[Math.min(i, s.pages.length - 1)]); else renderPages();
}
async function deleteSection(s) {
  const n = s.pages.reduce((a, p) => a + p.items.length, 0);
  if (n && !(await confirmBox(`Delete “${s.name}”?`, `This removes the subject and its ${s.pages.length} page(s).`))) return;
  nb.sections.splice(nb.sections.indexOf(s), 1);
  if (!nb.sections.length) { const ns = newSection('My Notes'); ns.pages.push(newPage()); nb.sections.push(ns); }
  markDirty();
  if (s === sec) openSection(nb.sections[0]); else renderSections();
}
function wireSidebar() {
  $('#addPage').onclick = () => addPage();
  $('#addSec').onclick = () => {
    const s = newSection('New subject', nb.sections.length); s.pages.push(newPage(page.bg)); nb.sections.push(s);
    markDirty(); openSection(s);
    const el = [...$$('.sec-item')].pop(); if (el) renameSection(s, el);
  };
  $('#search').addEventListener('input', renderPages);
  $('#search').addEventListener('keydown', e => { if (e.key === 'Escape') { e.target.value = ''; renderPages(); e.target.blur(); } e.stopPropagation(); });
  const title = $('#title');
  title.addEventListener('input', () => { page.title = title.value; page.modified = Date.now(); markDirty(); renderPageListSoon(); });
  title.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === 'Escape') title.blur(); e.stopPropagation(); });
}

/* =========================================================================
   Settings
   ========================================================================= */
async function openSettings(anchor) {
  const s = nb.settings; const path = await API.dataPath();
  const pop = openPop(anchor, '', { align: 'right' });
  const seg = (key, opts) => `<div class="seg">${opts.map(([v, l]) => `<button data-set="${key}" data-v="${v}" class="${String(s[key]) === String(v) ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  const render = () => {
    pop.innerHTML = `
      <h4>Pen</h4>
      <div class="opt-row"><span>Pressure sensitivity</span>${seg('pressure', [['off', 'Off'], ['low', 'Low'], ['medium', 'Med'], ['high', 'High']])}</div>
      <div class="opt-row"><span>Ink smoothing</span>${seg('smoothing', [['off', 'Off'], ['low', 'Low'], ['medium', 'Med'], ['high', 'High']])}</div>
      <div class="opt-row"><span>Hold pen still → straight line</span>${seg('straighten', [[true, 'On'], [false, 'Off']])}</div>
      <div class="opt-row"><span>Finger / touch draws</span>${seg('fingerDraw', [[false, 'No (pans)'], [true, 'Yes']])}</div>
      <div class="note">XP-Pen: for pressure, turn on <b>Windows Ink</b> in the XP-Pen driver (Pen settings). Eraser end and barrel button (right-click) erase.</div>
      <h4 style="margin-top:12px">Appearance</h4>
      <div class="opt-row"><span>Theme</span>${seg('theme', [['light', 'Light'], ['dark', 'Dark'], ['system', 'System']])}</div>
      <h4 style="margin-top:12px">Your notes</h4>
      <div class="path">Auto-saved to: ${esc(path)}<br>Daily backups are kept in the “backups” folder next to it.</div>
      <div class="row" style="margin-top:10px;flex-wrap:wrap">
        <button class="btn" id="sOpen">Open folder</button>
        <button class="btn" id="sBackup">Save backup…</button>
        <button class="btn" id="sRestore">Restore backup…</button>
      </div>
      <div class="note" style="margin-top:8px">Shortcuts: P pen · E eraser · L lasso · T text · S shapes · 1–9 pens · Space+drag pan · Ctrl+wheel zoom · Ctrl+E export · Ctrl+N new page · F11 full screen</div>`;
    pop.querySelectorAll('[data-set]').forEach(b => b.onclick = () => {
      const k = b.dataset.set; let v = b.dataset.v; if (v === 'true') v = true; else if (v === 'false') v = false;
      s[k] = v; markDirty(); if (k === 'theme') applyTheme(); render();
    });
    pop.querySelector('#sOpen').onclick = () => API.openData();
    pop.querySelector('#sBackup').onclick = async () => { await saveNow(); const f = await API.backupExport(serialize()); if (f) toast('Backup saved'); };
    pop.querySelector('#sRestore').onclick = async () => {
      const txt = await API.backupImport(); if (!txt) return;
      let data; try { data = JSON.parse(txt); if (!data.sections) throw 0; } catch { toast('That file is not an InkNote backup'); return; }
      if (!(await confirmBox('Restore this backup?', 'Your current notebook will be replaced by the backup. (Today\'s state stays in the backups folder.)', 'Restore'))) return;
      await saveNow(); loadNotebook(data); markDirty(); toast('Backup restored');
    };
  };
  render();
}

/* =========================================================================
   PDF export (vector: SVG ink + real text, rendered by Chromium's PDF engine)
   ========================================================================= */
function openExport() {
  if (editing) commitText();
  const o = nb.settings.exportOpts;
  const seg = (k, opts) => `<div class="seg">${opts.map(([v, l]) => `<button data-k="${k}" data-v="${v}" class="${String(o[k]) === String(v) ? 'on' : ''}">${l}</button>`).join('')}</div>`;
  const m = modal('');
  const render = () => {
    m.querySelector('.modal').innerHTML = `
      <h3>Export PDF</h3>
      <div class="field"><div>What</div>${seg('range', [['page', 'This page'], ['section', 'Whole subject'], ['all', 'All notes']])}</div>
      <div class="field"><div>Page size</div>${seg('paper', [['a4', 'A4'], ['letter', 'Letter'], ['cont', 'One long page']])}
        <div class="hint">${o.paper === 'cont' ? 'Each note becomes a single continuous page — the smoothest for scrolling on iPhone.' : 'Splits long notes onto sheets (the dashed page-break lines show where).'}</div></div>
      <div class="field"><div>Paper</div>${seg('lines', [[true, 'With lines/grid'], [false, 'Plain']])}
        <div style="height:8px"></div>${seg('white', [[false, 'As shown'], [true, 'White paper (print friendly)']])}</div>
      <div class="hint">Ink and text are exported as vectors, so they stay razor-sharp at any zoom.</div>
      <div class="actions"><button class="btn" data-x="0">Cancel</button><button class="btn primary" data-x="1">Export</button></div>`;
    m.querySelectorAll('[data-k]').forEach(b => b.onclick = () => { let v = b.dataset.v; if (v === 'true') v = true; else if (v === 'false') v = false; o[b.dataset.k] = v; markDirty(); render(); });
    m.querySelector('[data-x="0"]').onclick = () => m.remove();
    m.querySelector('[data-x="1"]').onclick = async () => { m.remove(); await doExport(o); };
  };
  render();
}
async function doExport(o, silentPath) {
  const pages = o.range === 'page' ? [page] : o.range === 'section' ? sec.pages : nb.sections.flatMap(s => s.pages);
  const name = o.range === 'page' ? (pageLabel(page) || 'Note') : o.range === 'section' ? sec.name : 'InkNote - all notes';
  toast('Exporting PDF…');
  const html = buildExportHTML(pages, o);
  const r = await API.exportPdf({ html, name, silentPath });
  if (r && r.ok) toast('PDF exported', r.file ? { label: 'Show in folder', fn: () => API.showFile(r.file) } : null);
  else if (r && r.error) toast('Export failed: ' + r.error);
  else $('#toast').classList.remove('on');
  return r;
}
function bgSVG(bg, y0, y1, dark) {
  const t = bg.type, sp = bgSpacing(t), ink = bgInk(dark); let d = '', out = '';
  if (t === 'ruled' || t === 'narrow' || t === 'wide') { for (let y = LINE_TOP + Math.max(0, Math.ceil((y0 - LINE_TOP) / sp)) * sp; y <= y1; y += sp) d += `M0 ${r2(y)}H${PW}`; }
  else if (t === 'grid') { for (let y = Math.ceil(y0 / sp) * sp; y <= y1; y += sp) d += `M0 ${y}H${PW}`; for (let x = 0; x <= PW; x += sp) d += `M${x} ${r2(y0)}V${r2(y1)}`; }
  if (d) out += `<path d="${d}" stroke="${ink.line}" stroke-width=".8" fill="none"/>`;
  if (t === 'dots') { let dd = ''; for (let y = Math.ceil(y0 / sp) * sp; y <= y1; y += sp) for (let x = sp; x < PW; x += sp) dd += `M${x - .9} ${y - .9}h1.8v1.8h-1.8z`; out += `<path d="${dd}" fill="${ink.dot}"/>`; }
  if (bg.margin && (t === 'ruled' || t === 'narrow' || t === 'wide')) out += `<path d="M${MARGIN_X} ${r2(y0)}V${r2(y1)}" stroke="${ink.margin}" stroke-width=".8"/>`;
  return out;
}
function itemSVG(it, dark) {
  const col = adaptColor(it.color, dark), op = itemOpacity(it);
  if (it.t === 'stroke') return `<path d="${itemD(it)}" fill="${col}"${op < 1 ? ` fill-opacity="${op}"` : ''}/>`;
  if (it.t === 'shape') return `<path d="${itemD(it)}" fill="none" stroke="${col}" stroke-width="${r2(it.size)}" stroke-linecap="round" stroke-linejoin="round"${op < 1 ? ` stroke-opacity="${op}"` : ''}/>`;
  return '';
}
function buildExportHTML(pages, o) {
  const css = `*{margin:0;padding:0;box-sizing:border-box}html,body{background:#fff}
  @page{margin:0}
  .sheet{position:relative;overflow:hidden;break-after:page}
  .sheet:last-child{break-after:auto}
  .inner{position:absolute;left:0;top:0;transform-origin:0 0}
  .layer{position:absolute;left:0;top:0}
  .img{position:absolute}
  .tbox{position:absolute;white-space:pre-wrap;overflow-wrap:break-word;line-height:1.45;font-family:'Segoe UI',system-ui,sans-serif;padding:2px 4px;min-width:24px}
  .tbox ul,.tbox ol{margin:0;padding-left:1.3em}
  .ttl{position:absolute;left:62px;top:36px;width:440px;height:40px;font:300 24px/40px 'Segoe UI',system-ui,sans-serif;white-space:nowrap;overflow:hidden}
  .dt{position:absolute;top:86px;font:13px/1.25 'Segoe UI',system-ui,sans-serif}`;
  const rules = [], body = []; let n = 0;
  for (const pg of pages) {
    const paper = o.white ? '#ffffff' : paperOf(pg.bg);
    const dark = isDarkPaperColor(paper);
    const cb = contentBottom(pg.items);
    const sheets = [];
    if (o.paper === 'cont') {
      const total = Math.max(SHEET_H, Math.ceil(cb + 60)), MAX = 14000;
      for (let sy = 0; sy < total; sy += MAX) sheets.push({ sy, sh: Math.min(MAX, total - sy), W: PW, s: 1 });
    } else {
      const [W, Hp] = o.paper === 'letter' ? [816, 1056] : [794, 1123];
      const s = W / PW, sh = Hp / s, cnt = Math.max(1, Math.ceil((cb + 10) / sh));
      for (let i = 0; i < cnt; i++) sheets.push({ sy: i * sh, sh, W, s });
    }
    const layered = [0, 1, 2].flatMap(l => pg.items.filter(i => i.t !== 'text' && layerOf(i) === l));
    for (const sh of sheets) {
      n++;
      const y0 = sh.sy, y1 = sh.sy + sh.sh, Hpx = r2(sh.sh * sh.s);
      rules.push(`@page p${n}{size:${sh.W}px ${Hpx}px;margin:0}`);
      const vis = it => { const b = bbox(it); return b.y1 >= y0 - 2 && b.y0 <= y1 + 2; };
      const inkCol = dark ? '#ececec' : '#1f1f1f';
      let h = `<section class="sheet" style="page:p${n};width:${sh.W}px;height:${Hpx}px;background:${paper}"><div class="inner" style="width:${PW}px;height:${r2(y1)}px;transform:scale(${sh.s}) translateY(${r2(-y0)}px);color:${inkCol}">`;
      let bgs = o.lines ? bgSVG(pg.bg, y0, y1, dark) : '';
      if (y0 === 0) {
        bgs += `<path d="M${MARGIN_X - 4} 78H500" stroke="${dark ? 'rgba(255,255,255,.28)' : 'rgba(0,0,0,.28)'}" stroke-width="1"/>`;
      }
      h += `<svg class="layer" width="${PW}" height="${r2(y1)}" viewBox="0 0 ${PW} ${r2(y1)}">${bgs}</svg>`;
      if (y0 === 0) {
        const dc = dark ? 'rgba(255,255,255,.55)' : 'rgba(0,0,0,.5)';
        mctx.font = '13px "Segoe UI", system-ui, sans-serif';
        const dx = MARGIN_X + 2 + Math.max(200, mctx.measureText(fmtDate(pg.created)).width + 32);
        h += `<div class="ttl">${esc(pg.title)}</div><div class="dt" style="left:${MARGIN_X + 2}px;color:${dc}">${esc(fmtDate(pg.created))}</div><div class="dt" style="left:${r2(dx)}px;color:${dc}">${esc(fmtTime(pg.created))}</div>`;
      }
      for (const it of layered) if (it.t === 'image' && vis(it)) h += `<img class="img" src="${it.src}" style="left:${it.x}px;top:${it.y}px;width:${it.w}px;height:${it.h}px">`;
      const ink = layered.filter(i => i.t !== 'image' && vis(i)).map(i => itemSVG(i, dark)).join('');
      if (ink) h += `<svg class="layer" width="${PW}" height="${r2(y1)}" viewBox="0 0 ${PW} ${r2(y1)}">${ink}</svg>`;
      for (const it of pg.items) if (it.t === 'text' && vis(it)) {
        const col = it.color ? adaptColor(it.color, dark) : inkCol;
        h += `<div class="tbox" style="left:${it.x}px;top:${it.y}px;font-size:${it.size}px;max-width:${it.w || Math.max(80, PW - it.x - 24)}px;${it.w ? `width:${it.w}px;` : ''}color:${col}">${it.html}</div>`;
      }
      h += '</div></section>';
      body.push(h);
    }
  }
  return `<!doctype html><html><head><meta charset="utf-8"><title>InkNote export</title><style>${css}${rules.join('')}</style></head><body>${body.join('')}</body></html>`;
}

/* =========================================================================
   Keyboard
   ========================================================================= */
window.addEventListener('keydown', e => {
  const typing = e.target.closest && e.target.closest('input, textarea, select, [contenteditable="true"]');
  const mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
  if (mod && k === 'e') { e.preventDefault(); openExport(); return; }
  if (mod && k === 'n') { e.preventDefault(); addPage(); return; }
  if (mod && k === 's') { e.preventDefault(); dirty = true; saveNow().then(() => toast('Saved')); return; }
  if (mod && (k === '=' || k === '+')) { e.preventDefault(); zoomAt(1.2); return; }
  if (mod && k === '-') { e.preventDefault(); zoomAt(1 / 1.2); return; }
  if (mod && k === '0') { e.preventDefault(); fitWidth(); return; }
  if (k === 'f11') { e.preventDefault(); toggleFull(); return; }
  if (typing) return;
  if (mod && k === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if (mod && k === 'y') { e.preventDefault(); redo(); return; }
  if (mod && k === 'a') { e.preventDefault(); selectAll(); return; }
  if (mod && k === 'c') { if (copySel(false)) e.preventDefault(); return; }
  if (mod && k === 'x') { e.preventDefault(); copySel(true); return; }
  if (mod && k === 'd') { e.preventDefault(); duplicateSel(); return; }
  if (mod) return;
  if (e.key === ' ') { e.preventDefault(); if (!spaceDown) { spaceDown = true; setCursor(); } return; }
  if (e.key === 'Delete' || e.key === 'Backspace') { if (sel) { e.preventDefault(); deleteSel(); } return; }
  if (e.key === 'Escape') { sel = null; closePops(); requestLive(); return; }
  if (k === 'p') setTool('pen');
  else if (k === 'e') setTool('eraser');
  else if (k === 'l') setTool('lasso');
  else if (k === 't') setTool('text');
  else if (k === 's') setTool('shape');
  else if (/^[1-9]$/.test(k)) { const p = nb.settings.pens[+k - 1]; if (p) selectPen(p.id); }
});
window.addEventListener('keyup', e => { if (e.key === ' ') { spaceDown = false; setCursor(); } });
window.addEventListener('blur', () => { spaceDown = false; });

/* =========================================================================
   Boot
   ========================================================================= */
function loadNotebook(data) {
  nb = data && data.sections ? data : defaultNotebook();
  const d = defaultSettings();
  nb.settings = { ...d, ...nb.settings, eraser: { ...d.eraser, ...(nb.settings || {}).eraser }, exportOpts: { ...d.exportOpts, ...(nb.settings || {}).exportOpts } };
  if (!nb.settings.pens || !nb.settings.pens.length) nb.settings.pens = defaultPens();
  if (!nb.settings.penId || !nb.settings.pens.find(p => p.id === nb.settings.penId)) nb.settings.penId = (nb.settings.pens[5] || nb.settings.pens[0]).id;
  if (!nb.sections.length) { const s = newSection('My Notes'); s.pages.push(newPage()); nb.sections.push(s); }
  for (const s of nb.sections) if (!s.pages.length) s.pages.push(newPage());
  sec = nb.sections.find(s => s.id === nb.cur?.s) || nb.sections[0];
  const p = sec.pages.find(p => p.id === nb.cur?.p) || sec.pages[0];
  hist.clear(); camByPage.clear(); page = null;
  applyTheme(); applySidebar(); renderPens(); renderSections();
  openPage(p); setTool('pen');
  dirty = !data; // first run: create the notes file right away
  if (dirty) markDirty();
}
async function boot() {
  paintIcons();
  renderSelbar();
  wireRibbon(); wireSidebar();
  selftest = await API.selftest();
  let data = null;
  try { const raw = await API.load(); if (raw) data = JSON.parse(raw); } catch (e) { console.error(e); }
  nb = data && data.sections ? data : defaultNotebook(); // needed by resize before loadNotebook
  const r = board.getBoundingClientRect(); vw = r.width; vh = r.height; bRect = r;
  loadNotebook(data);
  new ResizeObserver(resize).observe(board);
  resize();
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (nb.settings.theme === 'system') applyTheme(); });
  window.addEventListener('focus', () => { bRect = board.getBoundingClientRect(); });
  if (selftest) runSelftest(selftest);
}
boot();

/* ---- development self-test: draws sample notes, screenshots, exports PDFs ---- */
async function runSelftest({ dir }) {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  { // ---- ink quality comparison: same noisy "handwriting" through old vs new engine ----
    page.title = 'Ink test'; $('#title').value = page.title;
    let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647 - .5);
    const script = []; // cursive-like loops
    for (let i = 0; i <= 260; i++) { const t = i / 260; script.push([150 + t * 300 + 14 * Math.sin(t * 40), 230 - 16 * Math.abs(Math.sin(t * 20)) + 6 * Math.cos(t * 40), .45 + .35 * Math.sin(t * 9) ** 2]); }
    const noisy = script.map(p => [p[0] + rnd() * .9, p[1] + rnd() * .9, clamp(p[2] + rnd() * .25, .05, 1)]);
    page.items = [{ id: uid(), t: 'stroke', tool: 'pen', color: '#111111', size: 2.4, th: .62, pts: noisy.map(p => [p[0], p[1] - 0, p[2]]) }];
    changed(); setZoom(2.6); cam.x = -150 * cam.z + 40; cam.y = -150 * cam.z; camChanged();
    setTool('pen');
    const S2 = (px, py) => [px * cam.z + cam.x, py * cam.z + cam.y];
    const ev = (type, p) => { const [x, y] = S2(p[0], p[1] + 70); board.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 9, pointerType: 'pen', clientX: bRect.left + x, clientY: bRect.top + y, pressure: p[2], button: type === 'pointermove' ? -1 : 0, buttons: type === 'pointerup' ? 0 : 1 })); };
    ev('pointerdown', noisy[0]);
    for (const p of noisy.slice(1)) { ev('pointermove', p); await wait(5); }
    ev('pointerup', noisy[noisy.length - 1]);
    await wait(300);
    await API.selftestShot('shot-ink.png');
    const r = await doExport({ range: 'page', paper: 'a4', lines: true, white: false }, dir + '\\export-ink.pdf');
    console.log('ink export', JSON.stringify(r), 'items', page.items.length, 'v2 pts', page.items[1] && page.items[1].pts.length);
    addPage(); await wait(100);
  }
  page.title = 'Physics — Kinematics'; $('#title').value = page.title;
  const items = [];
  const word = (x0, y0, w, seed, col = '#111111', size = 2.4) => {
    const pts = []; for (let i = 0; i <= 60; i++) { const t = i / 60; pts.push([x0 + t * w, y0 + Math.sin(t * 18 + seed) * 7 - Math.abs(Math.cos(t * 9 + seed)) * 6, .3 + .6 * Math.abs(Math.sin(t * 6 + seed))]); }
    items.push({ id: uid(), t: 'stroke', tool: 'pen', color: col, size, th: .62, pts });
  };
  for (let row = 0; row < 14; row++) { let x = 80; while (x < 700) { const w = 40 + ((row * 37 + x) % 70); word(x, LINE_TOP + 28 * (row + 1) + 8, w, row + x, row % 5 === 3 ? '#1565c0' : '#111111'); x += w + 18; } }
  items.unshift({ id: uid(), t: 'stroke', tool: 'hl', color: '#ffd400', size: 16, pts: [[80, 216, .5], [420, 216, .5]] });
  items.push({ id: uid(), t: 'shape', kind: 'arrow', x1: 120, y1: 640, x2: 380, y2: 560, color: '#d32f2f', size: 2 });
  items.push({ id: uid(), t: 'shape', kind: 'rect', x1: 460, y1: 560, x2: 700, y2: 660, color: '#2e7d32', size: 2 });
  items.push({ id: uid(), t: 'text', x: 470, y: 590, html: 'v = u + at<br><b>s = ut + ½at²</b>', size: 18, color: null });
  for (let row = 0; row < 20; row++) word(80, 1200 + row * 28, 560, row, '#283593');
  page.items = items; changed();
  await wait(600);
  await API.selftestShot('shot-light.png');
  nb.settings.theme = 'dark'; applyTheme(); await wait(400);
  await API.selftestShot('shot-dark.png');
  nb.settings.theme = 'light'; applyTheme();
  setTool('lasso'); sel = { ids: new Set(items.slice(-3).map(i => i.id)) }; requestLive(); switchTab('view'); await wait(300);
  await API.selftestShot('shot-select.png');
  const r1 = await doExport({ range: 'page', paper: 'a4', lines: true, white: false }, dir + '\\export-a4.pdf');
  const r2_ = await doExport({ range: 'page', paper: 'cont', lines: true, white: false }, dir + '\\export-cont.pdf');
  console.log('selftest', JSON.stringify([r1, r2_]));

  // ---- simulated pen interaction tests ----
  switchTab('draw'); addPage(); await wait(200);
  const S = (px, py) => [px * cam.z + cam.x, py * cam.z + cam.y];
  const P = (type, px, py, o = {}) => { const [x, y] = S(px, py); board.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 7, pointerType: 'pen', clientX: bRect.left + x, clientY: bRect.top + y, pressure: .6, button: type === 'pointermove' ? -1 : 0, buttons: type === 'pointerup' ? 0 : 1, ...o })); };
  const drag = (pts, o) => { P('pointerdown', ...pts[0], o); for (const p of pts.slice(1)) P('pointermove', ...p, o); P('pointerup', ...pts[pts.length - 1], o); };
  const line = (x0, y0, x1, y1, n = 30) => Array.from({ length: n + 1 }, (_, i) => [x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n + Math.sin(i) * 3]);
  const ok = (name, cond) => console.log((cond ? 'PASS ' : 'FAIL ') + name);
  setTool('pen');
  drag(line(100, 200, 400, 200)); drag(line(100, 260, 400, 260)); drag(line(100, 320, 400, 320));
  ok('draw 3 strokes', page.items.length === 3 && page.items.every(i => i.t === 'stroke' && i.pts.length > 20));
  nb.settings.eraser.mode = 'partial'; setTool('eraser');
  drag([[250, 240], [250, 250], [250, 270], [250, 280]]);
  ok('point eraser splits middle stroke', page.items.length === 4);
  undo(); ok('undo erase', page.items.length === 3);
  redo(); ok('redo erase', page.items.length === 4);
  nb.settings.eraser.mode = 'stroke';
  drag([[200, 310], [200, 330]]);
  ok('stroke eraser removes stroke', page.items.length === 3);
  setTool('lasso');
  drag([[80, 180], [420, 180], [420, 220], [80, 220], [80, 180]]);
  ok('lasso selects first stroke', sel && sel.ids.size === 1);
  const before = bbox(selItems()[0]);
  drag([[250, 200], [260, 230], [270, 250]]);
  const after = bbox(selItems()[0]);
  ok('drag moves selection', Math.abs(after.y0 - before.y0 - 50) < 1 && Math.abs(after.x0 - before.x0 - 20) < 1);
  setTool('text');
  drag([[120, 500]]);
  ok('text tool starts editing', !!editing);
  document.execCommand('insertText', false, 'Hello notes');
  commitText();
  ok('text committed', page.items.some(i => i.t === 'text' && i.html.includes('Hello notes')));
  const tb = page.items.find(i => i.t === 'text').y;
  setTool('space');
  drag([[300, 450], [300, 500], [300, 550]]);
  ok('insert space pushes text down', Math.abs(page.items.find(i => i.t === 'text').y - tb - 100) < 1);
  setTool('shape'); shapeKind = 'arrow';
  drag([[100, 700], [300, 760]]);
  ok('arrow shape', page.items.some(i => i.t === 'shape' && i.kind === 'arrow'));
  setTool('pen');
  P('pointerdown', 100, 820); for (const p of line(100, 820, 300, 822, 20)) P('pointermove', ...p);
  await wait(900); P('pointermove', 420, 830); P('pointerup', 420, 830);
  ok('hold-to-straighten makes a line', page.items.some(i => i.t === 'shape' && i.kind === 'line'));
  const n = page.items.length; selectAll(); copySel(); pasteClip();
  ok('copy/paste duplicates', page.items.length === n * 2);
  undo(); setTool('pen');
  await wait(300);
  await API.selftestShot('shot-interact.png');
  await API.selftestDone();
}
