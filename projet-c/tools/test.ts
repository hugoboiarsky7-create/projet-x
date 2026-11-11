// Tests unitaires des règles + garde-fous.
import { newGame, move, send, merge, undo, canMove, over, sinkCell, pairsOf, type State, type Tile } from '../src/logic';
import { RECIPES, REC, KITCHENS } from '../src/data/recipes';
import { ING } from '../src/data/ingredients';
let ok = 0, ko = 0; const T = (name: string, c: boolean) => { if (c) ok++; else { ko++; console.log('ÉCHEC', name); } };
const g = (kit = 'home') => newGame({ kit, seed: 7 }); const t = (s: State, k: Tile['k'], a: string, q = 1, o: Partial<Tile> = {}): Tile => ({ id: ++s.uid, k, a, q, ...o });
// paires uniques par cuisine
for (const k of KITCHENS) { const seen: Record<string, string> = {}; for (const r of RECIPES.filter((x) => x.kit === k.id && !x.secret)) for (const [a, b] of [[0, 1], [0, 2], [1, 2]]) { const key = [r.ing[a], r.ing[b]].sort().join('+'); T('paire unique ' + key, !seen[key]); seen[key] = r.id; } T('table ' + k.id, k.id === 'omakase' || Object.keys(pairsOf(k.id)).length >= 15); }
for (const r of RECIPES) for (const i of r.ing) T('ingrédient dessiné ' + i, i === '-' || !!ING[i] || ['bolo', 'chili', 'joker'].includes(i));
for (const r of RECIPES.filter((x) => x.secret && x.ing[2] !== '-')) { const ks = pairsOf(r.kit); T('secret atteignable ' + r.id, [[0, 1], [0, 2], [1, 2]].some(([a, b]) => ks[[r.ing[a], r.ing[b]].sort().join('+')])); }
{ const s = g(); const p = merge(s, t(s, 'ing', 'pates'), t(s, 'ing', 'fromage'))!; T('A+B → préparation', p.k === 'prep' && p.a === 'cacio' && p.miss === 'poivre');
  const d = merge(s, p, t(s, 'ing', 'poivre'))!; T('prép + C → plat', d.k === 'dish' && d.a === 'cacio' && d.q === 1);
  T('C + prép aussi', merge(s, t(s, 'ing', 'poivre'), p)!.k === 'dish'); T('mauvais ingrédient', merge(s, p, t(s, 'ing', 'boeuf')) === null);
  const d2 = merge(s, d, t(s, 'dish', 'cacio'))!; T('plat+plat → ★★', d2.q === 2); const d3 = merge(s, d2, t(s, 'dish', 'cacio', 2))!; T('★★+★★ → ★★★', d3.q === 3); T('pas de ★★★★', merge(s, d3, t(s, 'dish', 'cacio', 3)) === null); T('étoiles différentes', merge(s, d, d2) === null);
  const dbl = merge(s, t(s, 'ing', 'pates'), t(s, 'ing', 'pates'))!; T('portion double', dbl.k === 'ing' && dbl.q === 2); T('double + simple incompatibles', merge(s, dbl, t(s, 'ing', 'fromage')) === null);
  const p2 = merge(s, dbl, t(s, 'ing', 'fromage', 2))!; T('double+double → prép double', p2.q === 2); T('prép double + C double → ★★', merge(s, p2, t(s, 'ing', 'poivre', 2))!.q === 2);
  T('paire sans recette', merge(s, t(s, 'ing', 'boeuf'), t(s, 'ing', 'saumon')) === null); T('joker complète', merge(s, p, t(s, 'joker', 'joker'))!.k === 'dish');
  T('steak+steak → bolognaise', merge(s, t(s, 'steak', 'steak'), t(s, 'steak', 'steak'))!.k === 'bolo'); T('bolognaise + pâtes → lasagnes', merge(s, t(s, 'bolo', 'bolo'), t(s, 'ing', 'pates'))!.a === 'lasagnes');
  T('secret limone', merge(s, merge(s, t(s, 'ing', 'pates'), t(s, 'ing', 'citron'))!, t(s, 'ing', 'fromage'))!.a === 'limone'); T('assiette sale inerte', merge(s, t(s, 'dirty', 'plate'), t(s, 'dirty', 'plate')) === null); }
{ const s = g(); s.cells.fill(null); s.cells[0] = t(s, 'ing', 'pates'); s.cells[1] = t(s, 'ing', 'fromage'); move(s, 1); T('glisser fusionne contre le bord', s.cells[0]?.k === 'prep'); T('une tuile entre', s.cells.filter(Boolean).length === 2);
  const s2 = g(); s2.cells.fill(null); s2.cells[0] = t(s2, 'ing', 'pates'); move(s2, 0); T('une case par coup', s2.cells[1]?.a === 'pates' && !s2.cells[3]); }
{ const s = g(); s.cells.fill(null); s.cells[9] = t(s, 'ing', 'boeuf'); s.cells[5] = t(s, 'dish', s.orders[0]!.rec); const sc = s.score, mv = s.moves; send(s, 5); T('envoyer encaisse', s.score > sc && !s.cells[5]); T('envoyer est gratuit', s.moves === mv); const u = undo(s)!; T('le shot rejoue', !!u && !!u.cells[5] && u.shots === 2); }
{ const s = g(); s.cells.fill(null); const sk = sinkCell(s); s.cells[sk - 1] = t(s, 'dirty', 'plate'); move(s, 0); T('évier', !s.cells[sk] || s.cells[sk]!.k !== 'dirty'); }
{ const s = g(); s.orders[0]!.left = 1; s.cells.fill(null); s.cells[0] = t(s, 'ing', 'pates'); move(s, 0); T('bon expiré → assiette sale au panier', !s.orders[0] && (s.queue.some((x) => x.k === 'dirty') || s.next.k === 'dirty' || s.next2.k === 'dirty')); }
{ const s = g('trat'); T('pâtes crues ne fusionnent pas', merge(s, t(s, 'ing', 'pates'), t(s, 'ing', 'oeuf')) === null); T('pâtes cuites fusionnent', merge(s, t(s, 'ing', 'pates', 1, { cook: 2 }), t(s, 'ing', 'oeuf'))!.k === 'prep');
  s.cells.fill(null); s.cells[5] = t(s, 'pot', 'pot'); s.cells[6] = t(s, 'ing', 'pates'); s.cells[15] = t(s, 'ing', 'oeuf'); move(s, 3); move(s, 2); T('la casserole cuit', s.cells.some((c) => c && c.a === 'pates' && (c.cook || 0) >= 1)); }
{ const s = g('cheng'); s.cells.fill(null); s.cells[5] = t(s, 'chili', 'chili'); s.cells[6] = t(s, 'ing', 'tofu'); s.cells[0] = t(s, 'ing', 'porc'); move(s, 3); T('le piment contamine', !!s.cells.find((c) => c && c.a === 'tofu')?.hot); }
{ const s = g('seoul'); s.cells.fill(null); s.cells[5] = t(s, 'dish', s.orders[0]!.rec); s.cells[6] = t(s, 'side', 'kimchi', 2); const a = newGame({ kit: 'seoul', seed: 7 }); a.cells.fill(null); a.cells[5] = t(a, 'dish', a.orders[0]!.rec); send(s, 5); send(a, 5); T('le banchan multiplie', s.score > a.score * 1.5 && !s.cells[6]); }
{ const s = g('tokyo'); s.cells.fill(null); s.cells[5] = t(s, 'ing', 'thon', 1, { fish: true, age: 15 }); s.cells[0] = t(s, 'ing', 'riz'); move(s, 2); T('le poisson passe', s.cells.some((c) => c && c.a === 'bones')); }
// aucune partie ne se bloque injustement dans les 20 premiers coups : un joueur qui fusionne dès qu'il peut passe toujours
import { play } from './bots';
let worst = 999, worstR = 999; for (const k of KITCHENS) for (let seed = 1; seed <= 150; seed++) { worst = Math.min(worst, play(k.id, seed, 'greedy').moves); worstR = Math.min(worstR, play(k.id, seed, 'rand').moves); }
T('pas de blocage précoce (glouton à un coup de profondeur) : pire ' + worst, worst >= 18);
{ const s = g(); s.cells.fill(null); T('plan de travail vide : on peut toujours glisser', canMove(s, 0) && move(s, 0).length > 0 && !over(s)); }
console.log(ok, 'réussis,', ko, 'échecs ; partie la plus courte : glouton', worst, 'coups, au hasard', worstR, 'coups');
process.exit(ko ? 1 : 0);
