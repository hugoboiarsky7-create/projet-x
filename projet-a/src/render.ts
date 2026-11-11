import { TU } from './tuning';
import { Course, vnoise, sstep } from './world';
import { palette, mix, css, type RGB, type Pal } from './eras';
import { MARKS, type MarkDef } from './marks';
import type { Ball } from './physics';
import { S } from './save';
export interface Mk { def: MarkDef; x: number; y: number; hit: number }
export interface State {
  c: Course; cid: string; W: number; H: number; dpr: number; t: number; top: number; bot: number;
  v: { x: number; y: number; s: number }; base: number; ball: { x: number; y: number }; fly: Ball | null; st: string; hole: number; strokes: number;
  aim: { on: boolean; p: number; ang: number; px: number; py: number }; preview: number[]; trail: number[]; marks: Mk[]; tracks: Set<number>;
  sink: number; ov: { on: boolean; z: number; x: number }; book: number; toast: { s: string; t: number }; titleT: number; endT: number; dark: number; wx: number[]; streakShow: boolean; fade: number;
}
const { DX, XMIN, R } = TU;
const hash = (n: number) => { let t = (n | 0) + 0x6d2b79f5; t = Math.imul(t ^ (t >>> 15), 1 | t); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
let grain: HTMLCanvasElement | null = null, vig: HTMLCanvasElement | null = null, vigKey = '';
const parts = Array.from({ length: 90 }, (_, i) => ({ x: hash(i * 3 + 1), y: hash(i * 3 + 2), z: 0.4 + hash(i * 3 + 3) * 0.6 }));
const birds: { x: number; y: number; v: number; n: number }[] = []; let birdT = 12;
export const BALLS: Record<string, [string, string]> = { w: ['#ffffff', ''], obs: ['#16171d', 'rgba(255,255,255,.55)'], sky: ['#bfe6ff', ''], gold: ['#f1d489', ''] };
export const FONT = (px: number) => `200 ${px}px Inter, "Helvetica Neue", sans-serif`;
export function nightOf() { const d = new Date(), h = d.getHours() + d.getMinutes() / 60; return h < 12 ? 1 - sstep(5, 7.5, h) : sstep(18.6, 21, h); }
function mkGrain() { grain = document.createElement('canvas'); grain.width = grain.height = 192; const g = grain.getContext('2d')!, d = g.createImageData(192, 192); for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } g.putImageData(d, 0, 0); }
function mkVig(W: number, H: number) { vig = document.createElement('canvas'); vig.width = Math.ceil(W / 4); vig.height = Math.ceil(H / 4); const g = vig.getContext('2d')!, r = g.createRadialGradient(vig.width / 2, vig.height * 0.5, Math.min(vig.width, vig.height) * 0.35, vig.width / 2, vig.height / 2, Math.hypot(vig.width, vig.height) * 0.62); r.addColorStop(0, 'rgba(0,0,0,0)'); r.addColorStop(1, 'rgba(0,0,10,.42)'); g.fillStyle = r; g.fillRect(0, 0, vig.width, vig.height); vigKey = W + 'x' + H; }
function capCol(s: number, p: Pal, night: number, dark: number): RGB {
  const dim = (c: RGB) => mix(mix(c, [8, 10, 28], dark * 0.4), [14, 20, 46], night * 0.55);
  return s === 0 ? p.cap : s === 1 ? mix(p.cap, p.body, 0.28) : s === 2 ? dim(mix([232, 200, 150], p.hor, 0.25)) : s === 3 ? dim(mix([244, 247, 252], p.mid, 0.12)) : s === 4 ? dim(mix([176, 220, 240], p.mid, 0.2)) : s === 5 ? mix(p.body, p.hor, 0.24) : mix(p.body, [0, 0, 0], 0.35);
}
const TH = [4, 5, 6, 7.5, 4, 2.4, 4];
function sky(g: CanvasRenderingContext2D, A: State, p: Pal, night: number, horY: number) {
  const { W, H } = A; const gr = g.createLinearGradient(0, 0, 0, Math.max(horY, H * 0.5));
  gr.addColorStop(0, css(p.top)); gr.addColorStop(0.58, css(p.mid)); gr.addColorStop(1, css(p.hor)); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  if (night > 0.25) { g.fillStyle = '#fff'; for (let i = 0; i < 70; i++) { const tw = 0.5 + 0.5 * Math.sin(A.t * (0.6 + hash(i) * 1.6) + i); g.globalAlpha = (night - 0.25) * 0.9 * (0.25 + 0.75 * hash(i + 99)) * (0.6 + 0.4 * tw); g.fillRect(hash(i * 17) * W, hash(i * 31) * horY * 0.9, hash(i * 7) > 0.8 ? 1.6 : 1, hash(i * 7) > 0.8 ? 1.6 : 1); } g.globalAlpha = 1; }
  const d = new Date(), h = d.getHours() + d.getMinutes() / 60, day = h >= 6 && h < 20, k = day ? (h - 6) / 14 : ((h + 24 - 20) % 24) / 10;
  const sx = W * (0.14 + 0.72 * k), sy = horY * (0.94 - 0.72 * Math.sin(Math.PI * k)), r = Math.min(W, H) * 0.045;
  const gl = g.createRadialGradient(sx, sy, 0, sx, sy, r * (day ? 9 : 5)); gl.addColorStop(0, css(p.sun, day ? 0.5 : 0.22)); gl.addColorStop(1, css(p.sun, 0)); g.fillStyle = gl; g.fillRect(0, 0, W, H);
  g.fillStyle = css(mix(p.sun, [255, 255, 255], 0.4)); g.beginPath(); g.arc(sx, sy, r, 0, 7); g.fill();
  if (!day) { const ph = ((Date.now() / 864e5 - 10957.76) % 29.5306) / 29.5306, dx = 2 * r * (ph <= 0.5 ? ph / 0.5 : -(1 - ph) / 0.5); g.save(); g.beginPath(); g.arc(sx, sy, r + 0.5, 0, 7); g.clip(); g.fillStyle = css(mix(p.top, p.mid, 0.35)); g.beginPath(); g.arc(sx + dx, sy, r * 1.04, 0, 7); g.fill(); g.restore(); }
  return { sx, sy };
}
function layers(g: CanvasRenderingContext2D, A: State, p: Pal) {
  const { W, H, v, c } = A; const sc = [0.05, 0.09, 0.16], off = [-0.2, -0.1, -0.015], amp = [0.17, 0.13, 0.09], cm = [0.3, 0.62, 0.9];
  for (let L = 0; L < 3; L++) {
    const u = 1 / (Math.max(0.6, v.s) * sc[L] * 6), arr = c.far[L], col = L < 2 ? mix(p.hor, p.far, cm[L]) : mix(p.far, p.body, 0.5), top = A.base + (off[L] - amp[L]) * H;
    const gr = g.createLinearGradient(0, top, 0, top + H * 0.34); gr.addColorStop(0, css(col)); gr.addColorStop(1, css(mix(col, p.hor, L < 2 ? 0.5 : 0.25))); g.fillStyle = gr; g.beginPath(); g.moveTo(0, H);
    for (let px = 0; px <= W + 4; px += 4) {
      const wx = v.x + (px - W / 2) * u, d = Math.min(arr.length - 1.001, Math.max(0, wx / TU.DAYW)), i = Math.floor(d), val = arr[i] + (arr[i + 1] - arr[i]) * (d - i), k = L + 1;
      const r1 = 1 - Math.abs(vnoise(wx / (330 * k) + L * 50, 11)), r2 = 1 - Math.abs(vnoise(wx / (120 * k) + L * 9, 17)), n = r1 * r1 * 0.6 + r2 * 0.28 + vnoise(wx / (38 * k), 23) * 0.08 + vnoise(wx / (13 * k), 29) * 0.03;
      g.lineTo(px, A.base + off[L] * H - ((val * 0.5 + 0.5) * 0.4 + n * 0.6) * amp[L] * H);
    }
    g.lineTo(W + 4, H); g.closePath(); g.fill();
  }
}
export function draw(g: CanvasRenderingContext2D, A: State) {
  const { W, H, v, c } = A; if (!grain) mkGrain(); if (vigKey !== W + 'x' + H) mkVig(W, H);
  g.setTransform(A.dpr, 0, 0, A.dpr, 0, 0);
  const night = nightOf(), pt = c.ptAt(v.x), p = palette(A.cid, pt.day, A.dark, night), s = v.s;
  const X = (x: number) => (x - v.x) * s + W / 2, Y = (y: number) => A.base - (y - v.y) * s;
  if (A.ov.on) { overview(g, A, night); post(g, A); hud(g, A, p); return; }
  const sun = sky(g, A, p, night, A.base + H * 0.04); const seaX = X(c.xEnd + 44); if (seaX < W) { g.save(); g.beginPath(); g.rect(0, 0, seaX, H); g.clip(); layers(g, A, p); g.restore(); } else layers(g, A, p);
  // oiseaux
  birdT -= 1 / 60; if (birdT < 0 && A.dark < 0.3) { birdT = 30 + Math.random() * 50; birds.push({ x: -40, y: H * (0.12 + Math.random() * 0.2), v: 16 + Math.random() * 14, n: 2 + (Math.random() * 4 | 0) }); }
  g.strokeStyle = css(mix(p.body, [0, 0, 0], 0.2), 0.7); g.lineWidth = 1; g.beginPath();
  for (let i = birds.length - 1; i >= 0; i--) { const b = birds[i]; b.x += b.v / 60; if (b.x > W + 80) { birds.splice(i, 1); continue; } for (let k = 0; k < b.n; k++) { const bx = b.x - k * 13 - (k % 2) * 5, by = b.y + (k % 2 ? 7 : 0) + k * 3 + Math.sin(A.t * 1.4 + k) * 1.5, f = Math.sin(A.t * 7 + k * 1.7) * 2.4; g.moveTo(bx - 4, by - f); g.lineTo(bx, by); g.lineTo(bx + 4, by - f); } }
  g.stroke();
  const i0 = Math.max(0, c.ix(v.x - W / 2 / s) - 3), i1 = Math.min(c.n - 1, c.ix(v.x + W / 2 / s) + 3), Hh = c.H;
  // eau
  const wtop = css(mix(p.mid, p.body, 0.5), 0.94), wbot = css(mix(p.body, [0, 0, 10], 0.3));
  const water = (xa: number, xb: number, yw: number) => { const gr = g.createLinearGradient(0, yw, 0, yw + 120 * s); gr.addColorStop(0, wtop); gr.addColorStop(1, wbot); g.fillStyle = gr; g.fillRect(xa, yw, xb - xa, H - yw + 2); g.fillStyle = css(mix(p.hor, [255, 255, 255], 0.3), 0.5); for (let k = 0; k < (xb - xa) / 26; k++) { const hx = xa + ((hash(k * 13 + (xa | 0)) * (xb - xa) + A.t * (4 + k % 3 * 2)) % Math.max(1, xb - xa - 14)), hy = yw + 2 + hash(k * 7) * 16 * s; g.globalAlpha = 0.25 + 0.3 * Math.sin(A.t * 1.3 + k); g.fillRect(hx, hy, 6 + hash(k) * 12, 1); } g.globalAlpha = 1; };
  for (const [a, b] of c.lakes) if (b > v.x - W / s && a < v.x + W / s) water(X(a) - 1, X(b) + 1, Y(TU.WL));
  if (X(c.xEnd + 40) < W) { const xa = X(c.xEnd + 40), yw = Y(c.sea); water(xa, W + 2, yw); const gr = g.createLinearGradient(0, yw, 0, H); gr.addColorStop(0, css(p.sun, 0.34)); gr.addColorStop(1, css(p.sun, 0)); g.fillStyle = gr; const sx = Math.max(xa + 20, sun.sx); for (let k = 0; k < 26; k++) { const yy = yw + 3 + k * k * 0.5 + k * 3, ww = 10 + k * 3.2 + Math.sin(A.t * 0.9 + k) * 6; g.fillRect(sx - ww / 2 + Math.sin(A.t * 0.6 + k * 1.3) * 3, yy, ww, 1.2); } }
  for (const m of A.marks) if (m.def.at === 'lake') mark(g, A, m, p, X, Y, 0.5);
  // sol
  const body = g.createLinearGradient(0, A.base - 150 * s, 0, H); body.addColorStop(0, css(mix(p.body, p.cap, 0.14))); body.addColorStop(1, css(mix(p.body, [0, 0, 0], 0.4)));
  g.fillStyle = body; g.beginPath(); g.moveTo(X(XMIN + i0 * DX), H + 2); for (let i = i0; i <= i1; i++) g.lineTo(X(XMIN + i * DX), Y(Hh[i])); g.lineTo(X(XMIN + i1 * DX), H + 2); g.closePath(); g.fill();
  for (let i = i0; i < i1;) {
    const sf = c.S[i]; let j = i; while (j < i1 && c.S[j] === sf && !c.W[j] === !c.W[i]) j++;
    if (!c.W[i]) { const th = TH[sf] * s; g.fillStyle = css(capCol(sf, p, night, A.dark)); g.beginPath(); for (let q = i; q <= j; q++) g.lineTo(X(XMIN + q * DX), Y(Hh[q]) - 0.5); for (let q = j; q >= i; q--) g.lineTo(X(XMIN + q * DX), Y(Hh[q]) + th * (0.75 + 0.25 * vnoise(q / 4, 3))); g.closePath(); g.fill();
      if (sf === 4) { g.fillStyle = 'rgba(255,255,255,.5)'; for (let q = i; q < j; q += 9) if (hash(q) > 0.4) g.fillRect(X(XMIN + q * DX), Y(Hh[q]) + 1.2, 7 * s * hash(q + 1) + 3, 1); }
      if (sf === 6) { g.fillStyle = css(mix(p.body, [0, 0, 0], 0.2)); for (let q = i; q < j; q += 2) if (hash(q * 5) > 0.45) { g.beginPath(); g.arc(X(XMIN + q * DX), Y(Hh[q]) - 0.4 * s, (0.7 + hash(q) * 1.5) * s, 0, 7); g.fill(); } }
    }
    i = Math.max(j, i + 1);
  }
  // traces
  g.fillStyle = css(mix(p.body, [0, 0, 0], 0.1), 0.34); for (const q of A.tracks) if (q >= i0 && q <= i1) g.fillRect(X(XMIN + q * DX) - s, Y(Hh[q]) + 0.6, 2.2 * s, 1.5 * s);
  // herbes
  g.strokeStyle = css(mix(capCol(1, p, night, A.dark), p.hor, 0.2)); g.lineWidth = Math.max(1, 0.55 * s); g.lineCap = 'round'; g.beginPath();
  const bx = A.fly ? A.fly.x : A.ball.x, by = A.fly ? A.fly.y : A.ball.y;
  for (let i = i0; i < i1; i++) {
    const sf = c.S[i]; if (c.W[i] || (sf !== 1 && sf !== 0)) continue; const wx = XMIN + i * DX;
    if (sf === 1) for (let k = 0; k < 2; k++) { const jx = wx + hash(i * 3 + k) * DX, hb = 5 + 10 * hash(i * 11 + k), dxb = jx - bx; let bend = Math.sin(A.t * 1.2 + jx * 0.045) * 0.22 + Math.sin(A.t * 0.37 + jx * 0.011) * 0.2; if (Math.abs(dxb) < 15 && by - c.gy(jx) < 16) bend += Math.sign(dxb || 1) * (1 - Math.abs(dxb) / 15) * 1.1; const x0 = X(jx), y0 = Y(c.gy(jx)); g.moveTo(x0, y0); g.quadraticCurveTo(x0 + bend * hb * s * 0.3, y0 - hb * s * 0.6, x0 + bend * hb * s, y0 - hb * s * (1 - Math.abs(bend) * 0.3)); }
    else if (i % 7 === 0 && hash(i) > 0.45) { const x0 = X(wx), y0 = Y(Hh[i]), b2 = Math.sin(A.t * 1.3 + wx * 0.05) * 0.6; for (let k = -1; k <= 1; k++) { g.moveTo(x0 + k * 1.2 * s, y0); g.lineTo(x0 + (k * 2 + b2) * s, y0 - (2.2 + hash(i + k) * 1.6) * s); } }
  }
  g.stroke();
  for (const m of A.marks) if (m.def.at !== 'lake') mark(g, A, m, p, X, Y, 1);
  // drapeau
  const h = c.holes[A.hole];
  if (h) { const fx = X(h.cup), fy = Y(h.cy - TU.CUPD), top = Y(h.cy + 31), a = A.st === 'sink' ? Math.max(0, 1 - A.sink * 2) : Math.min(1, A.fade); g.globalAlpha = a; g.strokeStyle = css(mix(p.hor, [255, 255, 255], 0.5), 0.9); g.lineWidth = 1; g.beginPath(); g.moveTo(fx, fy); g.lineTo(fx, top); g.stroke(); g.fillStyle = css(p.acc); g.beginPath(); const w = Math.sin(A.t * 2.6), fl = 10 * s; g.moveTo(fx, top); g.quadraticCurveTo(fx + fl * 0.5, top + fl * 0.14 + w * 1.4, fx + fl, top + fl * 0.3 + w * 0.8); g.quadraticCurveTo(fx + fl * 0.5, top + fl * 0.42 - w, fx, top + fl * 0.6); g.fill(); g.globalAlpha = 1; }
  // visée
  if (A.aim.on && A.preview.length) { g.fillStyle = '#fff'; for (let k = 0; k < A.preview.length; k += 2) { g.globalAlpha = 0.85 * (1 - k / A.preview.length) + 0.05; g.beginPath(); g.arc(X(A.preview[k]), Y(A.preview[k + 1]), Math.max(1.1, 1.5 - k * 0.02), 0, 7); g.fill(); } g.globalAlpha = 0.22; g.strokeStyle = '#fff'; g.lineWidth = 1; g.beginPath(); g.moveTo(X(A.ball.x), Y(A.ball.y)); g.lineTo(X(A.ball.x) - Math.cos(A.aim.ang) * A.aim.p * 46, Y(A.ball.y) + Math.sin(A.aim.ang) * A.aim.p * 46); g.stroke(); g.globalAlpha = 1; }
  // balle
  const [bc, rim] = BALLS[S.ball] || BALLS.w, br = Math.max(3.5, R * s), sx2 = X(bx), sy2 = Y(by);
  if (A.fly && A.trail.length > 3) { g.strokeStyle = 'rgba(255,255,255,.28)'; g.lineWidth = br * 0.9; g.lineCap = 'round'; g.beginPath(); g.moveTo(X(A.trail[0]), Y(A.trail[1])); for (let k = 2; k < A.trail.length; k += 2) g.lineTo(X(A.trail[k]), Y(A.trail[k + 1])); g.stroke(); }
  const gyb = c.gy(bx); if (by - gyb > R + 1 && by - gyb < 260) { g.fillStyle = `rgba(0,0,10,${0.22 * (1 - (by - gyb) / 260)})`; g.beginPath(); g.ellipse(sx2, Y(gyb) + 1, br * 1.1, br * 0.35, 0, 0, 7); g.fill(); }
  g.fillStyle = bc; g.beginPath(); g.arc(sx2, sy2, br, 0, 7); g.fill(); if (rim) { g.strokeStyle = rim; g.lineWidth = 1; g.stroke(); }
  if (A.st === 'sink') { g.strokeStyle = `rgba(255,255,255,${Math.max(0, 0.7 - A.sink)})`; g.lineWidth = 1; g.beginPath(); g.arc(sx2, sy2, br + A.sink * 60, 0, 7); g.stroke(); }
  if (sy2 < -8) { g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.moveTo(sx2, 8 + A.top); g.lineTo(sx2 - 4, 15 + A.top); g.lineTo(sx2 + 4, 15 + A.top); g.fill(); }
  // météo
  const wx = A.wx, rs = (Date.now() / 1000);
  for (let i = 0; i < parts.length; i++) {
    const q = parts[i], z = q.z;
    if (wx[3] > 0.02 && i < 70) { const px = ((q.x * W + Math.sin(rs * 0.6 + i) * 14 - rs * 9 * z) % W + W) % W, py = (q.y * H + rs * 26 * z) % H; g.fillStyle = `rgba(255,255,255,${0.75 * wx[3] * z})`; g.fillRect(px, py, 1.4 + z, 1.4 + z); }
    if (wx[2] > 0.02 && i % 2 === 0) { const px = ((q.x * W + rs * 34 * z) % W), py = A.base - 90 + q.y * 190 + Math.sin(rs + i) * 6; g.fillStyle = css(mix(p.hor, [255, 255, 255], 0.2), 0.22 * wx[2] * z); g.fillRect(px, py, 2 + z * 5, 1); }
    if (wx[6] > 0.02) { const px = ((q.x * W - rs * 60 * z) % W + W) % W, py = (q.y * H + rs * 520 * z) % H; g.strokeStyle = `rgba(200,210,240,${0.3 * wx[6] * z})`; g.lineWidth = 1; g.beginPath(); g.moveTo(px, py); g.lineTo(px - 1.6, py + 11 * z); g.stroke(); }
    if (wx[5] > 0.02 && i % 3 === 0) { const px = (q.x * W + Math.sin(rs * 0.8 + i) * 10) % W, py = H - ((q.y * H + rs * 44 * z) % H); g.fillStyle = css(p.acc, 0.5 * wx[5] * z); g.fillRect(px, py, 1.5, 1.5 + z * 5); }
    if (wx[1] > 0.02 && i % 5 === 0) { const px = ((q.x * W + rs * 12 * z) % W), py = A.base - 60 + q.y * 90 + Math.sin(rs * 0.7 + i) * 12; g.fillStyle = `rgba(255,255,255,${0.4 * wx[1] * z})`; g.fillRect(px, py, 1.3, 1.3); }
  }
  post(g, A); hud(g, A, p);
}
function mark(g: CanvasRenderingContext2D, A: State, m: Mk, p: Pal, X: (x: number) => number, Y: (y: number) => number, alpha: number) {
  const x = X(m.x); if (x < -80 || x > A.W + 80) return; const col = css(mix(p.body, [0, 0, 6], 0.42)), acc = css(mix(p.hor, [255, 255, 255], 0.35));
  g.save(); g.translate(x, Y(m.y) + 0.5); g.scale(A.v.s, A.v.s); const k = A.t - m.hit; if (k < 1.6 && m.hit > 0) { g.rotate(Math.sin(k * 16) * 0.2 * (1 - k / 1.6)); g.translate(0, -Math.sin(Math.min(1, k * 3) * Math.PI) * 2.5); }
  g.globalAlpha = alpha * (S.found.includes(m.def.id) || !m.def.to ? 1 : 0.92); g.fillStyle = col; g.strokeStyle = col; m.def.draw(g, col, acc, A.t); g.restore(); g.globalAlpha = 1;
}
function post(g: CanvasRenderingContext2D, A: State) {
  g.drawImage(vig!, 0, 0, A.W, A.H); g.globalAlpha = 0.045; g.globalCompositeOperation = 'overlay';
  const ox = (Math.floor(A.t * 12) * 53) % 192, oy = (Math.floor(A.t * 12) * 91) % 192; for (let y = -oy; y < A.H; y += 192) for (let x = -ox; x < A.W; x += 192) g.drawImage(grain!, x, y);
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
}
function hud(g: CanvasRenderingContext2D, A: State, p: Pal) {
  const { W, H } = A, top = A.top + 16, ink = '#fff'; g.fillStyle = ink; g.textBaseline = 'top';
  const h = A.c.holes[A.hole], n = Math.min(A.hole + 1, A.c.holes.length), a = Math.min(1, A.fade);
  g.shadowColor = 'rgba(0,0,20,.35)'; g.shadowBlur = 8;
  g.textAlign = 'center'; g.globalAlpha = 0.92 * a; g.font = FONT(26); g.fillText(String(n), W / 2, top);
  if (h && h.par) { g.globalAlpha = 0.55 * a; g.font = FONT(11); g.fillText('par ' + h.par + (A.streakShow && S.streak > 1 ? '   ·   ' + S.streak + ' j' : ''), W / 2, top + 33); }
  g.textAlign = 'right'; g.globalAlpha = 0.8 * a; g.font = FONT(15); g.fillText(String(S.total), W - 20, top + 3);
  g.globalAlpha = 0.5 * a; g.font = FONT(11); g.fillText(S.rel === 0 ? '=' : (S.rel > 0 ? '+' : '−') + Math.abs(S.rel), W - 20, top + 24);
  if (A.strokes > 0) { g.textAlign = 'left'; g.globalAlpha = 0.8 * a; g.font = FONT(15); g.fillText(String(A.strokes), 20, top + 3); }
  if (A.titleT > 0) { const k = A.titleT, al = Math.min(1, k / 1.5, (7 - k) / 1.5); g.globalAlpha = Math.max(0, al) * 0.85; g.textAlign = 'center'; g.font = FONT(12); const str = 'L O N G   G A M E'; g.fillText(str, W / 2, H * 0.2); }
  if (A.endT > 0) { g.globalAlpha = Math.min(1, A.endT / 3) * 0.95; g.textAlign = 'center'; g.font = FONT(24); g.fillText(A.cid === 'm' ? 'Demain.' : '·', W / 2, H * 0.26); if (S.streak > 1 && A.cid === 'm') { g.globalAlpha *= 0.55; g.font = FONT(11); g.fillText(S.streak + ' j', W / 2, H * 0.26 + 36); } }
  if (A.toast.t > 0) { g.globalAlpha = Math.min(1, A.toast.t, (4 - A.toast.t) * 2) * 0.9; g.textAlign = 'center'; g.font = FONT(13); g.fillText(A.toast.s, W / 2, H - A.bot - 54); }
  g.globalAlpha = 1; g.shadowBlur = 0;
  if (A.book > 0.01) book(g, A, p);
}
export function bookLayout(W: number, H: number, top: number) {
  const cols = 6, m = 26, cw = (W - m * 2) / cols, y0 = top + 70, defs = MARKS; const cells = defs.map((d, i) => ({ id: d.id, x: m + (i % cols) * cw + cw / 2, y: y0 + Math.floor(i / cols) * cw * 0.92 + cw / 2 }));
  const yb = y0 + Math.ceil(defs.length / cols) * cw * 0.92 + 34; const balls = ['w', 'obs', 'sky', 'gold'].map((id, i) => ({ id, x: W / 2 + (i - 1.5) * 46, y: yb }));
  const crs = ['m', 'e', 'd', 'x'].map((id, i) => ({ id, x: W / 2 + (i - 1.5) * 46, y: yb + 54 })); return { cells, balls, crs, cw, yn: yb + 104 };
}
function book(g: CanvasRenderingContext2D, A: State, p: Pal) {
  const { W, H } = A, a = A.book; g.globalAlpha = a * 0.9; g.fillStyle = css(mix(p.body, [4, 5, 14], 0.8)); g.fillRect(0, 0, W, H); g.globalAlpha = a;
  const L = bookLayout(W, H, A.top), sc = Math.min(1.9, L.cw / 26);
  for (const cell of L.cells) { const d = MARKS.find((x) => x.id === cell.id)!; if (S.found.includes(d.id)) { g.save(); g.translate(cell.x, cell.y + 9 * sc * (d.at === 'sky' ? 0 : 1)); g.scale(sc * (d.big ? 0.5 : 1), sc * (d.big ? 0.5 : 1)); g.fillStyle = g.strokeStyle = 'rgba(236,238,246,.92)'; d.draw(g, 'rgba(236,238,246,.92)', css(p.acc), A.t, true); g.restore(); } else { g.fillStyle = 'rgba(255,255,255,.16)'; g.beginPath(); g.arc(cell.x, cell.y, 1.3, 0, 7); g.fill(); } }
  for (const b of L.balls) { const own = S.balls.includes(b.id); g.beginPath(); g.arc(b.x, b.y, 8, 0, 7); if (own) { g.fillStyle = BALLS[b.id][0]; g.fill(); if (b.id === 'obs') { g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 1; g.stroke(); } if (S.ball === b.id) { g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 1; g.beginPath(); g.arc(b.x, b.y, 13, 0, 7); g.stroke(); } } else { g.strokeStyle = 'rgba(255,255,255,.16)'; g.lineWidth = 1; g.setLineDash([2, 3]); g.stroke(); g.setLineDash([]); } }
  for (const c of L.crs) { if (!S.courses.includes(c.id)) continue; const q = palette(c.id, c.id === 'm' ? A.c.ptAt(A.v.x).day : 19000, 0, 0); const gr = g.createLinearGradient(0, c.y - 11, 0, c.y + 11); gr.addColorStop(0, css(q.top)); gr.addColorStop(0.6, css(q.mid)); gr.addColorStop(1, css(q.hor)); g.fillStyle = gr; g.beginPath(); g.arc(c.x, c.y, 11, 0, 7); g.fill(); g.fillStyle = css(q.body); g.beginPath(); g.arc(c.x, c.y, 11, 0.25, Math.PI - 0.25); g.fill(); if (A.cid === c.id) { g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 1; g.beginPath(); g.arc(c.x, c.y, 15, 0, 7); g.stroke(); } }
  g.fillStyle = 'rgba(255,255,255,.75)'; g.font = FONT(13); g.textAlign = 'center'; g.textBaseline = 'top';
  const nums = [S.total, S.holes, S.hio.length, S.bestClean, S.streak]; nums.forEach((n, i) => g.fillText(String(n), W / 2 + (i - 2) * (W - 70) / 5, L.yn));
  g.globalAlpha = 1;
}
function overview(g: CanvasRenderingContext2D, A: State, night: number) {
  const { W, H, c } = A, z = A.ov.z, u = A.v.s * z, pc = palette(A.cid, c.ptAt(A.ov.x).day, 0, night); sky(g, A, pc, night, H * 0.8);
  const wB = sstep(0.5, 0.07, z), prog = A.ball.x, gy0 = H * 0.8, gk = (H * 0.52) / (c.g1 - c.g0), yv = c.gy(A.ov.x);
  const yAt = (wx: number) => { const loc = A.base - (c.gy(wx) - yv) * u * (1 - wB) - (1 - wB) * 0, glo = gy0 - (c.gAt(wx) - c.g0) * gk; return loc * (1 - wB) + glo * wB; };
  const xEndPx = Math.min(W, (prog - A.ov.x) * u + W / 2);
  for (let px = 0; px < xEndPx; px += 6) {
    const wx0 = A.ov.x + (px - W / 2) / u; if (wx0 < XMIN) continue; const q = palette(A.cid, c.ptAt(wx0).day, 0, night); const x1 = Math.min(px + 6.6, xEndPx);
    const gr = g.createLinearGradient(0, H * 0.3, 0, H); gr.addColorStop(0, css(mix(q.body, q.cap, 0.3))); gr.addColorStop(1, css(mix(q.body, [0, 0, 0], 0.35))); g.fillStyle = gr; g.beginPath(); g.moveTo(px, H);
    for (let x = px; x <= x1 + 0.01; x += 2) g.lineTo(Math.min(x, x1), yAt(A.ov.x + (Math.min(x, x1) - W / 2) / u)); g.lineTo(x1, H); g.closePath(); g.fill();
  }
  g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 1; g.beginPath(); for (let px = 0; px <= xEndPx; px += 2) { const wx = A.ov.x + (px - W / 2) / u; if (wx < XMIN) continue; g.lineTo(px, yAt(wx)); } g.stroke();
  g.fillStyle = css(pc.acc); for (const h of c.holes) { if (h.cup > prog) break; if (!S.hio.includes(A.cid + Math.round(h.day * 100) / 100)) continue; const px = (h.cup - A.ov.x) * u + W / 2; if (px < 0 || px > W) continue; const y = yAt(h.cup); g.fillRect(px, y - 9, 1, 9); g.beginPath(); g.moveTo(px, y - 9); g.lineTo(px + 5, y - 7); g.lineTo(px, y - 5); g.fill(); }
  const bpx = (prog - A.ov.x) * u + W / 2; if (bpx >= 0 && bpx <= W) { g.fillStyle = '#fff'; g.beginPath(); g.arc(bpx, yAt(prog) - 3, 2.6, 0, 7); g.fill(); }
}
