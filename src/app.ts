import type { Sim, Card } from './sim';
import { Snd } from './audio';

export interface Part { x: number; y: number; vx: number; vy: number; l: number; m: number; col: string; s: number }
export interface Float { x: number; y: number; s: string; l: number; col: string; px: number }
export interface Btn { x: number; y: number; w: number; h: number; fn: () => void }
export interface Overlay { line: string; score: number; best: boolean; city: string; time: number; rou: number; won: boolean; daily: boolean; mods: Record<string, number>; t: number; cityNo: number; newAch: string[] }

export const A = {
  mode: 'dial' as 'dial' | 'atelier' | 'stats' | 'back' | 'desk' | 'credits',
  sim: null as Sim | null, daily: false, overlay: null as Overlay | null,
  pA: 0, boot: 0, titleT: 0, rew: null as null | { t: number; T: number; a: number; hT: number[]; hA: number[] },
  pickT: 0, lastCard: null as null | { c: Card; t: number }, cityFlash: 0, cityName: '', cityPrev: '', cityNameT: 0,
  parts: [] as Part[], floats: [] as Float[], shake: 0, flash: 0, flashCol: '#ffffff', btns: [] as Btn[],
  snd: new Snd(), toast: '', toastT: 0, trail: [] as number[], rot: 0, zoom: 1, taunt: '', tauntT: 0,
  ghostRec: [] as number[], ghostAcc: 0, idleTk: 0, recentDeaths: [] as number[], flipAnim: 0, flipTo: '' as '' | 'back' | 'dial',
  tele: new Set<string>(), credT: 0,
};
export function burst(x: number, y: number, n: number, col: string, sp = 160, s = 2.2) {
  for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, v = sp * (0.3 + Math.random()); A.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: 0.35 + Math.random() * 0.5, m: 0.85, col, s: s * (0.5 + Math.random()) }); }
  if (A.parts.length > 500) A.parts.splice(0, A.parts.length - 500);
}
export function toast(s: string) { A.toast = s; A.toastT = 2.6; }
