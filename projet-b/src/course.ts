// Progression invisible : génération des étapes d'un niveau + répétition espacée. Pur, testable hors navigateur.
import { DISTRICTS, WD, type Sign } from './data/words';
import { jamos, isVowel, split, isSyl } from './hangul';
export interface Step { k: 'T' | 'F' | 'B' | 'R' | 'L' | 'P'; items?: string[]; target?: string; opts?: string[]; syl?: string; tray?: string[]; word?: string; wi?: number; rev?: boolean; last?: boolean }
export interface Prog { known: string; jam: Record<string, number>; wrd: Record<string, number>; lit: number[]; seenW: string[] }
export const freshProg = (): Prog => ({ known: '', jam: {}, wrd: {}, lit: DISTRICTS.map(() => 0), seenW: [] });
type Rnd = () => number;
const SIM: Record<string, string> = { 'ㅏ': 'ㅓㅑ', 'ㅓ': 'ㅏㅕ', 'ㅗ': 'ㅜㅛ', 'ㅜ': 'ㅗㅠ', 'ㅡ': 'ㅣㅗ', 'ㅣ': 'ㅡㅏ', 'ㄱ': 'ㅋㄴ', 'ㅋ': 'ㄱㅌ', 'ㄴ': 'ㄱㄷ', 'ㄷ': 'ㅌㄴ', 'ㅌ': 'ㄷㅋ', 'ㄹ': 'ㄷㅁ', 'ㅁ': 'ㅂㅇ', 'ㅂ': 'ㅍㅁ', 'ㅍ': 'ㅂㅌ', 'ㅅ': 'ㅈㅎ', 'ㅈ': 'ㅊㅅ', 'ㅊ': 'ㅈㅎ', 'ㅇ': 'ㅁㅎ', 'ㅎ': 'ㅇㅊ', 'ㅐ': 'ㅏㅓ', 'ㅔ': 'ㅓㅏ', 'ㅑ': 'ㅏㅕ', 'ㅕ': 'ㅓㅑ', 'ㅛ': 'ㅗㅠ', 'ㅠ': 'ㅜㅛ', 'ㅘ': 'ㅗㅏ', 'ㅝ': 'ㅜㅓ', 'ㅢ': 'ㅡㅣ', 'ㅟ': 'ㅜㅣ', 'ㄲ': 'ㄱㅋ', 'ㄸ': 'ㄷㅌ', 'ㅃ': 'ㅂㅍ', 'ㅆ': 'ㅅㅈ', 'ㅉ': 'ㅈㅊ' };
// à l'oreille, ces lettres se confondent : jamais ensemble dans un même choix
const EAR = ['ㅐㅔ', 'ㅒㅖ', 'ㅙㅚㅞ'], FIN = ['ㄱㅋㄲ', 'ㄷㅌㅅㅆㅈㅊㅎ', 'ㅂㅍ'];
const clash = (a: string, b: string, groups: string[]) => groups.some((g) => g.includes(a) && g.includes(b));
const shuffle = <T>(a: T[], r: Rnd) => { const o = a.slice(); for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; } return o; };
function distract(target: string[], known: string, n: number, r: Rnd, tail = ''): string[] {
  const out: string[] = []; const ok = (j: string) => known.includes(j) && !target.includes(j) && !out.includes(j) && !target.some((t) => clash(t, j, EAR)) && !(tail && clash(tail, j, FIN)) && !'ㄲㄸㅃㅆㅉ'.split('').some((d) => target.includes(d) && SIM[d][0] === j && false);
  for (const t of shuffle(target, r)) for (const s of SIM[t] || '') if (out.length < n && ok(s)) out.push(s);
  const pool = shuffle([...known].filter((j) => target.some((t) => isVowel(t) === isVowel(j))), r); for (const j of pool) if (out.length < n && ok(j)) out.push(j);
  return out;
}
const sylJamo = (s: string) => { const [l, v, t] = split(s); const tt = ({ 'ㄳ': 'ㄱㅅ', 'ㄵ': 'ㄴㅈ', 'ㄶ': 'ㄴㅎ', 'ㄺ': 'ㄹㄱ', 'ㄻ': 'ㄹㅁ', 'ㄼ': 'ㄹㅂ', 'ㅄ': 'ㅂㅅ' } as Record<string, string>)[t] || t; return { l, v, t, all: [l, v, ...(tt ? [...tt] : [])] }; };
export const wordJamo = (w: string) => [...new Set([...w].filter(isSyl).flatMap((s) => sylJamo(s).all))];
function build(syl: string, known: string, nd: number, r: Rnd, extra: Partial<Step> = {}): Step { const j = sylJamo(syl); return { k: 'B', syl, tray: shuffle([...new Set(j.all), ...distract(j.all, known, nd, r, j.t)], r), ...extra }; }
function wordSteps(w: string, known: string, nd: number, r: Rnd): Step[] { const ss = [...w].filter(isSyl); return ss.map((s, i) => build(s, known, nd, r, { word: w, wi: i, last: i === ss.length - 1 })); }
function pickWords(w: string, pool: string[], n: number, r: Rnd, needPic: boolean) { const c = shuffle(pool.filter((x) => x !== w && (!needPic || WD[x].p) && (!needPic || WD[x].p !== WD[w].p)), r); c.sort((a, b) => Math.abs([...a].length - [...w].length) - Math.abs([...b].length - [...w].length)); return shuffle([w, ...c.slice(0, n)], r); }
/** étapes du niveau li du quartier di */
export function levelSteps(di: number, li: number, p: Prog, r: Rnd): { steps: Step[]; known: string } {
  const sg: Sign = DISTRICTS[di].signs[li], nw = [...(sg.n || '')], before = p.known, known = before + nw.filter((j) => !before.includes(j)).join(''), steps: Step[] = [], nd = di === 0 ? (li < 8 ? 1 : 2) : 2;
  const pool = p.seenW.filter((w) => wordJamo(w).every((j) => known.includes(j)));
  if (nw.length) { steps.push({ k: 'T', items: nw }); for (const t of shuffle(nw, r).slice(0, 3)) steps.push({ k: 'F', target: t, opts: shuffle([t, ...distract([t], known, Math.min(2, nw.length > 1 ? 2 : 1 + (before.length > 2 ? 1 : 0)), r)], r) }); }
  if (sg.t === 'i') { const olds = shuffle([...before], r).slice(0, 1); for (const t of olds) steps.push({ k: 'F', target: t, opts: shuffle([t, ...distract([t], known, 2, r)], r), rev: true }); }
  if (sg.t === 'b') { const ss = [...(sg.syl || '')]; const nB = nw.length >= 3 ? 2 : 3; const take = ss.length > nB ? [ss[0], ...shuffle(ss.slice(1), r).slice(0, nB - 1)] : ss; for (const s of take) steps.push(build(s, known, nd, r)); steps.push(...wordSteps(sg.w, known, nd, r)); if (steps.length < 8) for (const w of (sg.ws || '').split(' ').filter(Boolean).slice(0, 1)) steps.push(...wordSteps(w, known, nd, r)); }
  if (sg.t === 'w') steps.push(...wordSteps(sg.w, known, nd, r));
  if (sg.t === 'r') { steps.push({ k: 'R', word: sg.w, opts: pickWords(sg.w, pool, 3, r, true).map((w) => WD[w].p) }); const ss = [...sg.w].filter(isSyl); const hard = ss.find((s) => nw.some((j) => sylJamo(s).all.includes(j))) || ss.find((s) => sylJamo(s).t) || ss[0]; steps.push(build(hard, known, nd, r, { word: sg.w, wi: ss.indexOf(hard), last: true, rev: true })); }
  if (sg.t === 'l') { steps.push({ k: 'L', word: sg.w, opts: pickWords(sg.w, pool, 2, r, false) }); steps.push(...wordSteps(sg.w, known, nd, r)); }
  if (sg.t === 's') steps.push({ k: 'P', word: sg.w, opts: pickWords(sg.w, pool, di >= 5 ? 5 : 3, r, false) });
  // répétition espacée : ce qui a été raté revient, déguisé
  if (li >= 2 || di > 0) {
    const weakJ = [...before].filter((j) => !nw.includes(j)).sort((a, b) => (p.jam[a] ?? 2) - (p.jam[b] ?? 2) + (r() - 0.5) * 0.6)[0];
    const weakW = pool.filter((w) => w !== sg.w).sort((a, b) => (p.wrd[a] ?? 2) - (p.wrd[b] ?? 2) + (r() - 0.5) * 0.8)[0];
    if (weakW && di > 0 && (r() < 0.6 || !weakJ)) { const hasP = !!WD[weakW].p; steps.push(hasP && r() < 0.5 ? { k: 'R', word: weakW, opts: pickWords(weakW, pool, 3, r, true).map((w) => WD[w].p), rev: true } : hasP ? { k: 'P', word: weakW, opts: pickWords(weakW, pool, 3, r, false), rev: true } : { k: 'L', word: weakW, opts: pickWords(weakW, pool, 2, r, false), rev: true }); }
    else if (weakJ) steps.push((p.jam[weakJ] ?? 2) < 2 || r() < 0.5 ? { k: 'F', target: weakJ, opts: shuffle([weakJ, ...distract([weakJ], known, 2, r)], r), rev: true } : { k: 'F', target: weakJ, opts: shuffle([weakJ, ...distract([weakJ], known, 3, r)], r), rev: true });
  }
  return { steps, known };
}
/** jamo sollicités par une étape (pour le test « rien de jamais introduit ») */
export function stepJamo(s: Step): string[] {
  if (s.k === 'T') return s.items!; if (s.k === 'F') return [s.target!, ...s.opts!]; if (s.k === 'B') return [...sylJamo(s.syl!).all, ...s.tray!];
  if (s.k === 'R') return wordJamo(s.word!); return [...new Set([s.word!, ...s.opts!].flatMap(wordJamo))];
}
export function mark(p: Prog, kind: 'j' | 'w', id: string, ok: boolean) { const m = kind === 'j' ? p.jam : p.wrd; const v = m[id] ?? 2; m[id] = Math.max(0, Math.min(5, ok ? v + 1 : v - 2)); }
export function complete(p: Prog, di: number, li: number, known: string) { p.known = known; p.lit[di] = Math.max(p.lit[di], li + 1); const sg = DISTRICTS[di].signs[li]; for (const w of [sg.w, ...(sg.ws || '').split(' ').filter(Boolean)]) if (!p.seenW.includes(w)) p.seenW.push(w); }
export { jamos };
