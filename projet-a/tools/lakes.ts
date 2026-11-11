import { readFileSync } from 'node:fs';
import { Course } from '../src/world';
const dir = new URL('../src/data/', import.meta.url).pathname;
const ser = JSON.parse(readFileSync(dir + 'm.json', 'utf8')); const hs = JSON.parse(readFileSync(dir + 'holes.json', 'utf8'));
const c = new Course('m', ser, [], hs.flat, hs.pars, true);
const d = (x: number) => new Date(c.ptAt(x).day * 864e5).toISOString().slice(0, 10);
console.log(c.lakes.map((l) => d(l[0]) + ' w' + (l[1] - l[0])).join('\n'));
const yr: Record<string, number[]> = {}; for (const p of c.pts) { const y = new Date(p.day * 864e5).toISOString().slice(0, 4); (yr[y] ||= [0, 0, 0, 0, 0, 0, 0])[p.s]++; }
console.log(Object.entries(yr).map(([y, a]) => y + ' ' + a.join(' ')).join('\n'));
