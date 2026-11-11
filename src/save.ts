import { DEFWATCH, Watch } from './watch';

export interface Save {
  v: number; deaths: number; runs: number; time: number; best: number; bestCity: number; rou: number;
  cityDeaths: Record<string, number>; ach: Record<string, number>; own: Record<string, number>; eq: Watch; engr: string;
  daily: { date: string; score: number; streak: number; best: number };
  ghost: number[]; won: number; backWon: number; backBest: number; mute: boolean; seenTitle: boolean; ended: boolean;
  kan: number; tak: number; grazes: number; perfects: number; bought: number; recent: number[]; firstCity: number;
}
const KEY = 'px.save', VER = 1;
const fresh = (): Save => ({
  v: VER, deaths: 0, runs: 0, time: 0, best: 0, bestCity: 0, rou: 0, cityDeaths: {}, ach: {},
  own: { acier: 1, lisse: 1, noir: 1, baton: 1, manuel: 1, cuir: 1, plein: 1 }, eq: { ...DEFWATCH }, engr: '',
  daily: { date: '', score: 0, streak: 0, best: 0 }, ghost: [], won: 0, backWon: 0, backBest: 0, mute: false, seenTitle: false, ended: false,
  kan: 0, tak: 0, grazes: 0, perfects: 0, bought: 0, recent: [], firstCity: 0,
});
export let S: Save = fresh();
export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const o = JSON.parse(raw); if (o && o.v === VER) { const f = fresh(); S = { ...f, ...o, eq: { ...f.eq, ...o.eq }, own: { ...f.own, ...o.own }, daily: { ...f.daily, ...o.daily } }; } }
  } catch { S = fresh(); }
}
export function persist() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* */ } }
export const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
export const yesterday = () => { const d = new Date(Date.now() - 864e5); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
