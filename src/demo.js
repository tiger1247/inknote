/* Builds demo notes and captures README screenshots.
   Only loaded when the app is started with --demo=<folder> (nothing is saved). */
'use strict';
(async () => {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const FONT = '"Ink Free"';
  await document.fonts.load(`60px ${FONT}`);
  const S = 4; // raster scale

  /* ---------- text → single-line pen strokes (raster + Zhang-Suen thinning + tracing) ---------- */
  function thin(g, w, h) {
    let changed = true; const del = [];
    while (changed) {
      changed = false;
      for (let step = 0; step < 2; step++) {
        del.length = 0;
        for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
          const i = y * w + x; if (!g[i]) continue;
          const p2 = g[i - w], p3 = g[i - w + 1], p4 = g[i + 1], p5 = g[i + w + 1], p6 = g[i + w], p7 = g[i + w - 1], p8 = g[i - 1], p9 = g[i - w - 1];
          const B = p2 + p3 + p4 + p5 + p6 + p7 + p8 + p9; if (B < 2 || B > 6) continue;
          const A = (!p2 && p3) + (!p3 && p4) + (!p4 && p5) + (!p5 && p6) + (!p6 && p7) + (!p7 && p8) + (!p8 && p9) + (!p9 && p2);
          if (A !== 1) continue;
          if (step === 0 ? (p2 * p4 * p6 || p4 * p6 * p8) : (p2 * p4 * p8 || p2 * p6 * p8)) continue;
          del.push(i);
        }
        if (del.length) { changed = true; for (const i of del) g[i] = 0; }
      }
    }
  }
  function trace(g, w, h) {
    const N = [-w - 1, -w, -w + 1, -1, 1, w - 1, w, w + 1];
    const deg = i => { let c = 0; for (const o of N) c += g[i + o]; return c; };
    const vis = new Uint8Array(w * h), lines = [];
    const xy = i => [i % w, (i / w) | 0];
    const walk = s => {
      const path = [s]; vis[s] = 1; let cur = s, prev = -1;
      for (;;) {
        let best = -1, bs = -1e9;
        for (const o of N) {
          const n = cur + o; if (!g[n] || vis[n]) continue;
          let sc = (o === 1 || o === -1 || o === w || o === -w) ? .1 : 0;
          if (prev >= 0) { const [a, b] = xy(prev), [c, d] = xy(cur), [e, f] = xy(n); sc += (c - a) * (e - c) + (d - b) * (f - d); }
          if (sc > bs) { bs = sc; best = n; }
        }
        if (best < 0) break;
        vis[best] = 1; path.push(best); prev = cur; cur = best;
      }
      // reconnect to an already-traced neighbour (closes gaps at junctions)
      for (const o of N) { const n = cur + o; if (g[n] && vis[n] && n !== prev && path.indexOf(n) === -1) { path.push(n); break; } }
      return path;
    };
    const pix = []; for (let i = w; i < w * h - w; i++) if (g[i]) pix.push(i);
    for (const i of pix) if (!vis[i] && deg(i) === 1) { const p = walk(i); if (p.length > 2) lines.push(p); }
    for (const i of pix) if (!vis[i]) { const p = walk(i); if (p.length > 2) lines.push(p); }
    return lines.map(p => p.map(xy));
  }
  function handwrite(text, x, base, { size = 24, color = '#1a1a1a', pen = 2.3, tool = 'pen', seed = 1, slant = 0 } = {}) {
    const c = document.createElement('canvas'), fpx = size * S;
    let ctx = c.getContext('2d'); ctx.font = `${fpx}px ${FONT}`;
    const w = Math.ceil(ctx.measureText(text).width) + 16 * S, h = Math.ceil(fpx * 1.7), b0 = Math.round(fpx * 1.2);
    c.width = w; c.height = h; ctx = c.getContext('2d'); ctx.font = `${fpx}px ${FONT}`; ctx.fillStyle = '#000';
    ctx.fillText(text, 8 * S, b0);
    const d = ctx.getImageData(0, 0, w, h).data, g = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) g[i] = d[i * 4 + 3] > 100 ? 1 : 0;
    thin(g, w, h);
    const items = [];
    for (const ln of trace(g, w, h)) {
      const pts = [];
      for (let i = 0; i < ln.length; i += 2) pts.push(ln[i]);
      if ((ln.length - 1) % 2) pts.push(ln[ln.length - 1]);
      const P = pts.map((p, j) => {
        const px = x + (p[0] - 8 * S) / S, py = base + (p[1] - b0) / S;
        return [r2(px - (py - base) * slant), r2(py + Math.sin(px * .021 + seed) * .7), r2(.5 + .16 * Math.sin(j * .3 + seed + px * .02))];
      });
      items.push({ id: uid(), t: 'stroke', v: 2, tool, color, size: pen, k: tool === 'pencil' ? .25 : .4, sm: .8, pts: P });
    }
    return items;
  }
  const L = n => LINE_TOP + 28 * n - 7;
  const hl = (x0, x1, y, color = '#ffd400', size = 20) => {
    const pts = []; for (let x = x0; x <= x1; x += 6) pts.push([x, r2(y + Math.sin(x * .03) * .8), .5]);
    return { id: uid(), t: 'stroke', v: 2, tool: 'hl', color, size, k: 0, sm: 1, pts };
  };
  const line = (x0, y0, x1, y1, color, size = 2.2, wob = .6) => {
    const n = Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 3)), pts = [];
    for (let i = 0; i <= n; i++) { const t = i / n; pts.push([r2(x0 + (x1 - x0) * t), r2(y0 + (y1 - y0) * t + Math.sin(t * 9) * wob), r2(.45 + .2 * Math.sin(t * 3))]); }
    return { id: uid(), t: 'stroke', v: 2, tool: 'pen', color, size, k: .4, sm: .8, pts };
  };
  const shape = (kind, x1, y1, x2, y2, color, size = 2) => ({ id: uid(), t: 'shape', kind, x1, y1, x2, y2, color, size });
  const dot = (x, y, color, size) => ({ id: uid(), t: 'stroke', v: 2, tool: 'pen', color, size, k: 0, pts: [[x, y, .5]] });
  const circle = (cx, cy, r, color, size = 2) => shape('ellipse', cx - r, cy - r, cx + r, cy + r, color, size);
  const text = (x, y, html, size = 16, color = null) => ({ id: uid(), t: 'text', x, y, html, size, color });

  /* ---------- pages ---------- */
  const day = 86400000, now = Date.now();
  const mk = (title, bg, items, ago, hour = 19, min = 24) => { const d = new Date(now - ago * day); d.setHours(hour, min, 0, 0); return { id: uid(), title, created: +d, modified: now, bg, items }; };
  const B = '#1a1a1a', BLUE = '#1565c0', RED = '#d32f2f', GREEN = '#2e7d32', GREY = '#5f6368', ORANGE = '#ef6c00', PURPLE = '#7b1fa2';

  // Physics — hero
  const phys = [
    ...handwrite('Equations of motion', 64, L(1), { size: 30, color: BLUE, pen: 2.6, seed: 2 }),
    line(66, L(1) + 7, 330, L(1) + 5, BLUE, 2),
    hl(64, 300, L(4) - 7),
    ...handwrite('1)  v = u + at', 70, L(2), { color: B, seed: 3 }),
    ...handwrite('2)  s = ut + ½at²', 70, L(3), { color: B, seed: 4 }),
    ...handwrite('3)  v² = u² + 2as', 70, L(4), { color: B, seed: 5 }),
    ...handwrite('u = initial velocity,  a = acceleration', 70, L(5), { size: 20, color: GREY, tool: 'pencil', pen: 1.8, seed: 6 }),
    ...handwrite('t = time,  s = displacement', 70, L(6), { size: 20, color: GREY, tool: 'pencil', pen: 1.8, seed: 7 }),
    ...handwrite('Example', 70, L(8), { size: 26, color: RED, seed: 8 }),
    line(72, L(8) + 6, 160, L(8) + 6, RED, 1.8),
    ...handwrite('A car starts from rest.', 70, L(9), { color: B, seed: 9 }),
    ...handwrite('a = 2 m/s²,   t = 5 s', 70, L(10), { color: B, seed: 10 }),
    ...handwrite('v = 0 + 2 × 5 = 10 m/s', 74, L(11), { color: GREEN, seed: 11 }),
    shape('rect', 64, L(11) - 26, 330, L(11) + 10, GREEN, 1.8),
    // car diagram
    line(440, 452, 760, 452, B, 2.2, .4),
    shape('rect', 490, 404, 640, 438, B, 2.2),
    shape('rect', 520, 380, 600, 404, B, 2.2),
    circle(522, 442, 11, B, 2.2), circle(608, 442, 11, B, 2.2),
    shape('arrow', 655, 420, 745, 420, RED, 2.4),
    ...handwrite('v', 750, 428, { size: 24, color: RED, seed: 12 }),
    shape('arrow', 655, 392, 725, 392, ORANGE, 2.4),
    ...handwrite('a', 730, 398, { size: 24, color: ORANGE, seed: 13 }),
    ...handwrite('t = 0 → u = 0', 470, 368, { size: 18, color: GREY, tool: 'pencil', pen: 1.7, seed: 14 }),
    text(64, L(13) - 20, '<b>Exam tip:</b> always write the units — m/s for velocity, m/s² for acceleration.', 16),
  ];
  // Chemistry — dark theme
  const cx = 590, cy = 330;
  const chem = [
    ...handwrite('Atomic structure', 64, L(1), { size: 30, color: '#ffd54f', pen: 2.6, seed: 2 }),
    line(66, L(1) + 7, 300, L(1) + 5, '#ffd54f', 2),
    ...handwrite('Proton    +1   mass 1', 70, L(3), { color: '#ff80ab', seed: 3 }),
    ...handwrite('Neutron    0   mass 1', 70, L(4), { color: '#4dd0e1', seed: 4 }),
    ...handwrite('Electron  −1   mass ≈ 0', 70, L(5), { color: '#c6ff00', seed: 5 }),
    ...handwrite('Atomic no. Z = protons', 70, L(7), { color: '#e0e0e0', seed: 6 }),
    ...handwrite('Mass no. A = p + n', 70, L(8), { color: '#e0e0e0', seed: 7 }),
    hl(64, 300, L(10) - 7, '#b388ff', 20),
    ...handwrite('Carbon-12: 6p, 6n, 6e', 70, L(10), { color: '#ffffff', seed: 8 }),
    circle(cx, cy, 50, '#4dd0e1', 1.6), circle(cx, cy, 92, '#4dd0e1', 1.6), circle(cx, cy, 134, '#4dd0e1', 1.6),
    dot(cx, cy, '#ff80ab', 30), dot(cx - 6, cy - 5, '#4dd0e1', 12), dot(cx + 7, cy + 4, '#4dd0e1', 12),
    dot(cx + 50, cy, '#c6ff00', 11), dot(cx - 50, cy, '#c6ff00', 11),
    dot(cx + 65, cy - 65, '#c6ff00', 11), dot(cx - 65, cy + 65, '#c6ff00', 11), dot(cx - 92, cy, '#c6ff00', 11), dot(cx + 92, cy, '#c6ff00', 11),
    dot(cx, cy - 134, '#c6ff00', 11), dot(cx, cy + 134, '#c6ff00', 11),
    shape('arrow', 330, L(10) - 10, 450, 360, '#ffffff', 1.8),
    ...handwrite('nucleus', cx - 34, cy + 175, { size: 22, color: '#ff80ab', seed: 9 }),
  ];
  // Maths — dots, lasso
  const mathsGraph = [];
  const ox = 210, oy = 580;
  mathsGraph.push(shape('arrow', 60, oy, 390, oy, B, 2), shape('arrow', ox, oy + 18, ox, 318, B, 2));
  const para = []; for (let X = -110; X <= 110; X += 3) para.push([r2(ox + X), r2(oy - X * X / 56), .55]);
  const paraItem = { id: uid(), t: 'stroke', v: 2, tool: 'pen', color: BLUE, size: 2.8, k: .4, sm: 1, pts: para };
  const yx = handwrite('y = x²', 330, 372, { size: 26, color: BLUE, seed: 3 });
  const maths = [
    ...handwrite('Quadratics', 64, L(1), { size: 30, color: PURPLE, pen: 2.6, seed: 2 }),
    ...handwrite('y = ax² + bx + c', 470, L(3), { size: 24, color: B, seed: 10 }),
    ...handwrite('a > 0  →  U-shape', 470, L(4), { size: 22, color: GREEN, seed: 11 }),
    ...mathsGraph, paraItem, ...yx,
    ...handwrite('x', 396, oy + 6, { size: 20, color: B, seed: 4 }), ...handwrite('y', ox - 24, 334, { size: 20, color: B, seed: 5 }),
    shape('arrow', 268, 618, ox + 5, oy + 5, RED, 1.8),
    ...handwrite('vertex (0, 0)', 272, 632, { size: 20, color: RED, seed: 6 }),
    ...handwrite('– U-shaped curve', 470, L(7), { size: 22, color: B, seed: 7 }),
    ...handwrite('– symmetric about x = 0', 470, L(8), { size: 22, color: B, seed: 8 }),
    ...handwrite('– minimum at the vertex', 470, L(9), { size: 22, color: B, seed: 9 }),
    hl(466, 690, L(9) - 7, '#c6ff00', 18),
  ];
  // Biology — export dialog
  const bio = [
    ...handwrite('Cell structure', 64, L(1), { size: 30, color: GREEN, pen: 2.6, seed: 2 }),
    shape('ellipse', 380, 210, 720, 470, GREEN, 2.4),
    shape('ellipse', 500, 280, 600, 360, PURPLE, 2.2), dot(552, 318, PURPLE, 18),
    shape('ellipse', 420, 380, 480, 410, ORANGE, 2), shape('ellipse', 620, 250, 680, 280, ORANGE, 2), shape('ellipse', 630, 390, 690, 420, ORANGE, 2),
    shape('arrow', 300, L(3) - 8, 495, 310, PURPLE, 1.6), shape('arrow', 300, L(5) - 8, 425, 392, ORANGE, 1.6), shape('arrow', 300, L(7) - 8, 386, 360, GREEN, 1.6),
    ...handwrite('Nucleus – DNA', 70, L(3), { color: PURPLE, seed: 3 }),
    ...handwrite('Mitochondria – energy', 70, L(5), { color: ORANGE, seed: 4 }),
    ...handwrite('Cell membrane', 70, L(7), { color: GREEN, seed: 5 }),
    ...handwrite('Cytoplasm: where reactions happen', 70, L(9), { size: 22, color: B, seed: 6 }),
    hl(64, 340, L(9) - 7),
  ];

  const ruled = { type: 'ruled', color: 'auto', margin: true };
  const P = (t, ago) => mk(t, ruled, [], ago);
  const physPage = mk('Kinematics', ruled, phys, 1);
  const chemPage = mk('Atoms & ions', { type: 'grid', color: 'board', margin: false }, chem, 3, 17, 5);
  const mathPage = mk('Graphs', { type: 'dots', color: 'cream', margin: false }, maths, 2, 16, 40);
  const bioPage = mk('Cells', { type: 'ruled', color: 'mint', margin: true }, bio, 4, 18, 10);
  const sections = [
    { id: uid(), name: 'Physics', color: '#0078d4', pages: [physPage, P("Newton's laws", 6), P('Work & energy', 9), P('Projectile motion', 12)] },
    { id: uid(), name: 'Chemistry', color: '#d83b01', pages: [chemPage, P('Periodic table', 8), P('Bonding', 11)] },
    { id: uid(), name: 'Maths', color: '#7719aa', pages: [mathPage, P('Algebra', 7), P('Trigonometry', 10)] },
    { id: uid(), name: 'Biology', color: '#107c10', pages: [bioPage, P('Photosynthesis', 9)] },
    { id: uid(), name: 'English', color: '#c239b3', pages: [P('Essay plan', 5)] },
  ];
  loadNotebook({ version: 1, sections, cur: { s: sections[0].id, p: physPage.id }, settings: { theme: 'light' } });
  const show = async (pg, s, z = 1.22, y = 16) => {
    sec = s; renderSections(); openPage(pg);
    cam.z = z; cam.x = (vw - PW * z) / 2; cam.y = y; camChanged(); await wait(500);
  };
  const shot = async n => { drawMain(); drawLive(); await wait(150); return API.selftestShot(n); };
  await wait(1500); // let the window become visible
  const blackPen = nb.settings.pens.find(p => p.color === '#111111');

  // 1 — hero
  switchTab('draw'); selectPen(blackPen.id);
  await show(physPage, sections[0]); await shot('1-notes.png');

  // 2 — dark theme
  nb.settings.theme = 'dark'; applyTheme();
  selectPen(nb.settings.pens.find(p => p.color === '#0288d1').id);
  await show(chemPage, sections[1]); await shot('2-dark.png');
  nb.settings.theme = 'light'; applyTheme();

  // 3 — lasso + pen options + paper styles
  await show(mathPage, sections[2]);
  const popPen = nb.settings.pens.find(p => p.color === '#9c27b0');
  selectPen(popPen.id);
  setTool('lasso'); sel = { ids: new Set([paraItem.id, ...yx.map(i => i.id)]) }; requestLive(); await wait(300);
  openPenPop($(`.pen-btn[data-id="${popPen.id}"]`), popPen); await wait(300);
  await shot('3-lasso-pens.png'); closePops();

  // 4 — PDF export
  sel = null; setTool('pen');
  await show(bioPage, sections[3]);
  nb.settings.exportOpts.paper = 'cont';
  openExport(); await wait(400);
  await shot('4-export.png');
  await API.selftestDone();
})();
