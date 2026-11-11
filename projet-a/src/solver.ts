// Bot solveur : glouton avec affinage. Sert au par, à la validation, et aux trous nés après la compilation.
import { TU } from './tuning';
import { simulate } from './physics';
import type { Course } from './world';
export function solve(c: Course, hi: number, max = 9, coarse = false, noise = 0, seed = 1) {
  let rs = seed * 9301 + hi * 49297; const rnd = () => { rs = (rs * 1103515245 + 12345) & 0x7fffffff; return rs / 0x7fffffff - 0.5; };
  const h = c.holes[hi]; c.openCup(hi);
  let x = h.tee, y = c.gy(x) + TU.R, strokes = 0, stuck = 0;
  const angs: number[] = [], pows: number[] = [];
  for (let a = 12; a <= 84; a += coarse ? 8 : 4) angs.push(a); for (let p = 0.16; p <= 1.001; p += coarse ? 0.09 : 0.05) pows.push(p);
  while (strokes < max) {
    let best = { d: Math.abs(h.cup - x) + 0.01, r: 'rest', x, y, a: 0, p: 0 }, found = false;
    const tryShot = (a: number, p: number) => {
      const ar = (a * Math.PI) / 180, v = p * TU.VMAX, s = simulate(c, h, x, y, Math.cos(ar) * v, Math.sin(ar) * v);
      const d = s.r === 'in' ? -1 : s.r === 'rest' ? Math.abs(h.cup - s.x) + Math.max(0, h.cy - s.y) * 0.35 : 1e9;
      if (d < best.d) { best = { d, r: s.r, x: s.x, y: s.y, a, p }; found = true; }
    };
    const dir = h.cup > x ? 0 : 1;
    for (const a of angs) for (const p of pows) tryShot(dir ? 180 - a : a, p);
    if (best.r !== 'in' && found) for (const da of [-2, -1, 1, 2]) for (const dp of [-0.025, 0, 0.025]) tryShot(best.a + da, Math.min(1, best.p + dp));
    if (!found) { for (const a of angs) for (const p of pows) tryShot(dir ? a : 180 - a, p); }
    strokes++;
    if (!found) { if (++stuck > 1) return { ok: false, strokes: 99 }; continue; }
    if (noise > 0) { // main humaine : on rejoue le coup choisi avec une erreur
      const far = Math.min(1, Math.abs(h.cup - x) / 120), ar = ((best.a + rnd() * 2 * noise * 3 * (0.4 + 0.6 * far)) * Math.PI) / 180, v = Math.min(1, best.p * (1 + rnd() * 2 * noise * 0.07 * (0.4 + 0.6 * far))) * TU.VMAX;
      const s = simulate(c, h, x, y, Math.cos(ar) * v, Math.sin(ar) * v); if (s.r === 'in') return { ok: true, strokes }; if (s.r === 'rest') { x = s.x; y = s.y; } else strokes++; continue;
    }
    if (best.r === 'in') return { ok: true, strokes };
    x = best.x; y = best.y;
  }
  return { ok: false, strokes: 99 };
}
export const parOf = (strokes: number, len: number) => Math.max(2, Math.min(7, strokes + 1 + (len > 290 ? 1 : 0)));
// par « humain » : moyenne de quelques parties jouées avec une main imprécise
export function humanPar(c: Course, hi: number, rounds = 5, coarse = false) { let t = 0; for (let k = 0; k < rounds; k++) { const r = solve(c, hi, 9, coarse, 1, k + 1); t += r.ok ? r.strokes : 8; } return Math.max(2, Math.min(7, Math.round(t / rounds + 0.15))); }
