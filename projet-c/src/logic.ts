// Logique pure, déterministe à graine. Aucune dépendance au rendu.
import { RECIPES, REC, KIT, PASTA, type Recipe } from './data/recipes';
export type Kind = 'ing' | 'prep' | 'dish' | 'dirty' | 'ice' | 'joker' | 'pot' | 'chili' | 'side' | 'flav' | 'steak' | 'bolo';
export interface Tile { id: number; k: Kind; a: string; q: number; miss?: string; cook?: number; hot?: boolean; age?: number; thaw?: number; fz?: boolean; fish?: boolean }
export interface Order { table: number; rec: string; left: number; max: number; course: number; menu: boolean; want: '' | 'hot' | 'mild'; who: string; paid: number; ok: boolean; lev: boolean; quip: number }
export interface Perks { patience?: boolean; shot?: boolean; joker?: boolean; peek?: boolean }
export interface Opts { kit: string; seed: number; n?: number; mode?: '' | 'daily' | 'tablee'; perks?: Perks; regulars?: string[] }
export interface Ev { t: string; [k: string]: unknown }
export interface Line { rec: string; stars: number; price: number; tip: number; note: string }
export interface State {
  o: Opts; n: number; cells: (Tile | null)[]; next: Tile; next2: Tile; orders: (Order | null)[]; wait: number[]; queue: Tile[]; score: number; moves: number; shots: number; over: boolean;
  rs: number; uid: number; tables: number; served: number; menus: number; pool: string[]; lines: Line[]; prev: string | null; last: string; omak: { rec: string; stars: number }[]; insp: string[]; left: number; won: boolean; expired: number;
}
export const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]]; // droite, gauche, bas, haut
export const FLAVS = ['sucre2', 'nampla', 'lime', 'piment'];
const rnd = (s: State) => { s.rs = (s.rs + 0x6d2b79f5) | 0; let t = Math.imul(s.rs ^ (s.rs >>> 15), 1 | s.rs); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const pick = <T>(s: State, a: T[]) => a[Math.floor(rnd(s) * a.length)];
const mk = (s: State, k: Kind, a: string, q = 1, o: Partial<Tile> = {}): Tile => ({ id: ++s.uid, k, a, q, ...o });
const pairKey = (a: string, b: string) => (a < b ? a + '+' + b : b + '+' + a);
// table des paires par cuisine : (A,B) → recette ; (recette prép., C) → secret
const PAIRS: Record<string, Record<string, string>> = {}; const TRI: Record<string, string> = {};
for (const r of RECIPES) { if (r.ing[2] === '-') continue; const key = [...r.ing].sort().join('+'); TRI[key] = r.id; if (r.secret) continue; const m = (PAIRS[r.kit] ||= {}); for (const [a, b] of [[0, 1], [0, 2], [1, 2]]) m[pairKey(r.ing[a], r.ing[b])] = r.id; }
export const recipesOf = (kit: string) => RECIPES.filter((r) => r.kit === kit && !r.secret);
export function pairRecipe(s: State, a: string, b: string): string | null {
  const key = pairKey(a, b);
  if (s.o.kit === 'omakase') { for (const id of s.insp) { const r = REC[id]; if (r.ing.includes(a) && r.ing.includes(b)) return id; } for (const k in PAIRS) if (PAIRS[k][key]) return PAIRS[k][key]; return null; }
  return PAIRS[s.o.kit]?.[key] ?? null;
}
const isFish = (s: State, a: string) => !!KIT[s.o.kit].fish?.includes(a);
// fusion : T (qui bouge) contre U (bloquée). Renvoie la tuile résultante, ou null.
export function merge(s: State, T: Tile, U: Tile): Tile | null {
  const hot = !!(T.hot || U.hot);
  if (T.k === 'ing' && U.k === 'ing') {
    if (T.a === U.a) return T.q === 1 && U.q === 1 && !rawPasta(s, T) && !rawPasta(s, U) ? mk(s, 'ing', T.a, 2, { hot, cook: T.cook, age: Math.max(T.age || 0, U.age || 0), fish: T.fish }) : null;
    if (T.q !== U.q || rawPasta(s, T) || rawPasta(s, U)) return null; const r = pairRecipe(s, T.a, U.a); if (!r) return null;
    return mk(s, 'prep', r, T.q, { miss: REC[r].ing.find((x) => x !== T.a && x !== U.a), hot, fish: T.fish || U.fish, age: Math.max(T.age || 0, U.age || 0) });
  }
  const [P, I] = T.k === 'prep' ? [T, U] : [U, T];
  if (P.k === 'prep' && I.k === 'ing' && P.q === I.q && !rawPasta(s, I)) {
    if (I.a === P.miss) return mk(s, 'dish', P.a, P.q, { hot, fish: P.fish || I.fish || REC[P.a].fish, age: 0 });
    const have = REC[P.a].ing.filter((x) => x !== P.miss), sec = TRI[[...have, I.a].sort().join('+')]; if (sec && REC[sec].secret) return mk(s, 'dish', sec, P.q, { hot, fish: REC[sec].fish, age: 0 });
    return null;
  }
  if (P.k === 'prep' && I.k === 'joker') return mk(s, 'dish', P.a, P.q, { hot, fish: REC[P.a].fish, age: 0 });
  if (T.k === 'dish' && U.k === 'dish') return T.a === U.a && T.q === U.q && T.q < 3 ? mk(s, 'dish', T.a, T.q + 1, { hot, fish: T.fish, age: 0, fz: T.fz && U.fz }) : null;
  if (T.k === 'steak' && U.k === 'steak') return mk(s, 'bolo', 'bolo');
  const [B, X] = T.k === 'bolo' ? [T, U] : [U, T];
  if (B.k === 'bolo') { if (X.k === 'ing' && PASTA.includes(X.a) && !rawPasta(s, X)) return mk(s, 'dish', 'lasagnes', 1); if (X.k === 'chili') return mk(s, 'dish', 'chili', 1, { hot: true }); return null; }
  if (T.k === 'joker' && U.k === 'joker') return mk(s, 'dish', 'cafe', 1);
  if (T.k === 'side' && U.k === 'side') return T.q === U.q && T.q < 3 ? mk(s, 'side', 'kimchi', T.q + 1) : null;
  if (T.k === 'flav' && U.k === 'flav') return T.a === U.a ? mk(s, 'flav', T.a, 1) : null;
  return null;
}
const rawPasta = (s: State, t: Tile) => KIT[s.o.kit].rule === 'pot' && PASTA.includes(t.a) && (t.cook || 0) < 2;
const empty = (s: State) => { const e: number[] = []; s.cells.forEach((c, i) => { if (!c) e.push(i); }); return e; };
const nb = (s: State, i: number) => { const n = s.n, x = i % n, y = (i / n) | 0, o: number[] = []; if (x > 0) o.push(i - 1); if (x < n - 1) o.push(i + 1); if (y > 0) o.push(i - n); if (y < n - 1) o.push(i + n); return o; };
export const sinkCell = (s: State) => s.n * s.n - 1;
function patience(s: State, r: Recipe) { return Math.round((s.o.mode === 'tablee' ? 70 : Math.max(18, 34 + Math.min(10, s.tables) - Math.max(0, s.tables - 16) * 0.5)) * (s.o.perks?.patience ? 1.25 : 1) + (r.price > 20 ? 6 : 0)); }
function newOrder(s: State, slot: number, table = 0, course = -1) {
  const pool = s.pool.map((id) => REC[id]); const have = (c: string) => pool.filter((r) => r.course === c);
  let menu = false, rec: Recipe;
  if (s.o.mode === 'tablee') { const c = ['E', 'P', 'D'][Math.min(2, Math.floor((24 - s.left) / 8))]; rec = pick(s, have(c).length ? have(c) : pool); course = 'EPD'.indexOf(rec.course); s.left--; table = 8; }
  else if (table) { rec = pick(s, have(['E', 'P', 'D'][course])); menu = true; }
  else {
    table = ++s.tables; menu = s.tables > 4 && have('E').length > 0 && have('P').length > 0 && have('D').length > 0 && rnd(s) < 0.5;
    const active = s.orders.filter(Boolean).map((o) => o!.rec); let cand = menu ? have('E') : pool; const fresh = cand.filter((r) => !active.includes(r.id)); if (fresh.length) cand = fresh;
    rec = s.tables === 1 ? REC[s.pool[0]] : pick(s, cand); course = menu ? 0 : 'EPD'.indexOf(rec.course);
  }
  const p = patience(s, rec), want = KIT[s.o.kit].rule === 'chili' && s.moves > 4 ? (['', 'hot', 'mild'] as const)[Math.floor(rnd(s) * 3)] : '';
  const who = !menu && s.o.regulars?.length && s.tables > 2 && rnd(s) < 0.22 ? pick(s, s.o.regulars) : '';
  const lev = who === 'trader', pp = lev ? Math.round(p * 1.6) : p; s.orders[slot] = { table, rec: rec.id, left: pp, max: pp, course, menu, want, who, paid: 0, ok: true, lev, quip: Math.floor(rnd(s) * 100) };
}
function growPool(s: State) { const all = recipesOf(s.o.kit).map((r) => r.id); const target = Math.min(all.length, s.o.mode === 'tablee' ? all.length : 2 + Math.floor(s.served / 2)); while (s.pool.length < target) s.pool.push(all[s.pool.length]); }
function draw(s: State): Tile {
  if (s.queue.length) return s.queue.shift()!;
  const rule = KIT[s.o.kit].rule, cnt = (f: (t: Tile) => boolean) => s.cells.filter((c) => c && f(c)).length, full = cnt(() => true);
  if (rule === 'chili' && s.moves > 6 && !cnt((t) => t.k === 'chili') && s.next?.k !== 'chili' && rnd(s) < 0.5) return mk(s, 'chili', 'chili');
  if (rule === 'side' && s.moves > 8 && rnd(s) < 0.13 && cnt((t) => t.k === 'side') < 3) return mk(s, 'side', 'kimchi', 1);
  if (rule === 'flav' && s.moves > 5 && rnd(s) < 0.2 && cnt((t) => t.k === 'flav') < 4) return mk(s, 'flav', pick(s, FLAVS));
  if (full >= s.n * s.n - 5 && rnd(s) < 0.12 && !cnt((t) => t.k === 'ice') && rule !== 'omakase') return mk(s, 'ice', 'ice', 1, { thaw: 0 });
  if (['', 'pot', 'chili'].includes(rule) && s.moves > 18 && rnd(s) < (cnt((t) => t.k === 'steak') === 1 ? 0.16 : 0.035)) return mk(s, 'steak', 'steak');
  // coup de pouce : plan de travail chargé en début de service → une tuile qui fusionne à coup sûr
  if (rule !== 'omakase' && full >= s.n * s.n - 4 && (s.moves < 22 || rnd(s) < 0.25)) { const pr = s.cells.find((c) => c && c.k === 'prep' && c.q === 1); if (pr) return mk(s, 'ing', pr.miss!, 1, { fish: isFish(s, pr.miss!), age: 0, cook: rule === 'pot' && PASTA.includes(pr.miss!) ? 2 : 0 }); }
  // sac biaisé vers ce que demandent les bons
  const w: Record<string, number> = {}; const recs = rule === 'omakase' ? s.insp : s.orders.filter(Boolean).map((o) => o!.rec);
  for (const id of recs) {
    const r = REC[id]; if (r.uni) continue; const dish = cnt((t) => t.k === 'dish' && t.a === id), prep = s.cells.find((c) => c && c.k === 'prep' && c.a === id);
    for (const ing of r.ing) { const on = cnt((t) => t.k === 'ing' && t.a === ing); let need = dish ? 0.5 : prep ? (prep.miss === ing ? (on ? 0.6 : 7) : 0.4) : on ? 0.9 : 4; w[ing] = (w[ing] || 0) + need; }
  }
  if (s.moves >= 20) for (const id of s.pool) for (const ing of REC[id].ing) w[ing] = (w[ing] || 0) + 0.22 + Math.min(0.5, s.tables * 0.012);
  if (s.next?.k === 'ing') w[s.next.a] = (w[s.next.a] || 0) * 0.35;
  const ks = Object.keys(w); let tot = 0; for (const k of ks) tot += w[k]; let x = rnd(s) * tot;
  for (const k of ks) { x -= w[k]; if (x <= 0) return mk(s, 'ing', k, 1, { fish: isFish(s, k), age: 0 }); }
  return mk(s, 'ing', ks[0], 1);
}
export function newGame(o: Opts): State {
  const n = o.n || (o.mode === 'tablee' ? 5 : 4);
  const s: State = { o, n, cells: Array(n * n).fill(null), next: null as unknown as Tile, next2: null as unknown as Tile, orders: o.mode === 'tablee' ? [null, null, null, null] : [null, null, null], wait: [0, 0, 0, 0], queue: [], score: 0, moves: 0, shots: 3 + (o.perks?.shot ? 1 : 0), over: false, rs: o.seed | 0, uid: 0, tables: 0, served: 0, menus: 0, pool: [], lines: [], prev: null, last: '', omak: [], insp: [], left: 24, won: false, expired: 0 };
  const rule = KIT[o.kit].rule;
  if (rule === 'omakase') { const all = RECIPES.filter((r) => !r.secret); s.pool = []; while (s.insp.length < 3) { const r = pick(s, all).id; if (!s.insp.includes(r)) s.insp.push(r); } }
  else { growPool(s); newOrder(s, 0); if (o.mode === 'tablee') for (let i = 1; i < 4; i++) newOrder(s, i); else { s.wait[1] = 4; s.wait[2] = 14; } }
  const first = rule === 'omakase' ? REC[s.insp[0]] : REC[s.orders[0]!.rec]; const e = empty(s); const spots: number[] = [];
  while (spots.length < 3) { const c = pick(s, e); if (!spots.includes(c) && c !== sinkCell(s)) spots.push(c); }
  s.cells[spots[0]] = mk(s, 'ing', first.ing[0]); s.cells[spots[1]] = mk(s, 'ing', first.ing[1]); s.cells[spots[2]] = mk(s, 'ing', first.ing[2] === '-' ? first.ing[0] : first.ing[2]);
  if (rule === 'pot') { let c = pick(s, empty(s)); if (c === sinkCell(s)) c = empty(s)[0]; s.cells[c] = mk(s, 'pot', 'pot'); }
  if (o.perks?.joker) s.queue.push(mk(s, 'joker', 'joker'));
  s.next = draw(s); s.next2 = draw(s); return s;
}
// peut-on glisser dans cette direction ?
export function canMove(s: State, d: number): boolean {
  const n = s.n, [dx, dy] = DIRS[d]; if (!s.cells.some(Boolean)) return true;
  for (let i = 0; i < n * n; i++) { const t = s.cells[i]; if (!t) continue; const x = (i % n) + dx, y = ((i / n) | 0) + dy; if (x < 0 || y < 0 || x >= n || y >= n) continue; const u = s.cells[y * n + x]; if (!u) return true; const keep = s.uid; const m = merge(s, t, u); s.uid = keep; if (m) return true; }
  return false;
}
export const sendable = (s: State, i: number) => { const t = s.cells[i]; if (!t || t.k !== 'dish') return -1; return orderFor(s, i); };
function flavAround(s: State, i: number) { const set = new Set<string>(); for (const j of nb(s, i)) { const c = s.cells[j]; if (c && c.k === 'flav') set.add(c.a); } return set.size; }
function orderFor(s: State, i: number): number {
  const t = s.cells[i]!, rule = KIT[s.o.kit].rule; if (rule === 'omakase') return s.omak.length < 7 ? 0 : -1;
  let best = -1; const slots = rule === 'fresh' ? [firstOrder(s)] : s.orders.map((_, k) => k);
  for (const k of slots) { const o = s.orders[k]; if (!o) continue; if (o.rec !== t.a && !REC[t.a].uni) continue; if (o.want === 'mild' && t.hot) continue; if (o.lev && t.q < 2) continue; if (best < 0 || o.left < s.orders[best]!.left || (o.rec === t.a && s.orders[best]!.rec !== t.a)) best = k; }
  return best;
}
export function firstOrder(s: State) { let b = -1; s.orders.forEach((o, k) => { if (o && (b < 0 || o.table < s.orders[b]!.table)) b = k; }); return b; }
const snap = (s: State) => { const p = s.prev; s.prev = null; const j = JSON.stringify(s); s.prev = p; return j; };
export function over(s: State) { if ([0, 1, 2, 3].some((d) => canMove(s, d))) return false; for (let i = 0; i < s.cells.length; i++) if (sendable(s, i) >= 0) return false; return true; }
export function move(s: State, d: number): Ev[] {
  const ev: Ev[] = []; if (s.over || !canMove(s, d)) return ev; const before = snap(s);
  const n = s.n, [dx, dy] = DIRS[d], lines = new Set<number>(); const order: number[] = [];
  for (let k = 0; k < n; k++) for (let l = 0; l < n; l++) { const a = dx ? (dx > 0 ? n - 1 - k : k) : l, b = dy ? (dy > 0 ? n - 1 - k : k) : l; order.push(b * n + a); }
  for (const i of order) {
    const t = s.cells[i]; if (!t) continue; const x = (i % n) + dx, y = ((i / n) | 0) + dy; if (x < 0 || y < 0 || x >= n || y >= n) continue; const j = y * n + x, u = s.cells[j];
    if (!u) { s.cells[j] = t; s.cells[i] = null; ev.push({ t: 'slide', id: t.id, to: j }); lines.add(dx ? y : x); }
    else { const m = merge(s, t, u); if (m) { s.cells[j] = m; s.cells[i] = null; ev.push({ t: 'merge', a: t.id, b: u.id, to: j, res: m.id, kind: m.k }); lines.add(dx ? y : x); } }
  }
  // la tuile du panier entre par le bord opposé
  const ls = lines.size ? [...lines] : Array.from({ length: n }, (_, i) => i); const l = ls[Math.floor(rnd(s) * ls.length)]; const cell = dx ? l * n + (dx > 0 ? 0 : n - 1) : (dy > 0 ? 0 : n - 1) * n + l;
  if (!s.cells[cell]) { s.cells[cell] = s.next; ev.push({ t: 'spawn', id: s.next.id, cell, from: d }); s.next = s.next2; s.next2 = draw(s); }
  s.moves++; tick(s, ev); s.prev = before; s.last = 'move'; if (over(s)) { s.over = true; ev.push({ t: 'over' }); } return ev;
}
function tick(s: State, ev: Ev[]) {
  const rule = KIT[s.o.kit].rule, sk = sinkCell(s);
  // évier
  const st = s.cells[sk]; if (st && st.k === 'dirty') { s.cells[sk] = null; ev.push({ t: 'sink', id: st.id }); }
  for (let i = 0; i < s.cells.length; i++) {
    const t = s.cells[i]; if (!t) continue; const around = nb(s, i).map((j) => s.cells[j]).filter(Boolean) as Tile[];
    if (rule === 'pot' && t.k === 'ing' && PASTA.includes(t.a) && around.some((u) => u.k === 'pot')) { t.cook = (t.cook || 0) + 1; if (t.cook === 2) ev.push({ t: 'cooked', id: t.id }); if (t.cook >= 8) { s.cells[i] = mk(s, 'dirty', 'mush'); ev.push({ t: 'spoil', id: t.id, res: s.cells[i]!.id }); } }
    if (t.k === 'chili') for (const u of around) if (!u.hot && (u.k === 'ing' || u.k === 'prep' || u.k === 'dish')) { u.hot = true; ev.push({ t: 'hot', id: u.id }); }
    if (t.k === 'ice' && around.length) { t.thaw = (t.thaw || 0) + 1; if (t.thaw >= 2) { const os = s.orders.filter(Boolean) as Order[]; if (os.length) { const o = os.reduce((a, b) => (a.left < b.left ? a : b)); s.cells[i] = mk(s, 'dish', o.rec, 1, { fz: true }); ev.push({ t: 'thaw', id: t.id, res: s.cells[i]!.id }); } } }
    if (rule === 'fresh' && t.fish) { t.age = (t.age || 0) + 1; if (t.k === 'dish') { if (t.age % 10 === 0) { t.q--; ev.push({ t: 'stale', id: t.id }); if (t.q <= 0) { s.cells[i] = mk(s, 'dirty', 'bones'); ev.push({ t: 'spoil', id: t.id, res: s.cells[i]!.id }); } } } else if (t.age >= 16) { s.cells[i] = mk(s, 'dirty', 'bones'); ev.push({ t: 'spoil', id: t.id, res: s.cells[i]!.id }); } }
  }
  if (rule === 'omakase') return;
  s.orders.forEach((o, k) => {
    if (!o) { if (s.o.mode === 'tablee') { if (s.left > 0) { newOrder(s, k); ev.push({ t: 'order', slot: k }); } } else if (--s.wait[k] <= 0) { newOrder(s, k); ev.push({ t: 'order', slot: k }); } return; }
    if (rule === 'fresh' && k !== firstOrder(s)) return; // au comptoir, un client à la fois
    if (--o.left <= 0) { s.orders[k] = null; s.wait[k] = 3; s.expired++; s.queue.push(mk(s, 'dirty', 'plate')); ev.push({ t: 'expire', slot: k, table: o.table }); }
  });
}
// envoyer un plat : gratuit, ne consomme pas de coup
export function send(s: State, i: number): Ev[] {
  const ev: Ev[] = []; const k = sendable(s, i); if (k < 0 || s.over) return ev; const before = snap(s); const t = s.cells[i]!, r = REC[t.a], rule = KIT[s.o.kit].rule; s.cells[i] = null;
  const mult = [1, 3, 8][t.q - 1]; let price = r.price * mult, tip = 0, note = '';
  if (rule === 'omakase') { s.omak.push({ rec: t.a, stars: t.q }); s.score += price; s.lines.push({ rec: t.a, stars: t.q, price, tip: 0, note: '' }); ev.push({ t: 'send', id: t.id, slot: s.omak.length - 1, gain: price }); if (s.omak.length >= 7) { finishOmakase(s); s.over = true; s.won = true; ev.push({ t: 'over' }); } else { let x = pick(s, RECIPES.filter((q) => !q.secret)).id; s.insp[(s.omak.length) % 3] = x; } s.prev = before; s.last = 'send'; return ev; }
  const o = s.orders[k]!; tip = t.fz ? 0 : Math.round(r.price * 0.6 * (o.left / o.max));
  if (rule === 'side') { let m = 0; for (const j of nb(s, i)) { const c = s.cells[j]; if (c && c.k === 'side') { m += c.q; s.cells[j] = null; ev.push({ t: 'eat', id: c.id }); } } if (m) { tip = Math.round((tip + r.price * 0.4) * (1 + m)); note = 'banchan'; } }
  if (rule === 'flav') { const f = flavAround(s, i); for (const j of nb(s, i)) { const c = s.cells[j]; if (c && c.k === 'flav') { s.cells[j] = null; ev.push({ t: 'eat', id: c.id }); } } if (f === 0) { price = Math.round(price * 0.5); tip = 0; note = 'fade'; } else { tip = Math.round(tip + r.price * 0.4 * f * mult); if (f === 4) { tip *= 2; note = 'équilibre'; } } }
  if (o.want === 'hot' && t.hot) { tip += r.price; note = 'pimenté'; }
  if (o.rec !== t.a) { tip += Math.round(r.price * 0.5); note = 'hors carte'; }
  if (t.fz) note = 'surgelé'; if (o.who) { tip += 6; }
  s.score += price + tip; o.paid += price + tip; s.served++; s.lines.push({ rec: t.a, stars: t.q, price, tip, note }); ev.push({ t: 'send', id: t.id, slot: k, gain: price + tip, who: o.who, rec: t.a, stars: t.q });
  if (o.menu && o.course < 2) { newOrder(s, k, o.table, o.course + 1); s.orders[k]!.paid = o.paid; ev.push({ t: 'course', slot: k }); }
  else { if (o.menu) { const bonus = 30 + Math.round(o.paid * 0.25); s.score += bonus; s.menus++; s.lines.push({ rec: '', stars: 0, price: bonus, tip: 0, note: 'menu complet' }); s.queue.push(mk(s, 'joker', 'joker')); ev.push({ t: 'menu', slot: k, gain: bonus }); } s.orders[k] = null; s.wait[k] = 2; ev.push({ t: 'leave', slot: k }); }
  growPool(s);
  if (s.o.mode === 'tablee' && s.left <= 0 && s.orders.every((x) => !x)) { s.over = true; s.won = true; s.score += 200; s.lines.push({ rec: '', stars: 0, price: 200, tip: 0, note: 'grande tablée' }); ev.push({ t: 'over' }); }
  s.prev = before; s.last = 'send'; if (!s.over && over(s)) { s.over = true; ev.push({ t: 'over' }); } return ev;
}
function finishOmakase(s: State) {
  const cs = s.omak.map((x) => 'EPD'.indexOf(REC[x.rec].course)); let ordered = true; for (let i = 1; i < cs.length; i++) if (cs[i] < cs[i - 1]) ordered = false;
  const kits = new Set(s.omak.map((x) => REC[x.rec].kit)).size, uniq = new Set(s.omak.map((x) => x.rec)).size, sec = s.omak.filter((x) => REC[x.rec].secret).length;
  const add = (p: number, note: string) => { if (p) { s.score += p; s.lines.push({ rec: '', stars: 0, price: p, tip: 0, note }); } };
  add(ordered && cs.includes(0) && cs.includes(2) ? 60 : 0, 'cohérence'); add(kits * 15 + sec * 25, 'audace'); add(uniq === 7 ? 30 : 0, 'sans redite');
}
// le shot : rejoue le dernier coup
export function undo(s: State): State | null { if (!s.prev || s.shots <= 0 || s.over) return null; const p = JSON.parse(s.prev) as State; p.shots = s.shots - 1; p.prev = null; p.rs = (s.rs ^ 0x9e3779b9) | 0; return p; }
export const pairsOf = (kit: string) => PAIRS[kit] || {};
// tuiles compatibles avec la tuile i (pour l'appui long)
export function compat(s: State, i: number): number[] { const t = s.cells[i]; if (!t) return []; const o: number[] = []; const keep = s.uid; s.cells.forEach((u, j) => { if (u && j !== i && (merge(s, t, u) || merge(s, u, t))) o.push(j); }); s.uid = keep; return o; }
