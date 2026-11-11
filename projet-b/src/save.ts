import { freshProg, type Prog } from './course';
export interface Save { v: number; prog: Prog; di: number; secrets: string[]; daily: { date: string; streak: number; ok: number }; lowfx: boolean; blackout: number; arcade: number; ended: number; title: number; modes: number }
const KEY = 'pb.save', VER = 1; const fresh = (): Save => ({ v: VER, prog: freshProg(), di: 0, secrets: [], daily: { date: '', streak: 0, ok: 0 }, lowfx: false, blackout: 0, arcade: 0, ended: 0, title: 0, modes: 0 });
export let S: Save = fresh();
export function load() { try { const o = JSON.parse(localStorage.getItem(KEY) || 'null'); if (o && o.v === VER) S = { ...fresh(), ...o, prog: { ...freshProg(), ...o.prog } }; } catch { S = fresh(); } }
export function persist() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* */ } }
export const day = (off = 0) => { const d = new Date(Date.now() + off * 864e5); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
