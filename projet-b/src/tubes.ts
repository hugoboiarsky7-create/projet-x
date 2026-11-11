// Un tube de néon est un objet : gaine colorée, cœur blanc, électrodes.
import { parts, jamoParts, ends, isSyl, type Part } from './hangul';
import { PIC } from './data/pictos';
const LAT: Record<string, string> = { N: 'M2 9V1L8 9V1', E: 'M8 1H2V9H8M2 5H7M4.200 -0.800L6.600 -2', O: 'M1.500 5a3.500 4 0 1 0 7 0a3.500 4 0 1 0 -7 0' };
const cache = new Map<string, { p: Path2D; e: number[] }>();
function fromParts(ps: Part[], size: number) { const p = new Path2D(), e: number[] = []; for (const q of ps) { const [x0, y0, x1, y1] = q.box, sx = ((x1 - x0) * size) / 10, sy = ((y1 - y0) * size) / 10; p.addPath(new Path2D(q.d), new DOMMatrix([sx, 0, 0, sy, x0 * size, y0 * size])); const en = ends(q.d); for (let i = 0; i < en.length; i += 2) e.push(x0 * size + en[i] * sx, y0 * size + en[i + 1] * sy); } return { p, e }; }
/** tracé d'un bloc, d'un jamo isolé (préfixe « j: ») ou d'un pictogramme (préfixe « p: »), dans un carré de côté size */
export function shape(key: string, size: number) {
  const k = key + '@' + Math.round(size * 2); let c = cache.get(k); if (c) return c;
  if (key.startsWith('p:')) { const p = new Path2D(); p.addPath(new Path2D(PIC[key.slice(2)] || ''), new DOMMatrix([size / 24, 0, 0, size / 24, 0, 0])); c = { p, e: [] }; }
  else if (key.startsWith('s:')) { const [, ch, roles] = key.split(':'); c = fromParts(parts(ch).filter((q) => roles.includes(q.role)), size); }
  else if (key.startsWith('l:')) { const p = new Path2D(); p.addPath(new Path2D(LAT[key.slice(2)] || ''), new DOMMatrix([size / 10, 0, 0, size / 10, 0, 0])); c = { p, e: [] }; }
  else if (key.startsWith('j:')) c = fromParts(jamoParts(key.slice(2)), size); else c = fromParts(isSyl(key) ? parts(key) : jamoParts(key), size);
  if (cache.size > 900) cache.clear(); cache.set(k, c); return c;
}
export function tube(g: CanvasRenderingContext2D, key: string, x: number, y: number, size: number, col: string, lit: number, w = Math.max(1.5, size * 0.085), detail = false, glass = 1) {
  const s = shape(key, size); g.save(); g.translate(x, y); g.lineCap = 'round'; g.lineJoin = 'round';
  if (lit < 1 && glass > 0) { g.globalAlpha = (1 - lit) * glass; g.strokeStyle = 'rgba(120,132,156,.36)'; g.lineWidth = w; g.stroke(s.p); g.strokeStyle = 'rgba(255,255,255,.2)'; g.lineWidth = Math.max(0.6, w * 0.22); g.stroke(s.p); }
  if (lit > 0) { g.globalAlpha = lit; g.strokeStyle = col; g.lineWidth = w; g.stroke(s.p); g.globalAlpha = lit * 0.95; g.strokeStyle = '#fff'; g.lineWidth = Math.max(0.7, w * 0.36); g.stroke(s.p); }
  if (detail && w >= 4) { g.globalAlpha = 1; for (let i = 0; i < s.e.length; i += 2) { g.fillStyle = '#1b1d23'; g.beginPath(); g.arc(s.e[i], s.e[i + 1], w * 0.62, 0, 7); g.fill(); g.strokeStyle = 'rgba(150,158,172,.5)'; g.lineWidth = 1; g.stroke(); } }
  g.restore();
}
/** un mot en tubes : blocs côte à côte (ou empilés) */
export function word(g: CanvasRenderingContext2D, w: string, x: number, y: number, bs: number, col: string, lit: number | number[], vert = false, gap = 0.12, glass = 1) {
  let i = 0, k = 0; for (const ch of w) { if (ch === ' ') { i += 0.45; continue; } const l = typeof lit === 'number' ? lit : lit[k] ?? 0; tube(g, ch, vert ? x : x + i * bs * (1 + gap), vert ? y + i * bs * (1 + gap) : y, bs, col, l, Math.max(1.4, bs * 0.1), false, glass); i++; k++; }
}
export const wordLen = (w: string, bs: number, gap = 0.12) => { let n = 0; for (const ch of w) n += ch === ' ' ? 0.45 : 1; return n * bs * (1 + gap) - bs * gap; };
