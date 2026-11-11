import type { State } from './logic';
export interface Save { v: number; best: Record<string, number>; kit: string; carnet: Record<string, number>; reg: Record<string, number>; perk: string; daily: { date: string; score: number; streak: number; best: number }; cur: State | null; hint: number; title: number; services: number; total: number; tablee: number; chezbob: number; mute: boolean }
const KEY = 'pc.save', VER = 1;
const fresh = (): Save => ({ v: VER, best: {}, kit: 'home', carnet: {}, reg: {}, perk: '', daily: { date: '', score: 0, streak: 0, best: 0 }, cur: null, hint: 0, title: 0, services: 0, total: 0, tablee: 0, chezbob: 0, mute: false });
export let S: Save = fresh();
export function load() { try { const o = JSON.parse(localStorage.getItem(KEY) || 'null'); if (o && o.v === VER) S = { ...fresh(), ...o, daily: { ...fresh().daily, ...o.daily } }; } catch { S = fresh(); } }
export function persist() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* */ } }
export const day = (off = 0) => { const d = new Date(Date.now() + off * 864e5); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
