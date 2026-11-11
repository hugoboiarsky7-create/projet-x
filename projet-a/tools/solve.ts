// Valide tous les trous (faisable, pas pénible), ajuste le lissage si besoin, calcule les pars.
import { readFileSync, writeFileSync } from 'node:fs';
import { Course, type Flat } from '../src/world';
import { solve, humanPar } from '../src/solver';
const dir = new URL('../src/data/', import.meta.url).pathname;
const flat: Flat = {}; const pars: Record<string, number> = {}; const t0 = Date.now();
for (const id of ['m', 'e', 'd', 'x']) {
  const ser = JSON.parse(readFileSync(dir + id + '.json', 'utf8'));
  let c = new Course(id, ser, [], flat, {}, id === 'm'); const N = c.holes.length; let retouch = 0, fail = 0; const dist: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const surf = [0, 0, 0, 0, 0, 0, 0]; for (const p of c.pts) surf[p.s]++;
  for (let i = 0; i < N; i++) {
    let r = solve(c, i), f = 1; const key = id + Math.round(c.holes[i].day * 100) / 100;
    while ((!r.ok || r.strokes > 5) && f > 0.2) { f = +(f - 0.15).toFixed(2); flat[key] = f; c = new Course(id, ser, [], flat, {}, id === 'm'); r = solve(c, i); }
    if (f < 1) retouch++; if (!r.ok) { fail++; console.log('  ÉCHEC', id, i, key); }
    pars[key] = humanPar(c, i, 3); dist[pars[key]]++;
  }
  console.log(id, N, 'trous', 'retouchés', retouch, 'échecs', fail, 'pars', dist.join(' '), 'surfaces', surf.join(' '), 'lacs', c.lakes.length);
}
writeFileSync(dir + 'holes.json', JSON.stringify({ flat, pars }));
console.log(((Date.now() - t0) / 1000).toFixed(1) + 's');
