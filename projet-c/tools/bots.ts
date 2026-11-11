// Bots : aléatoire, glouton, à recherche. Mesure la durée des parties par cuisine.
import { newGame, move, send, canMove, sendable, type State } from '../src/logic';
import { KITCHENS } from '../src/data/recipes';
const clone = (s: State): State => { const p = s.prev; s.prev = null; const c = JSON.parse(JSON.stringify(s)); s.prev = p; return c; };
function sendAll(s: State, greedy: boolean) { let did = true; while (did && !s.over) { did = false; for (let i = 0; i < s.cells.length; i++) { const t = s.cells[i]; if (t && t.k === 'dish' && sendable(s, i) >= 0 && (greedy || t.q >= 1)) { send(s, i); did = true; } } } }
function evalS(s: State) { let e = 0, v = s.score * 3; for (const c of s.cells) { if (!c) e++; else if (c.k === 'prep') v += 6; else if (c.k === 'dish') v += 14 * c.q; else if (c.k === 'dirty') v -= 8; else if (c.cook) v += Math.min(2, c.cook) * 5 - (c.cook > 5 ? 20 : 0); } return v + e * 9 - (s.over ? 500 : 0); }
function search(s: State, depth: number): number { if (depth === 0 || s.over) return evalS(s); let best = -1e9; for (let d = 0; d < 4; d++) { if (!canMove(s, d)) continue; const c = clone(s); move(c, d); sendAll(c, true); best = Math.max(best, search(c, depth - 1)); } return best === -1e9 ? evalS(s) : best; }
export function play(kit: string, seed: number, bot: 'rand' | 'greedy' | 'search', mode: '' | 'tablee' = '') {
  const s = newGame({ kit, seed, mode }); let rs = seed * 7 + 3; const r = () => { rs = (rs * 1103515245 + 12345) & 0x7fffffff; return rs / 0x7fffffff; }; let s2 = s;
  while (!s2.over && s2.moves < 3000) {
    if (bot !== 'rand') sendAll(s2, true); else if (r() < 0.25) sendAll(s2, true); if (s2.over) break;
    const ds = [0, 1, 2, 3].filter((d) => canMove(s2, d)); if (!ds.length) { sendAll(s2, true); if (![0, 1, 2, 3].some((d) => canMove(s2, d))) break; continue; }
    let d = ds[Math.floor(r() * ds.length)];
    if (bot !== 'rand') { let best = -1e9; for (const x of ds) { const c = clone(s2); move(c, x); sendAll(c, true); const v = bot === 'search' ? search(c, 2) : evalS(c); if (v > best) { best = v; d = x; } } }
    move(s2, d);
  }
  return s2;
}
const med = (a: number[]) => a.slice().sort((x, y) => x - y)[a.length >> 1];
if (process.argv[1]?.includes('bots')) {
  const N = +(process.argv[2] || 30);
  for (const k of KITCHENS) for (const bot of ['rand', 'greedy', 'search'] as const) {
    const n = bot === 'search' ? Math.ceil(N / 4) : N; const rs = Array.from({ length: n }, (_, i) => play(k.id, 100 + i * 31, bot));
    console.log(k.id.padEnd(8), bot.padEnd(7), 'coups médians', String(med(rs.map((x) => x.moves))).padStart(4), 'min', Math.min(...rs.map((x) => x.moves)), 'score médian', med(rs.map((x) => x.score)), 'servis', med(rs.map((x) => x.served)), 'menus', med(rs.map((x) => x.menus)), 'expirés', med(rs.map((x) => x.expired)), 'palier', Math.round(100 * rs.filter((x) => x.score >= k.goal).length / n) + '%');
  }
  const t = Array.from({ length: 6 }, (_, i) => play('home', 5 + i, 'greedy', 'tablee')); console.log('tablée glouton', t.map((x) => x.moves + (x.won ? '✓' : '')).join(' '));
}
