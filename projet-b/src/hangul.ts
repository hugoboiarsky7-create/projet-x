// Hangeul en tubes : chaque jamo est un tracé, chaque bloc une composition. Aucune police.
export const LEAD = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
export const VOW = ['ㅏ', 'ㅐ', 'ㅑ', 'ㅒ', 'ㅓ', 'ㅔ', 'ㅕ', 'ㅖ', 'ㅗ', 'ㅘ', 'ㅙ', 'ㅚ', 'ㅛ', 'ㅜ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅠ', 'ㅡ', 'ㅢ', 'ㅣ'];
export const TAIL = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];
const TAIL2: Record<string, string> = { 'ㄳ': 'ㄱㅅ', 'ㄵ': 'ㄴㅈ', 'ㄶ': 'ㄴㅎ', 'ㄺ': 'ㄹㄱ', 'ㄻ': 'ㄹㅁ', 'ㄼ': 'ㄹㅂ', 'ㄽ': 'ㄹㅅ', 'ㄾ': 'ㄹㅌ', 'ㄿ': 'ㄹㅍ', 'ㅀ': 'ㄹㅎ', 'ㅄ': 'ㅂㅅ' };
export const isSyl = (ch: string) => { const c = ch.charCodeAt(0); return c >= 0xac00 && c <= 0xd7a3; };
export function split(ch: string): [string, string, string] { const c = ch.charCodeAt(0) - 0xac00; return [LEAD[Math.floor(c / 588)], VOW[Math.floor((c % 588) / 28)], TAIL[c % 28]]; }
export function join(l: string, v: string, t = ''): string { return String.fromCharCode(0xac00 + LEAD.indexOf(l) * 588 + VOW.indexOf(v) * 28 + TAIL.indexOf(t)); }
export const isVowel = (j: string) => VOW.includes(j);
export const VERT = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅣ', HORZ = 'ㅗㅛㅜㅠㅡ';
const COMP: Record<string, [string, string]> = { 'ㅘ': ['ㅗ', 'ㅏ'], 'ㅙ': ['ㅗ', 'ㅐ'], 'ㅚ': ['ㅗ', 'ㅣ'], 'ㅝ': ['ㅜ', 'ㅓ'], 'ㅞ': ['ㅜ', 'ㅔ'], 'ㅟ': ['ㅜ', 'ㅣ'], 'ㅢ': ['ㅡ', 'ㅣ'] };
export const vowelKind = (v: string) => (VERT.includes(v) ? 'v' : HORZ.includes(v) ? 'h' : 'c');
// la syllabe porteuse : une consonne seule serait lue par son nom
export const carrier = (j: string) => (isVowel(j) ? join('ㅇ', j) : join(j, 'ㅏ'));
/** jamo d'une syllabe, dans l'ordre d'écriture */
export const jamos = (ch: string) => split(ch).filter(Boolean);
const circ = (x: number, y: number, r: number) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
// tracés sur une grille 10×10
const J: Record<string, string> = {
  'ㄱ': 'M1.2 2H8.2V9', 'ㄴ': 'M2 1V8H9', 'ㄷ': 'M9 2H2V8H9', 'ㄹ': 'M1.5 1.5H8.5V5H1.5V8.5H8.5', 'ㅁ': 'M1.6 1.6H8.4V8.4H1.6Z', 'ㅂ': 'M2 1V8.5H8V1M2 4.6H8',
  'ㅅ': 'M1.4 8.8L5 1.4L8.6 8.8', 'ㅇ': circ(5, 5, 3.6), 'ㅈ': 'M1.4 1.8H8.6M1.4 8.8L5 2L8.6 8.8', 'ㅊ': 'M3.5 0.7H6.5M1.4 2.9H8.6M1.4 9.1L5 3.1L8.6 9.1',
  'ㅋ': 'M1.2 2H8.2V9M1.5 5.3H8.2', 'ㅌ': 'M9 2H2V8H9M2 5H8.6', 'ㅍ': 'M1 2H9M1 8.4H9M3.4 2V8.4M6.6 2V8.4', 'ㅎ': 'M3.5 0.9H6.5M1.4 3.2H8.6' + circ(5, 6.8, 2.2),
  'ㅏ': 'M4 0.5V9.5M4 5H8.6', 'ㅑ': 'M4 0.5V9.5M4 3.5H8.6M4 6.5H8.6', 'ㅓ': 'M6.2 0.5V9.5M1.4 5H6.2', 'ㅕ': 'M6.2 0.5V9.5M1.4 3.5H6.2M1.4 6.5H6.2', 'ㅣ': 'M5 0.5V9.5',
  'ㅐ': 'M2.6 0.9V9.1M2.6 5H6.8M6.8 0.5V9.5', 'ㅒ': 'M2.6 0.9V9.1M2.6 3.6H6.8M2.6 6.4H6.8M6.8 0.5V9.5', 'ㅔ': 'M4.2 0.9V9.1M0.8 5H4.2M7.6 0.5V9.5', 'ㅖ': 'M4.2 0.9V9.1M0.8 3.6H4.2M0.8 6.4H4.2M7.6 0.5V9.5',
  'ㅗ': 'M0.5 7H9.5M5 2V7', 'ㅛ': 'M0.5 7H9.5M3.4 2V7M6.6 2V7', 'ㅜ': 'M0.5 3H9.5M5 3V8.6', 'ㅠ': 'M0.5 3H9.5M3.4 3V8.6M6.6 3V8.6', 'ㅡ': 'M0.5 5H9.5',
};
type Box = [number, number, number, number];
export interface Part { j: string; d: string; box: Box; role: 'l' | 'v' | 't' }
const dbl = (j: string) => ({ 'ㄲ': 'ㄱ', 'ㄸ': 'ㄷ', 'ㅃ': 'ㅂ', 'ㅆ': 'ㅅ', 'ㅉ': 'ㅈ' } as Record<string, string>)[j];
/** tracés (grille 10×10) et boîtes d'un jamo quand il occupe la boîte donnée */
function place(j: string, b: Box, role: Part['role']): Part[] {
  const d2 = dbl(j); if (d2) { const w = (b[2] - b[0]) / 2; return [{ j: d2, d: J[d2], box: [b[0], b[1], b[0] + w * 0.96, b[3]], role }, { j: d2, d: J[d2], box: [b[0] + w * 1.04, b[1], b[2], b[3]], role }]; }
  const t2 = TAIL2[j]; if (t2) { const w = (b[2] - b[0]) / 2; return [...place(t2[0], [b[0], b[1], b[0] + w * 0.94, b[3]], role), ...place(t2[1], [b[0] + w * 1.06, b[1], b[2], b[3]], role)]; }
  return [{ j, d: J[j], box: b, role }];
}
/** les emplacements d'un bloc (carré unité) : consonne initiale, voyelle(s), finale */
export function slots(v: string, hasTail: boolean): { l: Box; v: Box; v2?: Box; t?: Box } {
  const k = vowelKind(v), wide = 'ㅐㅒㅔㅖ'.includes(v);
  if (!hasTail) {
    if (k === 'v') return { l: [0.05, 0.14, wide ? 0.5 : 0.56, 0.86], v: [wide ? 0.5 : 0.56, 0.03, 0.97, 0.97] };
    if (k === 'h') return { l: [0.16, 0.04, 0.84, 0.5], v: [0.03, 0.44, 0.97, 0.96] };
    const w2 = 'ㅙㅞ'.includes(v); return { l: [0.05, 0.05, w2 ? 0.52 : 0.6, 0.5], v: [0.02, 0.44, w2 ? 0.56 : 0.64, 0.94], v2: [w2 ? 0.52 : 0.6, 0.03, 0.98, 0.97] };
  }
  if (k === 'v') return { l: [0.05, 0.05, wide ? 0.5 : 0.56, 0.56], v: [wide ? 0.5 : 0.56, 0.02, 0.97, 0.6], t: [0.14, 0.64, 0.92, 0.97] };
  if (k === 'h') return { l: [0.18, 0.02, 0.82, 0.34], v: [0.03, 0.3, 0.97, 0.62], t: [0.16, 0.66, 0.84, 0.98] };
  const w2 = 'ㅙㅞ'.includes(v); return { l: [0.05, 0.03, w2 ? 0.52 : 0.6, 0.36], v: [0.02, 0.3, w2 ? 0.56 : 0.64, 0.6], v2: [w2 ? 0.52 : 0.6, 0.02, 0.98, 0.6], t: [0.14, 0.66, 0.9, 0.98] };
}
/** toutes les pièces d'une syllabe, dans le carré unité */
export function parts(ch: string): Part[] {
  if (!isSyl(ch)) return J[ch] ? place(ch, isVowel(ch) ? (VERT.includes(ch) ? [0.2, 0, 0.8, 1] : [0, 0.2, 1, 0.8]) : [0.08, 0.08, 0.92, 0.92], isVowel(ch) ? 'v' : 'l') : [];
  const [l, v, t] = split(ch), s = slots(v, !!t), out: Part[] = [...place(l, s.l, 'l')];
  if (COMP[v]) { out.push(...place(COMP[v][0], s.v, 'v'), ...place(COMP[v][1], s.v2!, 'v')); } else out.push(...place(v, s.v, 'v'));
  if (t) out.push(...place(t, s.t!, 't'));
  return out;
}
export const glyph = (j: string) => J[j] || (COMP[j] ? '' : '');
/** tracé d'un jamo isolé (composé inclus) dans le carré unité */
export function jamoParts(j: string): Part[] {
  if (COMP[j]) return [...place(COMP[j][0], [0.02, 0.2, 0.66, 0.86], 'v'), ...place(COMP[j][1], [0.6, 0.02, 0.98, 0.98], 'v')];
  if (isVowel(j)) return place(j, VERT.includes(j) ? [0.22, 0.02, 0.78, 0.98] : [0.02, 0.22, 0.98, 0.78], 'v');
  return place(j, [0.1, 0.1, 0.9, 0.9], 'l');
}
/** extrémités des tubes ouverts d'un tracé (pour les électrodes) */
export function ends(d: string): number[] {
  const out: number[] = [];
  for (const sub of d.split('M').filter(Boolean)) {
    if (/[aZ]/.test(sub)) continue; const tk: string[] = sub.match(/[HVL]|-?[\d.]+/g) || []; let x = +tk[0], y = +tk[1], i = 2, cmd = 'L'; const sx = x, sy = y;
    while (i < tk.length) { const t = tk[i]; if (/[HVL]/.test(t)) { cmd = t; i++; continue; } if (cmd === 'H') { x = +t; i++; } else if (cmd === 'V') { y = +t; i++; } else { x = +t; y = +tk[i + 1]; i += 2; } }
    out.push(sx, sy, x, y);
  }
  return out;
}
