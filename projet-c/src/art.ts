// Composition des tuiles : ingrédients, préparations, plats dressés.
import { ING } from './data/ingredients';
import { REC } from './data/recipes';
import type { Tile } from './logic';
const c = (x: number, y: number, r: number, f: string, o = 1) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f}"${o < 1 ? ` opacity="${o}"` : ''}/>`;
const e = (x: number, y: number, rx: number, ry: number, f: string, rot = 0, o = 1) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${f}"${rot ? ` transform="rotate(${rot} ${x} ${y})"` : ''}${o < 1 ? ` opacity="${o}"` : ''}/>`;
const l = (d: string, s: string, w = 2, o = 1) => `<path d="${d}" fill="none" stroke="${s}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${o < 1 ? ` opacity="${o}"` : ''}/>`;
const p = (d: string, f: string, o = 1) => `<path d="${d}" fill="${f}"${o < 1 ? ` opacity="${o}"` : ''}/>`;
const ring = (r: number, s: string, w: number, dash = '') => `<circle cx="32" cy="32" r="${r}" fill="none" stroke="${s}" stroke-width="${w}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
const STAR = 'M0-5l1.5 3.2 3.5.4-2.6 2.4.7 3.5L0 2.8-3.1 4.5l.7-3.5L-5-1.4l3.5-.4z';
export const svg = (inner: string, cls = '') => `<svg viewBox="0 0 64 64" class="${cls}" aria-hidden="true">${inner}</svg>`;
// vaisselle par cuisine
function crockery(kit: string, stars: number) {
  const gold = stars >= 2 ? ring(27.2, '#d9a441', stars >= 3 ? 2.2 : 1.3) : '';
  const sh = e(32, 35, 27, 26, '#000', 0, 0.18);
  if (kit === 'trat') return sh + c(32, 32, 27, '#f3e6cf') + ring(23, '#b5452b', 1.6) + c(32, 32, 19, '#f8f0e0') + gold;
  if (kit === 'seoul') return sh + c(32, 32, 27, '#26272b') + c(32, 32, 23, '#3a3b41') + ring(23, '#55565e', 1) + gold;
  if (kit === 'cheng') return sh + c(32, 32, 27, '#fbfaf5') + ring(23.5, '#1f4e8c', 2.2, '3 2.4') + ring(20.4, '#1f4e8c', 0.8) + gold;
  if (kit === 'bkk') return sh + c(32, 32, 27, '#9cc3a8') + c(32, 32, 22, '#b9d8c2') + ring(22, '#86b096', 1) + gold;
  if (kit === 'tokyo') return e(32, 35, 28, 24, '#000', 0, 0.18) + `<rect x="5" y="9" width="54" height="46" rx="7" fill="#2b3033"/><rect x="8" y="12" width="48" height="40" rx="5" fill="#363c40"/>` + (stars >= 2 ? `<rect x="6.2" y="10.2" width="51.6" height="43.6" rx="6" fill="none" stroke="#d9a441" stroke-width="${stars >= 3 ? 2 : 1.2}"/>` : '');
  return sh + c(32, 32, 27, '#fdfcf8') + ring(23, '#3d6fb4', 1.5) + c(32, 32, 19.5, '#ffffff') + gold;
}
function content(style: string, [a, b, d]: [string, string, string]) {
  switch (style) {
    case 'pasta': return e(32, 33, 17, 14, a) + l('M18 33c4-9 20-11 26-2', '#fff', 2.4, 0.45) + l('M20 38c6-7 18-7 24-1', '#000', 2.4, 0.14) + l('M23 28c5-5 13-5 18 0', '#fff', 2.2, 0.4) + l('M25 42c4-3 10-3 14 0', '#fff', 2, 0.35) + c(27, 30, 3, b) + c(37, 33, 3.4, b) + c(31, 39, 2.6, b) + c(34, 26, 1.4, d) + c(24, 36, 1.3, d) + c(40, 39, 1.3, d) + c(30, 34, 1.1, d);
    case 'tartare': return c(32, 33, 14, a) + c(32, 33, 14, '#000', 0.08) + c(32, 32, 13, a) + [[25, 29], [38, 28], [28, 39], [39, 37], [33, 25], [23, 35]].map(([x, y]) => c(x, y, 1.2, '#000', 0.16)).join('') + c(32, 31, 5.4, b) + c(30.4, 29.4, 1.5, '#fff', 0.5) + c(42, 44, 1.6, d) + c(21, 43, 1.4, d) + c(44, 22, 1.3, d);
    case 'salad': return e(27, 30, 11, 8, a, -30) + e(38, 31, 11, 8, a, 35) + e(32, 39, 12, 8, a, 5) + e(28, 30, 8, 4, '#fff', -30, 0.18) + e(38, 31, 8, 4, '#000', 35, 0.08) + `<rect x="24" y="33" width="7" height="2.4" rx="1" fill="${b}" transform="rotate(20 27 34)"/><rect x="34" y="27" width="7" height="2.4" rx="1" fill="${b}" transform="rotate(-35 37 28)"/><rect x="33" y="39" width="6" height="2.2" rx="1" fill="${b}" transform="rotate(60 36 40)"/>` + c(30, 26, 2.2, d) + c(40, 37, 2, d) + c(25, 40, 1.8, d);
    case 'tart': return p('M32 16l15 28c-9 5-21 5-30 0z', b) + p('M32 21l11.5 22c-7 3.4-16 3.4-23 0z', a) + p('M32 21l5 9.5c-3 1.4-7 1.4-10 0z', '#fff', 0.25) + c(32, 37, 3, d) + c(26, 41, 1.6, d) + c(38, 41, 1.6, d);
    case 'mound': return c(32, 33, 12, a) + p('M20 33a12 12 0 0 0 24 0c0 8-5 13-12 13s-12-5-12-13z', '#000', 0.08) + c(22, 27, 5, b) + c(43, 30, 4.4, b) + c(27, 43, 4, b) + e(38, 23, 4, 2, d, -30) + e(44, 40, 3.6, 1.8, d, 30) + e(27, 28, 4, 1.8, '#fff', -30, 0.4);
    case 'cup': return c(32, 32, 15, '#fff', 0.5) + c(32, 32, 13, a) + p('M19 32a13 13 0 0 1 26 0c-4-4-8-5-13-5s-9 1-13 5z', b) + c(27, 36, 1.4, b) + c(35, 38, 1.2, b) + c(38, 34, 1.6, d) + c(30, 27, 1.2, d);
    case 'bowl': return c(32, 32, 18, a) + p('M32 32L20 20a17 17 0 0 1 24 0z', b) + p('M32 32l17-1a17 17 0 0 1-7 14z', d) + p('M32 32L21 44a17 17 0 0 1-6-13z', b, 0.75) + p('M32 32l10 13a17 17 0 0 1-21-1z', d, 0.7) + c(32, 32, 5.4, '#fbfaf5') + c(32, 32, 3, '#f6b93b');
    case 'rolls': return [[23, 24], [41, 24], [23, 41], [41, 41], [32, 32]].map(([x, y]) => c(x, y, 8, a) + c(x, y, 6.2, b) + c(x, y, 2.4, d) + c(x - 2.4, y + 1, 1.2, '#e76f51') + c(x + 2, y + 1.6, 1.2, '#6a994e')).join('');
    case 'fried': return [[24, 28, 8, 6, -20], [39, 27, 8, 6, 25], [31, 38, 9, 6.5, 5], [42, 39, 6, 5, -30], [22, 40, 6, 5, 30]].map(([x, y, rx, ry, a2]) => e(x, y, rx, ry, a, a2) + e(x - 1.5, y - 1.6, rx * 0.5, ry * 0.3, '#fff', a2, 0.35) + c(x + 2, y + 1.6, 1.3, b)).join('') + c(45, 21, 3.6, d) + c(45, 21, 2.2, b);
    case 'soup': return c(32, 32, 19, a) + e(27, 27, 9, 4, '#fff', -25, 0.16) + l('M21 33c4-6 14-7 20-2', b, 2.4) + l('M23 38c5-5 13-5 18 0', b, 2.4) + l('M27 29c3-3 8-3 11 0', b, 2) + c(41, 26, 3.4, d) + c(24, 42, 3, d) + c(38, 42, 2.4, d) + c(30, 23, 1.2, '#fff', 0.5) + c(44, 35, 1, '#fff', 0.5);
    case 'sushi': return [[22, 26], [36, 38]].map(([x, y]) => `<rect x="${x - 9}" y="${y - 5}" width="24" height="12" rx="6" fill="${a}" transform="rotate(-18 ${x + 3} ${y + 1})"/><rect x="${x - 10}" y="${y - 8}" width="26" height="10" rx="5" fill="${b}" transform="rotate(-18 ${x + 3} ${y - 3})"/>` + l(`M${x - 3} ${y - 4}l4-3M${x + 4} ${y - 6}l4-3`, '#fff', 1.4, 0.5)).join('') + c(46, 22, 3.6, d) + e(18, 43, 5, 2.4, '#f7c6d0', -18);
    case 'balls': return c(24, 28, 8, a) + c(40, 28, 8, a) + c(32, 40, 8, a) + c(21.6, 25.4, 2.4, '#fff', 0.5) + c(37.6, 25.4, 2.4, '#fff', 0.5) + c(29.6, 37.4, 2.4, '#fff', 0.5) + [[26, 31], [42, 30], [34, 43], [22, 30], [38, 31], [30, 42]].map(([x, y]) => c(x, y, 0.9, b)).join('') + c(32, 31, 1.6, d);
    case 'layers': return `<rect x="17" y="18" width="30" height="28" rx="3" fill="${b}"/><rect x="17" y="18" width="30" height="7" rx="3" fill="${a}"/><rect x="17" y="29" width="30" height="5" fill="${a}"/><rect x="17" y="38" width="30" height="5" fill="${a}"/>` + c(25, 21, 2.4, d) + c(36, 21.5, 3, d) + c(42, 20.6, 1.6, d) + c(30, 21, 1.2, '#b5452b');
  }
  return c(32, 32, 14, a);
}
const stars = (n: number, x = 32, y = 57) => Array.from({ length: n }, (_, i) => `<path d="${STAR}" transform="translate(${x + (i - (n - 1) / 2) * 11} ${y}) scale(${n >= 3 ? 1.05 : 0.95})" fill="#f2c14e" stroke="#2f2a26" stroke-width=".5"/>`).join('');
export function dishArt(rec: string, q: number, kit: string) { const r = REC[rec]; const k = r.kit === '*' ? kit : r.kit; return crockery(k === 'omakase' ? 'home' : k, q) + content(r.style, r.col) + (q > 1 ? stars(q) : ''); }
const mini = (id: string, x: number, y: number, s: number, o = 1) => `<g transform="translate(${x} ${y}) scale(${s})"${o < 1 ? ` opacity="${o}"` : ''}>${ING[id] || ''}</g>`;
export function prepArt(rec: string, miss: string, q: number) {
  const have = REC[rec].ing.filter((x) => x !== miss);
  return e(32, 35, 27, 25, '#000', 0, 0.16) + c(32, 32, 27, '#aeb6c1') + c(32, 32, 23.5, '#e3e8ee') + p('M9.4 28a23.5 23.5 0 0 1 20-19.4A26 26 0 0 0 9.4 28z', '#fff', 0.5) + mini(have[0], 6, 8, 0.46) + mini(have[1], 28, 12, 0.46)
    + `<circle cx="34" cy="45" r="11" fill="#fff" opacity=".55"/><circle cx="34" cy="45" r="11" fill="none" stroke="#6b7480" stroke-width="1.3" stroke-dasharray="2.6 2.4"/>` + mini(miss, 23.2, 34.2, 0.34, 0.62) + (q > 1 ? `<g transform="translate(52 12)"><circle r="6.5" fill="#2f2a26"/><circle cx="-2" r="1.9" fill="#fff"/><circle cx="2" r="1.9" fill="#fff"/></g>` : '');
}
export function tileArt(t: Tile, kit: string): string {
  if (t.k === 'dish') return dishArt(t.a, t.q, kit);
  if (t.k === 'prep') return prepArt(t.a, t.miss!, t.q);
  if (t.k === 'ing') return t.q > 1 ? mini(t.a, -3, -1, 0.74) + mini(t.a, 19, 18, 0.74) : mini(t.a, -3.5, -3.5, 1.11);
  if (t.k === 'side') return mini('kimchi', -1, -3, 1.02) + Array.from({ length: t.q }, (_, i) => c(32 + (i - (t.q - 1) / 2) * 7, 58, 2.3, '#d7372f')).join('');
  if (t.k === 'dirty') return mini(t.a, -1, -1, 1.03);
  return mini(t.k === 'joker' ? 'joker' : t.a, -2.5, -2.5, 1.08);
}
export const BG: Record<string, string> = { ing: '#fbf8f1', prep: '#efe7d6', dish: 'transparent', dirty: '#d9d3c6', ice: '#eaf6fc', joker: '#fff3d6', pot: '#dfe5ec', chili: '#fde3dc', side: '#fbf8f1', flav: '#f4efe0', steak: '#e8dccd', bolo: '#e8dccd' };
