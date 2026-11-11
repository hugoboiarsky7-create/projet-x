// La rue : silhouettes plates, câbles, climatiseurs, auvents — révélés seulement par la lumière des enseignes.
import { DISTRICTS, WD } from './data/words';
import { tube, word, wordLen } from './tubes';
export interface Slot { x: number; y: number; w: number; h: number; vert: boolean; bs: number; word: string; kind: 'sign' | 'name' | 'secret'; i: number; col: string; pic: string; px: number; py: number; ps: number; tx: number; ty: number }
const rng = (seed: number) => () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
export const GY = 0.8;
export function layout(di: number, W: number, H: number): Slot[] {
  const d = DISTRICTS[di], out: Slot[] = [], raw: [number, number, number, number, boolean][] = [];
  const rows = [0.585, 0.44, 0.295, 0.15];
  const back: [number, number, number, number, boolean][] = [[0.452, 0.38, 0.042, 0.1, true], [0.512, 0.325, 0.042, 0.1, true], [0.445, 0.55, 0.11, 0.028, false], [0.512, 0.44, 0.042, 0.09, true]];
  const L = (r: number, v: boolean): [number, number, number, number, boolean] => v ? [0.293, rows[r] - 0.012, 0.074, 0.134, true] : [0.028, rows[r] + 0.02, 0.245, 0.052, false];
  const R = (r: number, v: boolean): [number, number, number, number, boolean] => v ? [1 - 0.293 - 0.074, rows[r] + 0.004, 0.074, 0.134, true] : [1 - 0.028 - 0.245, rows[r] + 0.036, 0.245, 0.052, false];
  raw.push(back[0], back[1], L(0, false), R(0, false), back[2], L(0, true), R(0, true), back[3], L(1, false), R(1, false), L(1, true), R(1, true), L(2, false), R(2, false), L(2, true), R(2, true), L(3, false), R(3, false), L(3, true));
  const mk = (b: [number, number, number, number, boolean], w: string, kind: Slot['kind'], i: number, col: string): Slot => {
    const x = b[0] * W, y = b[1] * H, sw = b[2] * W, sh = b[3] * H, vert = b[4]; let n = 0; for (const ch of w) n += ch === ' ' ? 0.45 : 1; const pic = kind !== 'name' && WD[w]?.p && n <= 3 ? WD[w].p : '';
    const long = (vert ? sh : sw) - 8, cross = vert ? sw : sh, slotsN = n * 1.12 + (pic ? 1.25 : 0); const bs = Math.min(cross * 0.78, long / slotsN); const len = wordLen(w, bs) + (pic ? bs * 1.25 : 0), o = ((vert ? sh : sw) - len) / 2, c = (cross - bs) / 2;
    const px = vert ? x + c : x + o, py = vert ? y + o : y + c, t0 = pic ? bs * 1.25 : 0; return { x, y, w: sw, h: sh, vert, bs, word: w, kind, i, col, pic, px, py, ps: bs, tx: vert ? x + c : x + o + t0, ty: vert ? y + o + t0 : y + c };
  };
  d.signs.forEach((s, i) => { if (i === d.signs.length - 1) out.push(mk([0.2, 0.045, 0.6, 0.07, false], s.w, 'name', i, d.col[0])); else out.push(mk(raw[i], s.w, 'sign', i, i % 5 === 4 ? d.col[2] : d.col[i % 2])); });
  const sec: [number, number, number, number, boolean][] = [[1 - 0.293 - 0.074, rows[3] + 0.004, 0.074, 0.134, true], [0.03, 0.715, 0.16, 0.034, false], [0.8, 0.728, 0.17, 0.03, false]];
  d.secrets.forEach((w, i) => out.push(mk(sec[i], w, 'secret', i, d.col[2])));
  return out;
}
const FACADE: [string, string, string, string][] = [['#8a6f66', '#6c7480', '#4d5560', '#b5452b'], ['#7a6a8a', '#8a7a6a', '#515a70', '#3d6fb4'], ['#8f8f96', '#a08478', '#5a5a66', '#c8402b'], ['#8a7a5e', '#6e7f76', '#565046', '#d98e32'], ['#6f7f90', '#7f8a9a', '#48546a', '#4f8a3c'], ['#7c8894', '#93a0ab', '#56626e', '#35a0c0']];
/** albédo : ce que la lumière révélera */
export function albedo(g: CanvasRenderingContext2D, di: number, W: number, H: number, slots: Slot[], lit: (s: Slot) => boolean) {
  const r = rng(di * 977 + 5), [cl, cr, cs, ca] = FACADE[di], gy = GY * H; g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  // lointain : tours
  for (let i = 0; i < 9; i++) { const x = W * (0.36 + r() * 0.26), w = W * (0.03 + r() * 0.05), h = H * (0.1 + r() * 0.34); g.fillStyle = `rgb(${38 + r() * 26},${42 + r() * 26},${54 + r() * 30})`; g.fillRect(x, gy * 0.97 - h, w, h); }
  // fond de ruelle
  g.fillStyle = '#3b404b'; g.fillRect(W * 0.43, H * 0.27, W * 0.14, gy - H * 0.27); g.fillStyle = '#2b2f38'; for (let i = 0; i < 5; i++) g.fillRect(W * 0.44 + (i % 2) * W * 0.065, H * 0.3 + i * H * 0.085, W * 0.05, H * 0.045);
  g.fillStyle = '#565d6b'; g.fillRect(W * 0.43, H * 0.6, W * 0.14, H * 0.012);
  // murs fuyants
  const side = (x0: number, x1: number) => { g.fillStyle = cs; g.beginPath(); g.moveTo(x0, 0); g.lineTo(x1, H * 0.22); g.lineTo(x1, gy * 0.992); g.lineTo(x0, gy); g.closePath(); g.fill(); g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1; for (let k = 1; k < 7; k++) { const t = k / 7; g.beginPath(); g.moveTo(x0, gy * t); g.lineTo(x1, H * 0.22 + (gy * 0.992 - H * 0.22) * t); g.stroke(); } };
  side(W * 0.345, W * 0.43); side(W * 0.655, W * 0.57);
  // façades
  const facade = (x: number, w: number, col: string, flip: boolean) => {
    g.fillStyle = col; g.fillRect(x, 0, w, gy);
    g.fillStyle = 'rgba(0,0,0,.22)'; for (let y = 0; y < gy; y += H * 0.1458) g.fillRect(x, y, w, 2);
    for (let row = 0; row < 5; row++) for (let c = 0; c < 3; c++) { if (r() < 0.25) continue; const wx = x + w * (0.08 + c * 0.31), wy = H * (0.03 + row * 0.1458), ww = w * 0.22, wh = H * 0.07; g.fillStyle = 'rgba(8,10,16,.82)'; g.fillRect(wx, wy, ww, wh); g.strokeStyle = 'rgba(210,215,225,.5)'; g.lineWidth = 1.2; g.strokeRect(wx, wy, ww, wh); g.beginPath(); g.moveTo(wx + ww / 2, wy); g.lineTo(wx + ww / 2, wy + wh); g.stroke(); if (r() < 0.3) { g.fillStyle = '#9aa2ad'; g.fillRect(wx + ww * 0.1, wy + wh + 3, ww * 0.7, H * 0.022); g.fillStyle = '#3a3f48'; g.beginPath(); g.arc(wx + ww * 0.45, wy + wh + 3 + H * 0.011, H * 0.008, 0, 7); g.fill(); } }
    g.fillStyle = '#2a2d34'; g.fillRect(flip ? x + w * 0.06 : x + w * 0.9, 0, w * 0.035, gy); // gouttière
    const ay = gy - H * 0.105; g.fillStyle = ca; g.beginPath(); g.moveTo(x, ay); g.lineTo(x + w, ay); g.lineTo(x + w + (flip ? -1 : 1) * W * 0.02, ay + H * 0.03); g.lineTo(x - (flip ? -1 : 1) * 0, ay + H * 0.03); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,255,255,.55)'; for (let k = 0; k < 6; k += 2) g.fillRect(x + (w * k) / 6, ay, w / 6, H * 0.03);
    g.fillStyle = '#20232a'; g.fillRect(x + w * 0.12, ay + H * 0.03, w * 0.76, gy - ay - H * 0.03); g.strokeStyle = 'rgba(160,168,180,.35)'; for (let k = 1; k < 9; k++) { g.beginPath(); g.moveTo(x + w * 0.12, ay + H * 0.03 + k * H * 0.008); g.lineTo(x + w * 0.88, ay + H * 0.03 + k * H * 0.008); g.stroke(); }
  };
  facade(0, W * 0.345, cl, false); facade(W * 0.655, W * 0.345, cr, true);
  // câbles
  g.strokeStyle = 'rgba(20,22,28,.95)'; g.lineWidth = 1.3; for (let k = 0; k < 5; k++) { const y0 = H * (0.08 + r() * 0.3), y1 = H * (0.08 + r() * 0.3); g.beginPath(); g.moveTo(W * 0.33, y0); g.quadraticCurveTo(W * 0.5, Math.max(y0, y1) + H * (0.03 + r() * 0.05), W * 0.67, y1); g.stroke(); }
  // un chat sur un rebord
  const cx = W * (di % 2 ? 0.2 : 0.78), cy = H * 0.683; g.fillStyle = '#0c0d11'; g.beginPath(); g.ellipse(cx, cy, 9, 6, 0, 0, 7); g.fill(); g.beginPath(); g.arc(cx + 8, cy - 5, 4.4, 0, 7); g.fill(); g.beginPath(); g.moveTo(cx + 5, cy - 8); g.lineTo(cx + 6, cy - 12); g.lineTo(cx + 8.4, cy - 9); g.moveTo(cx + 9, cy - 9); g.lineTo(cx + 11.4, cy - 12); g.lineTo(cx + 12, cy - 7); g.fill(); g.lineWidth = 2; g.strokeStyle = '#0c0d11'; g.beginPath(); g.moveTo(cx - 8, cy); g.quadraticCurveTo(cx - 15, cy - 2, cx - 13, cy - 10); g.stroke();
  // panneaux d'enseignes + verre éteint
  for (const s of slots) {
    if (s.kind === 'secret' && !lit(s)) { g.fillStyle = 'rgba(14,15,20,.9)'; g.fillRect(s.x, s.y, s.w, s.h); continue; }
    g.fillStyle = s.kind === 'name' ? '#1c1f27' : '#15171d'; g.fillRect(s.x - 2, s.y - 2, s.w + 4, s.h + 4); g.strokeStyle = 'rgba(175,182,196,.42)'; g.lineWidth = 1; g.strokeRect(s.x - 1.5, s.y - 1.5, s.w + 3, s.h + 3);
    if (s.vert) { g.fillStyle = '#30343d'; const bx = s.x < W / 2 ? s.x - 5 : s.x + s.w + 1; g.fillRect(bx, s.y + 6, 4, 3); g.fillRect(bx, s.y + s.h - 9, 4, 3); }
    if (!lit(s)) { if (s.pic) tube(g, 'p:' + s.pic, s.px, s.py, s.ps, '#fff', 0, Math.max(1.3, s.ps * 0.08)); word(g, s.word, s.tx, s.ty, s.bs, '#fff', 0, s.vert); }
  }
  // asphalte
  g.fillStyle = '#000'; g.fillRect(0, gy, W, H - gy);
}
/** couche émissive des enseignes allumées */
export function emissive(g: CanvasRenderingContext2D, slots: Slot[], lit: (s: Slot) => number, W: number, H: number, total: number, t: number) {
  // fenêtres lointaines : la ville s'éveille avec la progression
  const r = rng(4242); for (let i = 0; i < 70; i++) { const x = W * (0.36 + r() * 0.28), y = H * (0.2 + r() * 0.4), on = r() < total * 0.9; if (!on) continue; g.fillStyle = r() < 0.5 ? 'rgba(255,214,150,.5)' : 'rgba(170,205,255,.42)'; g.fillRect(x, y, 2, 2.4); }
  for (const s of slots) { const l = lit(s); if (l <= 0) continue; g.globalAlpha = 0.07 * l; g.fillStyle = s.col; g.fillRect(s.x, s.y, s.w, s.h); g.globalAlpha = 1; if (s.pic) tube(g, 'p:' + s.pic, s.px, s.py, s.ps, s.col, l, Math.max(1.3, s.ps * 0.08), false, 0); word(g, s.word, s.tx, s.ty, s.bs, s.col, l, s.vert, 0.12, 0); }
  void t;
}
