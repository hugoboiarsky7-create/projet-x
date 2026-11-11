// Finitions : matières de cadran, index appliqués, verre, post-traitement. Rien ici ne touche au jeu.
import { TAU } from './tuning';
import { C2, G, rgba } from './g';
import { mkRng } from './rng';
// ——— tokens
export const TK = { gold: '#e8c25a', lume: '#ffe7a3', ink: '#f1f1f1', dim: 'rgba(255,255,255,.5)', faint: 'rgba(255,255,255,.08)', panel: '#0c0d10', bg: '#050506', hot: '#ff5a36', steel: ['#f4f6f8', '#8d949c', '#3a3e44'] as [string, string, string], goldM: ['#fff0b8', '#c9962e', '#6b4a10'] as [string, string, string], plat: ['#ffffff', '#b9c2cc', '#59626c'] as [string, string, string] };
export const FX = { low: false, gx: 0, gy: 0, ca: 0, shock: 0 };
try { FX.low = window.matchMedia('(prefers-reduced-motion: reduce)').matches || /[?&]low/.test(location.search) || localStorage.getItem('px.low') === '1'; } catch { /* */ }
try { window.addEventListener('deviceorientation', (e) => { if (e.gamma != null && e.beta != null) { FX.gx += (Math.max(-30, Math.min(30, e.gamma)) / 30 - FX.gx) * 0.08; FX.gy += (Math.max(-30, Math.min(30, e.beta - 40)) / 30 - FX.gy) * 0.08; } }); } catch { /* */ }
/** angle de la source de lumière : dérive lente + très léger gyroscope */
export const lightA = () => -2.2 + (FX.low ? 0 : Math.sin(G.now * 0.11) * 0.5) + FX.gx * 0.5;
const conic = (c: C2, a: number): CanvasGradient | null => ((c as any).createConicGradient ? (c as any).createConicGradient(a, 0, 0) : null);
export function sunburst(c: C2, R: number, light: boolean, k = 1) {
  const g = conic(c, 0.4); if (!g) return; const n = 16; for (let i = 0; i <= n; i++) g.addColorStop(i / n, i % 2 ? `rgba(255,255,255,${(light ? 0.22 : 0.1) * k})` : `rgba(0,0,0,${(light ? 0.1 : 0.28) * k})`);
  c.fillStyle = g; c.fillRect(-R, -R, 2 * R, 2 * R); const r = mkRng(7); c.lineWidth = 0.6;
  for (let i = 0; i < 420; i++) { const a = r() * TAU; c.strokeStyle = (r() < 0.5 ? 'rgba(255,255,255,' : 'rgba(0,0,0,') + (0.02 + r() * 0.05) * k + ')'; c.beginPath(); c.moveTo(Math.cos(a) * R * 0.04, Math.sin(a) * R * 0.04); c.lineTo(Math.cos(a) * R, Math.sin(a) * R); c.stroke(); }
}
export function grain(c: C2, R: number, k = 1, seed = 3) { const r = mkRng(seed); for (let i = 0; i < 2600; i++) { const a = r() * TAU, d = Math.sqrt(r()) * R; c.fillStyle = (r() < 0.5 ? 'rgba(255,255,255,' : 'rgba(0,0,0,') + r() * 0.07 * k + ')'; c.fillRect(Math.cos(a) * d, Math.sin(a) * d, 1, 1); } }
export function guilloche(c: C2, R: number, r0: number, r1: number, waves: number, amp: number, light: boolean, step = 0.022) {
  c.lineWidth = 0.7; let k = 0; for (let r = r0; r < r1; r += step, k++) { c.strokeStyle = k % 2 ? `rgba(255,255,255,${light ? 0.35 : 0.13})` : `rgba(0,0,0,${light ? 0.16 : 0.32})`; c.beginPath(); for (let i = 0; i <= 180; i++) { const a = (i / 180) * TAU, rr = (r + Math.sin(a * waves + k * 0.5) * amp) * R; if (i) c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); else c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } c.stroke(); }
}
export function tapisserie(c: C2, R: number, light: boolean) { const s = R * 0.075; for (let y = -R; y < R; y += s) for (let x = -R; x < R; x += s) { const g = c.createLinearGradient(x, y, x + s, y + s); g.addColorStop(0, `rgba(255,255,255,${light ? 0.34 : 0.14})`); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, `rgba(0,0,0,${light ? 0.2 : 0.34})`); c.fillStyle = g; c.fillRect(x + 0.6, y + 0.6, s - 1.2, s - 1.2); } }
export function lacquer(c: C2, R: number, k = 1) { const g = c.createRadialGradient(-R * 0.35, -R * 0.5, 0, -R * 0.35, -R * 0.5, R * 1.1); g.addColorStop(0, `rgba(255,255,255,${0.2 * k})`); g.addColorStop(0.35, `rgba(255,255,255,${0.04 * k})`); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.fillRect(-R, -R, 2 * R, 2 * R); const h = c.createLinearGradient(0, R * 0.3, 0, R); h.addColorStop(0, 'rgba(0,0,0,0)'); h.addColorStop(1, `rgba(0,0,0,${0.35 * k})`); c.fillStyle = h; c.fillRect(-R, -R, 2 * R, 2 * R); }
export function nacre(c: C2, R: number, x = 0, y = 0, r = R) { c.save(); c.beginPath(); c.arc(x, y, r, 0, TAU); c.clip(); c.translate(x, y); const g = conic(c, 1); if (g) { ['#ffd9ec', '#d6f5ff', '#fff6d6', '#dcffe9', '#e6dcff', '#ffd9ec'].forEach((col, i, a) => g.addColorStop(i / (a.length - 1), col)); c.globalAlpha = 0.5; c.fillStyle = g; c.fillRect(-r, -r, 2 * r, 2 * r); } const rg = mkRng(11); c.globalAlpha = 1; for (let i = 0; i < 26; i++) { const bx = (rg() * 2 - 1) * r, by = (rg() * 2 - 1) * r, br = r * (0.15 + rg() * 0.3), q = c.createRadialGradient(bx, by, 0, bx, by, br); q.addColorStop(0, `rgba(255,255,255,${0.1 + rg() * 0.14})`); q.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = q; c.fillRect(bx - br, by - br, br * 2, br * 2); } c.restore(); }
export function leaf(c: C2, R: number) { const r = mkRng(41), s = R * 0.3; for (let y = -R; y < R; y += s) for (let x = -R; x < R; x += s) { c.save(); c.translate(x + s / 2 + (r() - 0.5) * 3, y + s / 2 + (r() - 0.5) * 3); c.rotate((r() - 0.5) * 0.08); c.fillStyle = (r() < 0.5 ? 'rgba(255,250,210,' : 'rgba(90,60,0,') + (0.04 + r() * 0.13) + ')'; c.fillRect(-s / 2, -s / 2, s, s); c.strokeStyle = 'rgba(70,45,0,.22)'; c.lineWidth = 0.6; c.strokeRect(-s / 2, -s / 2, s, s); c.restore(); } for (let i = 0; i < 90; i++) { c.strokeStyle = `rgba(60,40,0,${0.05 + r() * 0.1})`; c.lineWidth = 0.5; const x = (r() * 2 - 1) * R, y = (r() * 2 - 1) * R; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (r() - 0.5) * R * 0.2, y + (r() - 0.5) * R * 0.2); c.stroke(); } }
export function pcb(c: C2, R: number, col: string) { const r = mkRng(23); c.lineWidth = Math.max(0.8, R * 0.006); c.lineCap = 'round'; for (let i = 0; i < 34; i++) { const a = Math.floor(r() * 16) * (TAU / 16), r0 = R * (0.16 + r() * 0.25), r1 = R * (0.5 + r() * 0.36), a2 = a + (r() < 0.5 ? 1 : -1) * (TAU / 32) * (1 + Math.floor(r() * 2)); c.strokeStyle = rgba(col, 0.1 + r() * 0.16); c.beginPath(); c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); const rm = (r0 + r1) / 2; c.lineTo(Math.cos(a) * rm, Math.sin(a) * rm); c.lineTo(Math.cos(a2) * (rm + R * 0.06), Math.sin(a2) * (rm + R * 0.06)); c.lineTo(Math.cos(a2) * r1, Math.sin(a2) * r1); c.stroke(); c.fillStyle = rgba(col, 0.3); c.beginPath(); c.arc(Math.cos(a2) * r1, Math.sin(a2) * r1, R * 0.011, 0, TAU); c.fill(); c.beginPath(); c.arc(Math.cos(a) * r0, Math.sin(a) * r0, R * 0.008, 0, TAU); c.fill(); } }
export function ripples(c: C2, R: number, col: string) { c.lineWidth = 0.8; for (let k = 0; k < 9; k++) { c.strokeStyle = rgba(col, 0.05 + 0.02 * (k % 3)); c.beginPath(); c.ellipse(R * 0.1, R * 0.38, R * (0.1 + k * 0.1), R * (0.03 + k * 0.032), 0, 0, TAU); c.stroke(); } }
export function mist(c: C2, R: number, cols: string[]) { const r = mkRng(77); for (let i = 0; i < 9; i++) { const x = (r() * 2 - 1) * R * 0.7, y = (r() * 2 - 1) * R * 0.7, rr = R * (0.25 + r() * 0.4), g = c.createRadialGradient(x, y, 0, x, y, rr); g.addColorStop(0, rgba(cols[i % cols.length], 0.14)); g.addColorStop(1, rgba(cols[i % cols.length], 0)); c.fillStyle = g; c.fillRect(x - rr, y - rr, rr * 2, rr * 2); } }
/** un seul motif discret, gravé */
export function motif(c: C2, R: number, id: string, ink: string) {
  c.save(); c.strokeStyle = rgba(ink, 0.2); c.fillStyle = rgba(ink, 0.2); c.lineWidth = Math.max(0.8, R * 0.007); c.lineCap = 'round'; c.lineJoin = 'round'; c.translate(0, R * 0.44); const u = R * 0.012; c.beginPath();
  const L = (p: number[]) => { c.moveTo(p[0] * u, p[1] * u); for (let i = 2; i < p.length; i += 2) c.lineTo(p[i] * u, p[i + 1] * u); };
  if (id === 'BANGKOK') { for (let k = -2; k <= 2; k++) { c.moveTo(0, 6); c.quadraticCurveTo(k * 7 * u - 3 * u * Math.sign(k), -4 * u, k * 5.5 * u, -9 * u + Math.abs(k) * 2.5 * u); c.quadraticCurveTo(k * 3 * u, -2 * u, 0, 6); } }
  else if (id === 'SHENZHEN') { L([-10, -6, 10, -6, 10, 6, -10, 6, -10, -6]); for (let k = -2; k <= 2; k++) { L([k * 4, -6, k * 4, -9]); L([k * 4, 6, k * 4, 9]); } L([-5, -2, 5, -2, 5, 2, -5, 2, -5, -2]); }
  else if (id === 'PÉKIN') { L([-11, 5, -11, -5, -5, -5, -5, 1, -8, 1, -8, -2]); L([11, 5, 11, -5, 5, -5, 5, 1, 8, 1, 8, -2]); L([-13, 7, 13, 7]); L([-2, 5, -2, -5, 2, -5, 2, 5]); }
  else if (id === 'CHENGDU') { L([-6, 9, -6, -9]); L([0, 9, 0, -10]); L([6, 9, 6, -8]); for (const x of [-6, 0, 6]) { L([x - 1.5, -3, x + 1.5, -3]); L([x - 1.5, 3, x + 1.5, 3]); } c.moveTo(0, -6 * u); c.quadraticCurveTo(5 * u, -11 * u, 10 * u, -9 * u); c.moveTo(-6 * u, -1 * u); c.quadraticCurveTo(-11 * u, -6 * u, -15 * u, -3 * u); }
  else if (id === 'CHONGQING') { L([-14, 6, -8, -4, -3, 3, 2, -8, 8, 2, 14, -3]); L([-14, 8, 14, 8]); }
  else if (id === 'SHANGHAI') { for (let k = -3; k <= 3; k++) L([0, 8, k * 4.2, -8 + Math.abs(k) * 1.6]); c.moveTo(-13 * u, -3 * u); c.quadraticCurveTo(0, -13 * u, 13 * u, -3 * u); }
  else if (id === 'HANGZHOU') { c.moveTo(-14 * u, 6 * u); c.quadraticCurveTo(0, -12 * u, 14 * u, 6 * u); c.moveTo(-9 * u, 6 * u); c.quadraticCurveTo(0, -5 * u, 9 * u, 6 * u); L([-16, 6, 16, 6]); }
  else if (id === 'SÉOUL') { c.arc(0, 0, 8 * u, 0, TAU); c.moveTo(-8 * u, 0); c.bezierCurveTo(-8 * u, -6 * u, 0, -6 * u, 0, 0); c.bezierCurveTo(0, 6 * u, 8 * u, 6 * u, 8 * u, 0); }
  else if (id === 'TOKYO') { c.arc(0, 0, 8 * u, 0, TAU); for (let k = 0; k < 16; k++) { const a = (k / 16) * TAU; c.moveTo(Math.cos(a) * 8 * u, Math.sin(a) * 8 * u); c.lineTo(Math.cos(a) * 3 * u, Math.sin(a) * 3 * u); } }
  else if (id === 'KANAZAWA') { L([-14, 6, -4, 1, 6, 3, 14, -3]); for (const [x, y] of [[-8, 3], [0, 1.6], [8, 1.5], [12, -1.5]]) for (let k = -2; k <= 2; k++) L([x, y, x + k * 2.2, y - 6 + Math.abs(k)]); }
  else if (id === 'TAKAYAMA') { for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU, cs = Math.cos(a), sn = Math.sin(a); c.moveTo(0, 0); c.lineTo(cs * 9 * u, sn * 9 * u); for (const d of [4, 6.5]) for (const s of [-1, 1]) { c.moveTo(cs * d * u, sn * d * u); c.lineTo((cs * (d + 2) - sn * s * 2) * u, (sn * (d + 2) + cs * s * 2) * u); } } }
  c.stroke(); c.restore();
}
/** index appliqué : ombre portée, biseau, reflet, lume */
export function applied(c: C2, x: number, y: number, w: number, h: number, ink: string, light: boolean) {
  c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(x + w * 0.35, y + Math.max(1.5, h * 0.06), w, h);
  const g = c.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, light ? '#4a4f57' : '#ffffff'); g.addColorStop(0.5, light ? '#15171b' : '#c9ced6'); g.addColorStop(1, light ? '#000' : '#6f7780'); c.fillStyle = g; c.fillRect(x, y, w, h);
  c.fillStyle = rgba(ink, 0.95); c.fillRect(x + w * 0.2, y + h * 0.07, w * 0.6, h * 0.86); c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(x, y, w, Math.max(0.8, h * 0.035));
}
/** verre saphir bombé : un reflet doux qui glisse, une distorsion suggérée au bord. Jamais sur un danger : alpha minuscule. */
export function glass(c: C2, R: number) {
  c.save(); c.beginPath(); c.arc(0, 0, R, 0, TAU); c.clip(); const a = lightA(), k = FX.low ? 0.6 : 1;
  const ex = Math.cos(a) * R * 0.55, ey = Math.sin(a) * R * 0.55, g = c.createRadialGradient(ex, ey, 0, ex, ey, R * 0.95); g.addColorStop(0, `rgba(255,255,255,${0.085 * k})`); g.addColorStop(0.45, `rgba(255,255,255,${0.025 * k})`); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(-R, -R, 2 * R, 2 * R);
  const rim = c.createRadialGradient(0, 0, R * 0.86, 0, 0, R); rim.addColorStop(0, 'rgba(0,0,0,0)'); rim.addColorStop(0.75, 'rgba(0,0,0,.22)'); rim.addColorStop(1, 'rgba(255,255,255,.1)'); c.fillStyle = rim; c.fillRect(-R, -R, 2 * R, 2 * R);
  c.strokeStyle = `rgba(255,255,255,${0.2 * k})`; c.lineWidth = Math.max(1, R * 0.008); c.beginPath(); c.arc(0, 0, R * 0.985, a - 0.55, a + 0.55); c.stroke(); c.strokeStyle = `rgba(255,255,255,${0.07 * k})`; c.beginPath(); c.arc(0, 0, R * 0.985, a + Math.PI - 0.35, a + Math.PI + 0.35); c.stroke();
  c.restore();
}
/** reflet tournant sur le cadran (brossé soleil vivant) */
export function sheen(c: C2, R: number, k = 1) { if (FX.low) return; const g = conic(c, lightA()); if (!g) return; c.save(); c.beginPath(); c.arc(0, 0, R * 0.93, 0, TAU); c.clip(); c.globalCompositeOperation = 'lighter'; for (const [p, v] of [[0, 0.07], [0.06, 0], [0.44, 0], [0.5, 0.045], [0.56, 0], [0.94, 0], [1, 0.07]]) g.addColorStop(p, `rgba(255,255,255,${v * k})`); c.fillStyle = g; c.fillRect(-R, -R, 2 * R, 2 * R); c.restore(); }
// ——— post : vignette, grain fin, aberration sur impact
let vig: HTMLCanvasElement | null = null, vkey = '', grn: HTMLCanvasElement | null = null, tmp: HTMLCanvasElement | null = null;
let ema = 0.016, slowT = 0;
export function post(c: C2, cv: HTMLCanvasElement, dt: number) {
  // garde-fou : si l'appareil ne suit pas, on passe seul en effets réduits
  ema += (dt - ema) * 0.05; if (ema > 0.024) { slowT += dt; if (slowT > 2.5) FX.low = true; } else slowT = 0;
  const W = G.W, H = G.H, key = W + 'x' + H;
  if (vkey !== key) { vkey = key; vig = document.createElement('canvas'); vig.width = Math.ceil(W / 4); vig.height = Math.ceil(H / 4); const v = vig.getContext('2d')!, g = v.createRadialGradient(vig.width / 2, vig.height / 2, Math.min(vig.width, vig.height) * 0.42, vig.width / 2, vig.height / 2, Math.hypot(vig.width, vig.height) * 0.6); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.6)'); v.fillStyle = g; v.fillRect(0, 0, vig.width, vig.height); }
  if (FX.ca > 0 && !FX.low) { // aberration chromatique : 150 ms au plus
    const k = Math.min(1, FX.ca / 0.15), sw = Math.ceil(cv.width / 2), sh = Math.ceil(cv.height / 2); if (!tmp || tmp.width !== sw || tmp.height !== sh) { tmp = document.createElement('canvas'); tmp.width = sw; tmp.height = sh; }
    const t = tmp.getContext('2d')!; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'screen';
    for (const [col, off] of [['#ff0030', -1], ['#00c8ff', 1]] as [string, number][]) { t.globalCompositeOperation = 'source-over'; t.drawImage(cv, 0, 0, sw, sh); t.globalCompositeOperation = 'multiply'; t.fillStyle = col; t.fillRect(0, 0, sw, sh); c.globalAlpha = 0.5 * k; c.drawImage(tmp, off * 7 * k * G.dpr, 0, cv.width, cv.height); }
    c.restore(); FX.ca -= dt;
  }
  c.drawImage(vig!, 0, 0, W, H);
  if (!FX.low) { // grain très fin : une seule image pré-tuilée, décalée à chaque trame
    if (!grn || grn.width < W + 64 || grn.height < H + 64) { grn = document.createElement('canvas'); grn.width = W + 64; grn.height = H + 64; const q = grn.getContext('2d')!, d = q.createImageData(grn.width, grn.height); for (let i = 0; i < d.data.length; i += 4) { const v = Math.random() < 0.5 ? 0 : 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = Math.random() * 16; } q.putImageData(d, 0, 0); }
    const k = Math.floor(G.now * 14); c.drawImage(grn, -((k * 37) % 64), -((k * 71) % 64)); }
}
/** matière métallique brossée pour panneaux et cartes */
export function plate(c: C2, x: number, y: number, w: number, h: number, cols: [string, string, string], k = 1) {
  const g = c.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, cols[1]); g.addColorStop(0.28, cols[0]); g.addColorStop(0.55, cols[1]); g.addColorStop(1, cols[2]); c.fillStyle = g; c.fill();
  c.save(); c.clip(); c.globalAlpha = 0.1 * k; const r = mkRng(Math.round(x + y * 3 + w)); for (let yy = y; yy < y + h; yy += 1.3) { c.fillStyle = r() < 0.5 ? '#fff' : '#000'; c.fillRect(x, yy, w, 0.6); } c.restore();
}
