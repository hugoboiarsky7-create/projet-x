import '@fontsource/fraunces/latin-600.css';
import '@fontsource/jetbrains-mono/latin-400.css';
import '@fontsource/jetbrains-mono/latin-700.css';
import './style.css';
import { newGame, move, send, undo, sendable, compat, sinkCell, firstOrder, type State, type Tile, type Ev, type Perks } from './logic';
import { REC, RECIPES, KITCHENS, KIT } from './data/recipes';
import { REGULARS, QUIPS, TOAST, ENDS, PERKS } from './data/texts';
import { ING } from './data/ingredients';
import { tileArt, dishArt, svg, BG } from './art';
import { S, load, persist, day } from './save';
import * as au from './audio';

const $ = (id: string) => document.getElementById(id)!; const app = $('app'), rail = $('rail'), board = $('board'), bar = $('bar'), ov = $('ov'), toastEl = $('toast');
const el = (tag: string, cls = '', html = '') => { const e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; return e; };
let G: State; const els = new Map<number, HTMLElement>(); let busy = false, marks: SVGSVGElement;
load();
// plans de travail : matière vraie, une seule source de lumière
const tex = (bf: string, oct: number, mat: string, seed = 2) => `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='600' height='600'><filter id='n' x='0' y='0' width='100%' height='100%'><feTurbulence type='fractalNoise' baseFrequency='${bf}' numOctaves='${oct}' seed='${seed}' stitchTiles='stitch'/><feColorMatrix values='${mat}'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`)}")`;
const col = (r: number, g: number, b: number, k: number, o: number) => `0 0 0 0 ${r} 0 0 0 0 ${g} 0 0 0 0 ${b} ${k} 0 0 0 ${o}`;
const BOARDS: Record<string, { bg: string; base: string; cell: string }> = {
  wood: { base: '#d6ae7c', bg: `${tex('0.004 0.42', 3, col(0.42, 0.25, 0.1, 1.5, -0.52))},${tex('0.02 0.9', 2, col(1, 0.9, 0.7, 0.9, -0.42), 7)}`, cell: 'rgba(70,35,5,.13)' },
  marble: { base: '#e6e2da', bg: `${tex('0.004 0.014', 5, col(0.45, 0.46, 0.5, 1.5, -0.74))},${tex('0.03 0.05', 3, col(1, 1, 1, 0.8, -0.36), 5)}`, cell: 'rgba(40,40,60,.1)' },
  steel: { base: '#b4bcc4', bg: `${tex('0.0016 0.9', 2, col(1, 1, 1, 1.6, -0.62))},${tex('0.002 0.6', 2, col(0.2, 0.24, 0.3, 1.4, -0.6), 9)}`, cell: 'rgba(20,30,45,.14)' },
  redwood: { base: '#8c4633', bg: `${tex('0.004 0.42', 3, col(0.25, 0.08, 0.05, 1.6, -0.5))},${tex('0.02 0.9', 2, col(1, 0.7, 0.5, 0.8, -0.42), 7)}`, cell: 'rgba(30,5,0,.2)' },
  teak: { base: '#b07a3c', bg: `${tex('0.005 0.5', 3, col(0.3, 0.16, 0.04, 1.6, -0.52), 4)},${tex('0.02 0.9', 2, col(1, 0.85, 0.5, 0.8, -0.4), 8)}`, cell: 'rgba(50,25,0,.16)' },
  slate: { base: '#3b4248', bg: `${tex('0.01 0.03', 4, col(0.7, 0.78, 0.85, 0.5, -0.24))},${tex('0.7', 2, col(0, 0, 0, 0.7, -0.3), 3)}`, cell: 'rgba(255,255,255,.07)' },
  hinoki: { base: '#e8d6ae', bg: `${tex('0.003 0.5', 3, col(0.6, 0.42, 0.2, 1.3, -0.52), 6)},${tex('0.02 0.9', 2, col(1, 1, 0.9, 0.8, -0.42), 7)}`, cell: 'rgba(90,60,10,.11)' },
};
function dress() { const b = BOARDS[KIT[G.o.kit].board]; app.style.backgroundColor = b.base; app.style.backgroundImage = b.bg; document.body.style.background = b.base; app.style.setProperty('--cell', b.cell); app.classList.toggle('pale', ['marble', 'steel', 'hinoki'].includes(KIT[G.o.kit].board)); app.style.setProperty('--n', String(G.n)); document.querySelector('meta[name=theme-color]')!.setAttribute('content', b.base); }
const pos = (i: number) => `translate(${(i % G.n) * 100}%,${Math.floor(i / G.n) * 100}%)`;
const CHILI = `<svg viewBox="0 0 64 64">${ING.chili}</svg>`;
function face(t: Tile): string {
  let h = svg(tileArt(t, G.o.kit));
  if (t.hot) h += `<span class="bd hot">${CHILI}</span>`;
  if (KIT[G.o.kit].rule === 'pot' && t.k === 'ing' && t.a === 'pates') { const c = t.cook || 0; h += `<span class="bd cook ${c >= 2 ? (c >= 6 ? 'bad' : 'done') : ''}">${[0, 1].map((i) => `<i class="${c > i ? 'on' : ''}"></i>`).join('')}</span>`; }
  if (KIT[G.o.kit].rule === 'fresh' && t.fish && t.k === 'ing') { const left = Math.max(0, 3 - Math.floor((t.age || 0) / 5.4)); h += `<span class="bd age">${[0, 1, 2].map((i) => `<i class="${i < left ? 'on' : ''}"></i>`).join('')}</span>`; }
  if (t.k === 'ice') h += `<span class="bd cook">${[0, 1].map((i) => `<i class="${(t.thaw || 0) > i ? 'on' : ''}"></i>`).join('')}</span>`;
  return h;
}
function mkTile(t: Tile, cls = '') { const e = el('div', `t ${t.k} ${cls}`, `<div class="f" style="--bg:${BG[t.k]}">${face(t)}</div>`); e.dataset.sig = sig(t); return e; }
const sig = (t: Tile) => [t.k, t.a, t.q, t.hot ? 1 : 0, t.cook || 0, Math.floor((t.age || 0) / 5.4), t.thaw || 0].join('|');
function buildBoard() {
  board.innerHTML = ''; els.clear(); marks = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); marks.id = 'marks'; marks.setAttribute('viewBox', '0 0 100 100'); board.appendChild(marks);
  for (let i = 0; i < G.n * G.n; i++) { const c = el('div', 'cell' + (i === sinkCell(G) ? ' sink' : ''), '<i></i>'); c.style.transform = pos(i); board.appendChild(c); }
  syncTiles([]); drawOrders(true); drawBar(); dress();
  app.querySelectorAll('#crate,#crate2').forEach((x) => x.remove()); if (G.o.kit === 'home') { app.appendChild(el('div', '', 'BONDUES')).id = 'crate'; app.appendChild(el('div', '', 'ÉPICERIE<br>D’ASIE')).id = 'crate2'; }
}
function syncTiles(ev: Ev[]) {
  const live = new Set<number>(); const spawn = new Map<number, number>(); for (const e of ev) if (e.t === 'spawn') spawn.set(e.id as number, e.from as number);
  for (const e of ev) if (e.t === 'merge') for (const id of [e.a as number, e.b as number]) { const x = els.get(id); if (x) { x.classList.add('dying'); x.style.transform = pos(e.to as number); els.delete(id); setTimeout(() => x.remove(), 120); } }
  G.cells.forEach((t, i) => {
    if (!t) return; live.add(t.id); let x = els.get(t.id);
    if (!x) {
      const born = ev.some((e) => (e.t === 'merge' || e.t === 'thaw' || e.t === 'spoil') && e.res === t.id); x = mkTile(t, born ? '' : 'in'); els.set(t.id, x);
      if (spawn.has(t.id)) { const d = spawn.get(t.id)!, [dx, dy] = [[-1, 0], [1, 0], [0, -1], [0, 1]][d]; x.classList.remove('in'); x.style.transition = 'none'; x.style.transform = `translate(${((i % G.n) + dx) * 100}%,${(Math.floor(i / G.n) + dy) * 100}%)`; board.appendChild(x); void x.offsetWidth; x.style.transition = ''; x.style.transform = pos(i); }
      else { x.style.transform = pos(i); if (born) { x.style.visibility = 'hidden'; setTimeout(() => { x!.style.visibility = ''; x!.classList.add('pop'); }, 110); } board.appendChild(x); }
    } else { x.style.transform = pos(i); if (x.dataset.sig !== sig(t)) { x.dataset.sig = sig(t); x.querySelector('.f')!.innerHTML = face(t); } }
    x.classList.toggle('ok', t.k === 'dish' && sendable(G, i) >= 0);
  });
  for (const [id, x] of els) if (!live.has(id)) { els.delete(id); if (!x.classList.contains('sent')) { x.classList.add('fade'); setTimeout(() => x.remove(), 260); } }
}
// bons de commande : papier thermique qui jaunit
const paperCol = (k: number) => { const a = [251, 247, 238], b = [240, 214, 150], c = [222, 150, 96]; const m = k < 0.5 ? a.map((v, i) => v + (b[i] - v) * (k * 2)) : b.map((v, i) => v + (c[i] - v) * ((k - 0.5) * 2)); return `rgb(${m.map(Math.round).join(',')})`; };
const bons: (HTMLElement | null)[] = [null, null, null, null]; const bonKey: string[] = ['', '', '', ''];
function drawOrders(reset = false) {
  if (reset) { rail.innerHTML = ''; bons.fill(null); bonKey.fill(''); for (let k = 0; k < G.orders.length; k++) { const slot = el('div', 'bon wait'); slot.style.visibility = 'hidden'; rail.appendChild(slot); bons[k] = slot; } }
  if (KIT[G.o.kit].rule === 'omakase') { rail.innerHTML = ''; const b = el('div', 'bon', `<div class="tb"><span>OMAKASE</span><span>${G.omak.length}/7</span></div><div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-top:6px">${Array.from({ length: 7 }, (_, i) => G.omak[i] ? svg(dishArt(G.omak[i].rec, G.omak[i].stars, 'home')) : '<i style="aspect-ratio:1;border:1.2px dashed rgba(47,42,38,.3);border-radius:50%"></i>').join('')}</div><div class="q" style="margin-top:8px">${G.insp.map((r) => REC[r].name).join(' · ')}</div>`); b.style.maxWidth = '94%'; b.style.setProperty('--r', '-.6deg'); rail.appendChild(b); return; }
  const first = KIT[G.o.kit].rule === 'fresh' ? firstOrder(G) : -1;
  G.orders.forEach((o, k) => {
    const b = bons[k]!; if (!o) { if (bonKey[k]) { bonKey[k] = ''; const nb = el('div', 'bon wait'); nb.style.visibility = 'hidden'; b.classList.add(b.dataset.out || 'gone'); b.style.position = 'absolute'; b.style.left = b.offsetLeft + 'px'; b.style.width = b.offsetWidth + 'px'; rail.insertBefore(nb, b); bons[k] = nb; setTimeout(() => b.remove(), 360); } return; }
    const key = o.table + ':' + o.course, r = REC[o.rec], pat = 1 - o.left / o.max;
    if (bonKey[k] !== key) {
      bonKey[k] = key; const reg = o.who ? REGULARS[o.who] : null; const quip = reg ? reg.quip.replace('{n}', String(o.table)) : o.quip < 16 ? QUIPS[o.quip % QUIPS.length] : '';
      const pips = o.menu ? [0, 1, 2].map((i) => `<i class="${i <= o.course ? 'on' : ''}"></i>`).join('') : '';
      const want = o.want === 'hot' ? CHILI : o.want === 'mild' ? `<svg viewBox="0 0 64 64">${ING.chili}<path d="M10 10L54 54" stroke="#2f2a26" stroke-width="6" stroke-linecap="round"/></svg>` : '';
      const lev = o.lev ? `<svg viewBox="0 0 12 12"><path d="M0-5l1.5 3.2 3.5.4-2.6 2.4.7 3.5L0 2.8-3.1 4.5l.7-3.5L-5-1.4l3.5-.4z" transform="translate(6 6)" fill="#d9a441"/></svg><svg viewBox="0 0 12 12"><path d="M0-5l1.5 3.2 3.5.4-2.6 2.4.7 3.5L0 2.8-3.1 4.5l.7-3.5L-5-1.4l3.5-.4z" transform="translate(6 6)" fill="#d9a441"/></svg>` : '';
      const who = reg ? `<svg viewBox="0 0 40 40" style="fill:#2f2a26">${reg.svg}</svg>` : '';
      const nb = el('div', 'bon', `<div class="tb"><span>${G.o.mode === 'tablee' ? 'LES 8' : 'T.' + o.table}</span><span>${'EPD'[o.course] === 'E' ? 'ENT' : 'EPD'[o.course] === 'P' ? 'PLAT' : 'DES'}</span></div>${svg(dishArt(o.rec, o.lev ? 2 : 1, G.o.kit), 'd')}<div class="nm">${r.name}</div><div class="ic">${who}${pips}${want}${lev}</div>${quip ? `<div class="q">${quip}</div>` : ''}`);
      nb.style.setProperty('--r', ((o.table * 37 + k * 11) % 5 - 2) * 0.7 + 'deg'); rail.replaceChild(nb, b); bons[k] = nb; if (!reset) au.paper();
    }
    const x = bons[k]!; x.style.setProperty('--pc', paperCol(pat)); x.classList.toggle('low', o.left <= 5); x.classList.toggle('wait', first >= 0 && k !== first);
  });
}
const FLASK = (off: boolean) => `<svg viewBox="0 0 21 38" class="${off ? 'off' : ''}"><path d="M5 2h11l-1.5 22a4 4 0 0 1-8 0z" fill="#eef4f5"/><path d="M5.8 11h9.400000000000002L14.5 24a4 4 0 0 1-8 0z" fill="#e9a23b"/><rect x="9" y="27" width="3" height="6" fill="#dfe7e9"/><rect x="4" y="33" width="13" height="3" rx="1.5" fill="#dfe7e9"/></svg>`;
let shown = 0;
function drawBar() {
  const goal = KIT[G.o.kit].goal, nextK = KITCHENS[KITCHENS.findIndex((k) => k.id === G.o.kit) + 1], need = !G.o.mode && nextK && (S.best[G.o.kit] || 0) < goal;
  bar.innerHTML = `<div id="basket">${mkTile(G.next).outerHTML}${G.o.perks?.peek ? `<div class="t2">${mkTile(G.next2).outerHTML}</div>` : ''}</div><div id="score"><span id="sc">${shown}</span><small>€</small>${need ? `<span class="goal">${goal} €</span>` : ''}</div><div id="shots">${[0, 1, 2, 3].slice(0, Math.max(3, G.shots)).map((i) => FLASK(i >= G.shots)).join('')}</div>`;
  $('shots').onclick = () => doUndo();
}
function countTo() { const target = G.score; const stepN = () => { if (shown === target) return; shown += Math.sign(target - shown) * Math.max(1, Math.round(Math.abs(target - shown) / 6)); const s = document.getElementById('sc'); if (s) s.textContent = String(shown); requestAnimationFrame(stepN); }; stepN(); }
let toastT = 0; function toast(s: string) { toastEl.textContent = s; toastEl.classList.add('on'); clearTimeout(toastT); toastT = window.setTimeout(() => toastEl.classList.remove('on'), 2400); }
const cellXY = (i: number) => ({ x: ((i % G.n) + 0.5) * (100 / G.n), y: (Math.floor(i / G.n) + 0.5) * (100 / G.n) });
const FX: Record<string, string> = {
  chop: '<svg viewBox="0 0 64 64"><path d="M8 40L44 8c6 0 10 4 10 10L22 46z" fill="#e9edf1"/><path d="M8 40L44 8c2 0 4 .6 5.6 1.600000000000001L14 43z" fill="#fff"/><path d="M22 46l8-7 16 14c-3 4-8 4-11 1z" fill="#4a3426"/></svg>',
  whisk: '<svg viewBox="0 0 64 64"><path d="M32 6v22" stroke="#4a3426" stroke-width="5" stroke-linecap="round"/><path d="M32 26c-12 6-14 20 0 30 14-10 12-24 0-30zM32 26c-5 8-5 20 0 30 5-10 5-22 0-30z" fill="none" stroke="#dfe5ea" stroke-width="2.2"/></svg>',
  nap: '<svg viewBox="0 0 64 64"><path d="M10 34c8-14 16 10 24-4s14 8 22-4" fill="none" stroke="#fff3cf" stroke-width="5" stroke-linecap="round"/></svg>',
  flame: '<svg viewBox="0 0 64 64"><path d="M32 4c4 12 18 18 18 34 0 12-8 22-18 22S14 50 14 38c0-8 5-12 8-18 2 6 4 8 6 8 0-8 0-16 4-24z" fill="#f6a03b"/><path d="M32 30c2 6 9 9 9 17 0 7-4 11-9 11s-9-4-9-11c0-8 7-11 9-17z" fill="#ffe08a"/></svg>',
};
function fx(kind: string, cell: number) {
  const f = el('div', 'fx ' + kind, FX[kind]); f.style.transform = pos(cell); board.appendChild(f); setTimeout(() => f.remove(), 320);
  const { x, y } = cellXY(cell);
  for (let i = 0; i < 5; i++) { const c = el('div', 'crumb'); const s = 2 + Math.random() * 3; c.style.cssText = `left:${x + (Math.random() - 0.5) * 6}%;top:${y + (Math.random() - 0.5) * 6}%;width:${s}px;height:${s}px;background:${kind === 'nap' ? '#fff3cf' : kind === 'flame' ? '#f6a03b' : '#8a6a3c'};--dx:${(Math.random() - 0.5) * 60}px;--dy:${(Math.random() - 0.5) * 60}px`; board.appendChild(c); setTimeout(() => c.remove(), 1750); }
  if (kind === 'chop' && marks.childElementCount < 46) { const a = Math.random() * 3.14, len = 2 + Math.random() * 3, m = document.createElementNS('http://www.w3.org/2000/svg', 'path'); const mx = x + (Math.random() - 0.5) * 12, my = y + (Math.random() - 0.5) * 12; m.setAttribute('d', `M${mx - Math.cos(a) * len} ${my - Math.sin(a) * len}L${mx + Math.cos(a) * len} ${my + Math.sin(a) * len}`); m.setAttribute('stroke', BOARDS[KIT[G.o.kit].board].cell.replace(/[\d.]+\)$/, '.35)')); m.setAttribute('stroke-width', '.35'); m.setAttribute('stroke-linecap', 'round'); marks.appendChild(m); }
}
function plus(n: number, at: HTMLElement) { const r = at.getBoundingClientRect(); const p = el('div', 'plus', '+' + n); p.style.left = r.left + r.width / 2 - 14 + 'px'; p.style.top = r.bottom - 6 + 'px'; app.appendChild(p); setTimeout(() => p.remove(), 1000); }
function after(ev: Ev[], sentEl?: HTMLElement) {
  for (const e of ev) {
    if (e.t === 'merge') { const k = e.kind as string, t = G.cells[e.to as number]; if (k === 'prep') { fx('chop', e.to as number); au.chop(); } else if (k === 'dish') { if (t && t.q > 1) { fx('flame', e.to as number); au.flame(); } else { fx('nap', e.to as number); au.sizzle(); au.whisk(); } if (t) { S.carnet[t.a] = Math.max(S.carnet[t.a] || 0, t.q); if (REC[t.a].secret) toast(TOAST.secret); } } else if (k === 'bolo') { fx('whisk', e.to as number); au.whisk(); toast(TOAST.bolo); } else { fx('whisk', e.to as number); au.whisk(); } au.buzz(12); }
    else if (e.t === 'spawn') { const t = G.cells[e.cell as number]; if (t?.k === 'steak') toast(TOAST.steak); if (t?.k === 'joker') au.clink(); }
    else if (e.t === 'expire') { toast(TOAST.gone.replace('{n}', String(e.table))); au.rip(); au.buzz([20, 40, 20]); }
    else if (e.t === 'sink') { au.splash(); } else if (e.t === 'thaw') { au.ice(); } else if (e.t === 'cooked') au.bell();
    else if (e.t === 'spoil') { const t = G.cells.find((c) => c && c.id === e.res); toast(t?.a === 'mush' ? TOAST.mush : TOAST.bones); au.no(); }
    else if (e.t === 'send') { au.bell(); au.buzz(18); const b = bons[e.slot as number]; if (b) { plus(e.gain as number, b); b.dataset.out = 'served'; } if (e.who) { S.reg[e.who as string] = (S.reg[e.who as string] || 0) + 1; } if (!S.title) { S.title = 1; $('title').classList.add('on'); document.title = 'Coup de feu'; } }
    else if (e.t === 'menu') { au.till(); toast(TOAST.menu); const b = bons[e.slot as number]; if (b) setTimeout(() => plus(e.gain as number, b), 250); }
  }
  syncTiles(ev); drawOrders(); drawBar(); countTo(); S.cur = G.over ? null : G; persist();
  if (G.over) setTimeout(endService, 900);
}
function act(d: number) { if (busy || G.over || ov.classList.contains('on')) return; au.init(); const ev = move(G, d); if (!ev.length) { au.bump(); return; } au.slide(); au.buzz(4); $('hand')?.remove(); if (!S.hint) { S.hint = 1; } after(ev); }
function tapTile(i: number, x: HTMLElement) {
  const t = G.cells[i]; if (!t || G.over) return; au.init();
  if (t.k !== 'dish') return; const k = sendable(G, i); if (k < 0) { x.classList.remove('nope'); void x.offsetWidth; x.classList.add('nope'); au.no(); return; }
  const target = KIT[G.o.kit].rule === 'omakase' ? rail.firstElementChild as HTMLElement : bons[k]!; const a = x.getBoundingClientRect(), b = target.getBoundingClientRect(); const fz = t.fz;
  x.classList.add('sent'); x.style.zIndex = '9'; x.animate([{ transform: x.style.transform }, { transform: `${x.style.transform} translate(${b.left + b.width / 2 - a.left - a.width / 2}px,${b.top + b.height / 2 - a.top - a.height / 2}px) scale(.3)`, opacity: 0.2 }], { duration: 300, easing: 'cubic-bezier(.5,0,.6,1)', fill: 'forwards' }); setTimeout(() => x.remove(), 300);
  const ev = send(G, i); if (fz) toast(TOAST.fz); after(ev);
}
function doUndo() { const p = undo(G); if (!p) { au.no(); return; } au.undo(); G = p; shown = G.score; buildBoard(); S.cur = G; persist(); }
// gestes
let down: { x: number; y: number; t: number; el: HTMLElement | null; hold: number; moved: boolean; held: boolean } | null = null;
const idxOf = (x: HTMLElement) => { for (const [id, e] of els) if (e === x) return G.cells.findIndex((c) => c && c.id === id); return -1; };
app.addEventListener('pointerdown', (e) => {
  if (ov.classList.contains('on') || (e.target as HTMLElement).closest('#bar')) return; const tEl = (e.target as HTMLElement).closest('#board .t') as HTMLElement | null;
  down = { x: e.clientX, y: e.clientY, t: performance.now(), el: tEl, hold: 0, moved: false, held: false };
  if (tEl) down.hold = window.setTimeout(() => { if (!down || down.moved) return; down.held = true; const i = idxOf(tEl); const cs = new Set(compat(G, i)); G.cells.forEach((c, j) => { if (!c) return; const x = els.get(c.id)!; if (cs.has(j)) x.classList.add('can'); else if (j !== i) x.classList.add('dim'); }); au.buzz(6); }, 320);
});
app.addEventListener('pointermove', (e) => { if (!down || down.moved) return; const dx = e.clientX - down.x, dy = e.clientY - down.y; if (Math.hypot(dx, dy) > 22 && !down.held) { down.moved = true; clearTimeout(down.hold); act(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 0 : 1) : dy > 0 ? 2 : 3); } });
const upF = () => { if (!down) return; clearTimeout(down.hold); board.querySelectorAll('.can,.dim').forEach((x) => x.classList.remove('can', 'dim')); if (!down.moved && !down.held && down.el && performance.now() - down.t < 320) tapTile(idxOf(down.el), down.el); down = null; };
app.addEventListener('pointerup', upF); app.addEventListener('pointercancel', upF);
window.addEventListener('keydown', (e) => { const d = { ArrowRight: 0, ArrowLeft: 1, ArrowDown: 2, ArrowUp: 3 }[e.key]; if (d !== undefined) { e.preventDefault(); act(d); } else if (e.key === 'z' || e.key === 'Backspace') doUndo(); else if (e.key === 'Escape' && ov.classList.contains('on') && !G.over) closeOv(); else if (e.key === 'Escape' && !G.over) menuScreen(); else if (e.key === ' ' || e.key === 'Enter') { const i = G.cells.findIndex((_, j) => sendable(G, j) >= 0); if (i >= 0) tapTile(i, els.get(G.cells[i]!.id)!); } });
// services
const perks = (): Perks => (S.perk ? { [S.perk]: true } : {});
const unlocked = () => { const u = ['home']; for (let i = 0; i < KITCHENS.length - 1; i++) { if ((S.best[KITCHENS[i].id] || 0) >= KITCHENS[i].goal) u.push(KITCHENS[i + 1].id); else break; } return u; };
function start(kit: string, mode: '' | 'daily' | 'tablee' = '', seed = (Math.random() * 2 ** 31) | 0) { G = newGame({ kit, seed, mode, perks: perks(), regulars: Object.keys(REGULARS) }); if (!mode) S.kit = kit; shown = 0; closeOv(); buildBoard(); S.cur = G; persist(); }
function closeOv() { ov.classList.remove('on'); ov.innerHTML = ''; }
const hashS = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
function receipt(final: boolean): string {
  const kit = KIT[G.o.kit], agg = new Map<string, { n: number; p: number; name: string }>(); let tips = 0; const extras: [string, number][] = [];
  for (const l of G.lines) { if (!l.rec) { extras.push([l.note, l.price]); continue; } const k = l.rec + l.stars, a = agg.get(k) || { n: 0, p: 0, name: REC[l.rec].name + (l.stars > 1 ? ' ' + '★'.repeat(l.stars) : '') }; a.n++; a.p += l.price; agg.set(k, a); tips += l.tip; }
  const ln = (a: string, b: string | number, cls = '') => `<div class="ln ${cls}"><span>${a}</span><b>${b}</b></div>`; const d = new Date();
  let h = `<h1>Coup de feu</h1><div class="sub">${G.o.mode === 'daily' ? 'Plat du jour · ' : G.o.mode === 'tablee' ? 'Grande tablée · ' : ''}${kit.name}</div><div class="sub">${d.toLocaleDateString('fr-FR')} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} · ${G.moves} coups</div><hr>`;
  h += [...agg.values()].map((a) => ln(`${a.n} × ${a.name}`, a.p)).join('') || ln('—', 0);
  h += extras.map(([n, p2]) => ln(n[0].toUpperCase() + n.slice(1), p2)).join('') + (tips ? ln('Pourboires', tips) : '') + `<hr>` + ln('TOTAL', G.score + ' €', 'tot');
  if (final) { const rec = !G.o.mode && G.score > 0 && G.score >= (S.best[G.o.kit] || 0); h += rec ? ln('Record de la maison', '★') : !G.o.mode ? ln('Record', (S.best[G.o.kit] || 0) + ' €') : ''; h += `<div class="qp">${G.o.kit === 'omakase' && G.won ? ENDS.omakase : G.o.mode === 'tablee' && G.won ? ENDS.tablee : G.moves < 30 ? ENDS.short : G.expired === 0 && G.served > 12 ? ENDS.great : ENDS.def}</div>`; if (!G.o.mode && kit.goal && G.score >= kit.goal * 2) { h += `<div class="slate">Chez Bob</div>`; S.chezbob++; } }
  return h;
}
function navHTML(final: boolean) {
  const u = unlocked(), td = day(); let h = `<hr>`;
  if (!final) h += `<div class="big" data-a="resume">Reprendre le service</div>`;
  h += `<div class="big" data-a="again">${final ? 'Encore un service' : 'Recommencer'}</div><hr>`;
  KITCHENS.forEach((k, i) => { const open = u.includes(k.id); if (k.id === 'omakase' && !open) return; h += open ? `<div class="nav ${k.id === S.kit ? 'sel' : ''}" data-a="kit:${k.id}"><span>${k.id === S.kit ? '▸ ' : ''}${k.name}</span><i>${S.best[k.id] || 0} €</i></div>` : i === u.length ? `<div class="nav lock"><span>· · ·</span><i>${KITCHENS[i - 1].goal} €</i></div>` : ''; });
  h += `<hr><div class="nav ${S.daily.date === td ? 'lock' : ''}" data-a="daily"><span>Plat du jour</span><i>${S.daily.date === td ? S.daily.score + ' €' : ''}${S.daily.streak > 1 ? ' · ' + S.daily.streak + ' j' : ''}</i></div>`;
  if (S.tablee || (S.reg.huit || 0) >= 2 || u.length >= 3) h += `<div class="nav" data-a="tablee"><span>Grande tablée</span><i>${S.tablee ? S.tablee + ' €' : '5×5'}</i></div>`;
  h += `<div class="nav" data-a="carnet"><span>Le carnet</span><i>${Object.keys(S.carnet).length}/${RECIPES.length}</i></div><div class="nav" data-a="regs"><span>Les habitués</span><i>${Object.values(S.reg).filter((n) => n >= 3).length}/${Object.keys(REGULARS).length}</i></div>`;
  if (final) h += `<div class="nav" data-a="share"><span>Partager l’addition</span><i>↗</i></div>`;
  return h;
}
function show(html: string) { ov.innerHTML = `<div class="rc">${html}</div>`; ov.classList.add('on'); ov.scrollTop = 0; }
let lastReceipt = '';
function endService() {
  S.services++; S.total += G.score; S.cur = null; if (G.o.mode === 'daily') { S.daily.score = G.score; S.daily.best = Math.max(S.daily.best, G.score); } else if (G.o.mode === 'tablee') S.tablee = Math.max(S.tablee, G.score);
  lastReceipt = receipt(true); if (!G.o.mode) S.best[G.o.kit] = Math.max(S.best[G.o.kit] || 0, G.score); persist(); au.till(); show(lastReceipt + navHTML(true));
}
function menuScreen() { show(receipt(false) + navHTML(false)); }
function carnet() { show(`<h1>Le carnet</h1><div class="grid">${RECIPES.map((r) => S.carnet[r.id] ? `<div class="it" data-n="${r.name}">${svg(dishArt(r.id, S.carnet[r.id], 'home'))}</div>` : '<div class="it no"></div>').join('')}</div><div class="qp" id="cn">&nbsp;</div><hr><div class="grid" style="grid-template-columns:repeat(8,1fr);gap:4px">${Object.keys(ING).map((k) => `<div class="it">${svg(ING[k])}</div>`).join('')}</div><hr><div class="big" data-a="back">Retour</div>`); }
function regs() { show(`<h1>Les habitués</h1><div class="regs">${Object.entries(REGULARS).map(([id, r]) => { const n = S.reg[id] || 0, ok = n >= 3 && r.perk; return `<div class="rg ${n ? '' : 'no'} ${S.perk && S.perk === r.perk ? 'sel' : ''}" data-a="${ok ? 'perk:' + r.perk : ''}"><svg viewBox="0 0 40 40">${r.svg}</svg><div class="pk">${ok ? `<svg viewBox="0 0 40 40" fill="currentColor">${PERKS[r.perk]}</svg>` : [0, 1, 2].map((i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</div></div>`; }).join('')}</div><hr><div class="big" data-a="back">Retour</div>`); }
let backTo: () => void = menuScreen;
ov.addEventListener('click', (e) => {
  const t = (e.target as HTMLElement).closest('[data-a],[data-n]') as HTMLElement | null; if (!t) return; au.init(); if (t.dataset.n) { $('cn').textContent = t.dataset.n; return; } const a = t.dataset.a || ''; if (!a) return; au.paper();
  const final = G.over; backTo = final ? () => show(lastReceipt + navHTML(true)) : menuScreen;
  if (a === 'resume') closeOv(); else if (a === 'again') start(G.o.mode === 'tablee' ? S.kit : G.o.mode === 'daily' ? S.kit : G.o.kit, G.o.mode === 'tablee' ? 'tablee' : '');
  else if (a.startsWith('kit:')) start(a.slice(4)); else if (a === 'tablee') start(S.kit === 'omakase' ? 'home' : S.kit, 'tablee');
  else if (a === 'daily') { const td = day(); if (S.daily.date === td) return; const u = unlocked().filter((k) => k !== 'omakase'); S.daily.streak = S.daily.date === day(-1) ? S.daily.streak + 1 : 1; S.daily.date = td; S.daily.score = 0; start(u[hashS(td) % u.length], 'daily', hashS(td + 'x')); }
  else if (a === 'carnet') carnet(); else if (a === 'regs') regs(); else if (a === 'back') backTo(); else if (a.startsWith('perk:')) { S.perk = S.perk === a.slice(5) ? '' : a.slice(5); persist(); regs(); } else if (a === 'share') share();
});
async function share() {
  const c = document.createElement('canvas'), W = 720, lines = G.lines.filter((l) => l.rec), H = 520 + Math.min(lines.length, 18) * 34; c.width = W; c.height = H; const g = c.getContext('2d')!; g.fillStyle = '#fbf7ee'; g.fillRect(0, 0, W, H); g.fillStyle = '#2f2a26'; g.textAlign = 'center'; g.font = '600 64px Fraunces, Georgia, serif'; g.fillText('Coup de feu', W / 2, 110);
  g.font = '22px "JetBrains Mono", monospace'; g.fillText(KIT[G.o.kit].name.toUpperCase() + ' · ' + new Date().toLocaleDateString('fr-FR'), W / 2, 156); let y = 220; const dash = () => { g.setLineDash([8, 8]); g.lineWidth = 2; g.strokeStyle = '#2f2a26'; g.beginPath(); g.moveTo(50, y); g.lineTo(W - 50, y); g.stroke(); y += 44; }; dash();
  g.font = '24px "JetBrains Mono", monospace'; for (const l of lines.slice(-18)) { g.textAlign = 'left'; g.fillText(REC[l.rec].name + (l.stars > 1 ? ' ' + '★'.repeat(l.stars) : ''), 50, y); g.textAlign = 'right'; g.fillText(String(l.price + l.tip), W - 50, y); y += 34; }
  y += 6; dash(); g.font = '700 38px "JetBrains Mono", monospace'; g.textAlign = 'left'; g.fillText('TOTAL', 50, y + 8); g.textAlign = 'right'; g.fillText(G.score + ' €', W - 50, y + 8); g.font = 'italic 22px "JetBrains Mono", monospace'; g.textAlign = 'center'; g.fillText(ENDS.def, W / 2, y + 80);
  const blob: Blob | null = await new Promise((r) => c.toBlob(r, 'image/png')); if (!blob) return; const file = new File([blob], 'addition.png', { type: 'image/png' });
  try { if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file] }); return; } } catch { return; }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'addition.png'; a.click();
}
$('rail').addEventListener('click', () => { if (!down?.moved && !G.over) menuScreen(); });
// démarrage : pas de menu
if (S.cur && !S.cur.over) { G = S.cur; shown = G.score; buildBoard(); } else start('home');
if (!S.hint) { const h = el('div', '', '<svg viewBox="0 0 54 54"><path d="M20 30V10a4 4 0 0 1 8 0v14l10 2c4 1 6 4 5 8l-2 10c-1 4-4 6-8 6H24c-3 0-5-1-7-4L8 34c-2-3 2-7 6-4z" fill="#fff" stroke="#2f2a26" stroke-width="2"/></svg>'); h.id = 'hand'; app.appendChild(h); }
let lt = performance.now(); setInterval(() => { const n = performance.now(); au.ambient(G.o.kit, Math.min(1, G.served / 30), (n - lt) / 1000); lt = n; }, 100);
document.addEventListener('visibilitychange', () => { if (document.hidden) persist(); });
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('./sw.js').catch(() => { /* */ });
(window as unknown as { __t: unknown }).__t = { get G() { return G; }, set G(v: State) { G = v; shown = G.score; buildBoard(); }, S, start, act, endService, menuScreen, carnet, regs, persist };
