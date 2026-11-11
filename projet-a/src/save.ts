import type { Extra } from './world';
export interface Save {
  v: number; cur: string; pos: Record<string, { x: number; n: number }>; total: number; rel: number; holes: number;
  hio: string[]; found: string[]; ach: Record<string, number>; balls: string[]; ball: string; courses: string[];
  clean: number; bestClean: number; pars: Record<string, number>; ext: number[]; hr: Extra[]; hourlyFrom: number;
  streak: number; lastPlay: string; tracks: Record<string, number[]>; title: number; ended: number; wet: number;
}
const KEY = 'pa.save', VER = 1;
const fresh = (): Save => ({ v: VER, cur: 'm', pos: {}, total: 0, rel: 0, holes: 0, hio: [], found: [], ach: {}, balls: ['w'], ball: 'w', courses: ['m'], clean: 0, bestClean: 0, pars: {}, ext: [], hr: [], hourlyFrom: 0, streak: 0, lastPlay: '', tracks: {}, title: 0, ended: 0, wet: 0 });
export let S: Save = fresh();
export function load() { try { const o = JSON.parse(localStorage.getItem(KEY) || 'null'); if (o && o.v === VER) S = { ...fresh(), ...o }; } catch { S = fresh(); } }
let pend = 0;
export function persist(now = false) { const w = () => { pend = 0; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* plein */ } }; if (now) { clearTimeout(pend); w(); } else if (!pend) pend = window.setTimeout(w, 400); }
export const localDay = (off = 0) => { const d = new Date(Date.now() + off * 864e5); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
