import '@fontsource/inter/latin-200.css';
import { Post } from './gl';
import { layout, albedo, emissive, GY, type Slot } from './scene';
import { tube, word, wordLen } from './tubes';
import { DISTRICTS, WD, DAILY } from './data/words';
import { levelSteps, complete, mark, wordJamo, type Step } from './course';
import { carrier, split, slots as hslots, isVowel, isSyl, LEAD, VOW } from './hangul';
import { S, load, persist, day } from './save';
import * as au from './audio';
import * as sp from './speech';

load(); sp.initSpeech();
const cv = document.getElementById('c') as HTMLCanvasElement, post = new Post(cv);
const E = document.createElement('canvas'), A = document.createElement('canvas'), g = E.getContext('2d')!, ga = A.getContext('2d')!;
let W = 0, H = 0, sc = 1, T = 0, slots: Slot[] = [], dirty = true, di = Math.min(S.di, 5);
interface Obj { key: string; ch: string; x: number; y: number; tx: number; ty: number; size: number; col: string; lit: number; tl: number; role: string; bad: number; done?: boolean; vert?: boolean; w?: string }
interface Task { di: number; li: number; steps: Step[]; si: number; known: string; err: boolean; fill: string; built: string[]; lock: number; daily?: boolean; arcade?: boolean; pic: number }
let mode: 'idle' | 'task' | 'reveal' | 'book' | 'blackout' | 'end' = 'idle', objs: Obj[] = [], task: Task | null = null, idleT = 0, auto = true, streakN = 0, sceneA = 1, revealT = 0, titleT = 0, hintT = 0, endT = 0, fade = 1, fadeTo = -1;
const ign = new Map<string, number>(); let bo: { off: Set<number>; target: number; t: number; n: number } | null = null, timer = 0, timerMax = 0, scooter = -1, scT = 25;
const D = () => DISTRICTS[di], col = (k = 0) => D().col[k];
const JI = (j: string) => { const i = LEAD.indexOf(j); return i >= 0 ? i : 19 + VOW.indexOf(j); };
function resize() {
  W = window.innerWidth; H = window.innerHeight; sc = Math.min(window.devicePixelRatio || 1, S.lowfx ? 1 : 2); for (const c of [E, A]) { c.width = Math.round(W * sc); c.height = Math.round(H * sc); }
  post.resize(E.width, E.height); slots = layout(di, W, H); dirty = true; if (task) setup();
}
const isLit = (s: Slot) => (bo ? !bo.off.has(s.i) && s.kind !== 'secret' && s.i < S.prog.lit[di] : s.kind === 'secret' ? S.secrets.includes(s.word) : s.i < S.prog.lit[di]);
function litLevel(s: Slot): number {
  if (!isLit(s)) return 0; const k = di + ':' + s.kind + s.i, t0 = ign.get(k); if (t0 !== undefined) { const e = T - t0; if (e < 0.9) return [0, 1, 0, 0, 1, 0.2, 1, 0, 1][Math.floor(e * 10)] ?? 1; }
  const h = Math.sin(s.i * 91.7 + Math.floor(T * 9) * 13.1 + di) * 43758.5; const f = h - Math.floor(h); return f > 0.993 ? 0.35 : 0.94 + 0.06 * Math.sin(T * 50 + s.i);
}
// ——— tâches
function startLevel(daily = false) {
  const li = S.prog.lit[di]; if (!daily && li >= D().signs.length) return; au.initAudio();
  if (daily) { const cand = DAILY.filter((w) => wordJamo(w).every((j) => S.prog.known.includes(j))); if (!cand.length) return; let h = 0; for (const c of day()) h = (h * 31 + c.charCodeAt(0)) >>> 0; const w = cand[h % cand.length], ss = [...w]; task = { di, li: -1, steps: ss.map((s, i) => ({ k: 'B' as const, syl: s, tray: shuffled([...new Set([...jam(s), ...distractFor(s)])]), word: w, wi: i, last: i === ss.length - 1 })), si: 0, known: S.prog.known, err: false, fill: '', built: [], lock: 0, daily: true, pic: 0 }; S.daily.date = day(); persist(); }
  else { const r = levelSteps(di, li, S.prog, Math.random); task = { di, li, steps: r.steps, si: 0, known: r.known, err: false, fill: '', built: [], lock: 0, pic: 0 }; }
  mode = 'task'; setup();
}
const shuffled = <X>(a: X[]) => a.map((x) => [Math.random(), x] as [number, X]).sort((p, q) => p[0] - q[0]).map((x) => x[1]);
const jam = (s: string) => split(s).filter(Boolean);
const distractFor = (s: string) => shuffled([...S.prog.known].filter((j) => !jam(s).includes(j) && !'ㅐㅔㅒㅖㅙㅚㅞ'.includes(j) && isVowel(j) === (Math.random() < 0.5))).slice(0, 2);
const mkO = (key: string, ch: string, x: number, y: number, size: number, role: string, c = col(0), lit = 0): Obj => ({ key, ch, x, y: y + 18, tx: x, ty: y, size, col: c, lit, tl: lit, role, bad: 0 });
function setup() {
  const t = task!, s = t.steps[t.si]; objs = []; t.err = false; t.fill = ''; t.lock = 0; t.pic = 0; if (t.si === 0 || s.wi === 0 || s.word === undefined) { if (!s.word || s.wi === 0) t.built = []; }
  const row = (items: string[], keyf: (c: string) => string, y: number, max: number, role: string) => { const n = items.length, per = n > 3 ? 2 : n, rows = Math.ceil(n / per), size = Math.min(max, (W - 40) / per - 18); items.forEach((c, i) => { const r = Math.floor(i / per), k = i % per, nn = Math.min(per, n - r * per); objs.push(mkO(keyf(c), c, W / 2 + (k - (nn - 1) / 2) * (size + 22) - size / 2, y + (r - (rows - 1) / 2) * (size + 26) - size / 2, size, role, col(i % 2))); }); };
  const speaker = () => objs.push(mkO('p:speaker', '', W / 2 - 15, H * 0.13, 30, 'ui', '#9fb4d8', 0.5));
  if (s.k === 'T') { row(s.items!, (c) => 'j:' + c, H * 0.42, 124, 'touch'); }
  else if (s.k === 'F') { row(s.opts!, (c) => 'j:' + c, H * 0.44, 118, 'opt'); speaker(); later(450, () => sp.sayLog(carrier(s.target!))); }
  else if (s.k === 'B') { const tr = s.tray!, size = Math.min(70, (W - 30) / tr.length - 10); tr.forEach((c, i) => objs.push(mkO('j:' + c, c, W / 2 + (i - (tr.length - 1) / 2) * (size + 12) - size / 2, H * 0.665, size, 'tray', col(1)))); speaker(); later(450, () => sp.sayLog(s.syl!)); }
  else if (s.k === 'R') { const n = [...s.word!].length, bs = Math.min(66, (W - 50) / n / 1.12); objs.push({ ...mkO('', s.word!, W / 2 - wordLen(s.word!, bs) / 2, H * 0.24, bs, 'word', col(0)), w: s.word! }); const ps = Math.min(92, W * 0.24); s.opts!.forEach((p, i) => objs.push(mkO('p:' + p, p, W / 2 + ((i % 2) - 0.5) * (ps + 34) - ps / 2, H * 0.47 + Math.floor(i / 2) * (ps + 30), ps, 'opt', col(1)))); }
  else { // L : la voix → le mot écrit ; P : le pictogramme → le mot écrit
    const n = s.opts!.length, mx = Math.max(...s.opts!.map((w) => [...w].length)), cols = n > 4 ? 2 : 1, bs = Math.min(46, (W / cols - 44) / mx / 1.12, (H * 0.42) / Math.ceil(n / cols) / 1.5);
    s.opts!.forEach((w, i) => { const cx = cols === 1 ? W / 2 : W * (0.27 + 0.46 * (i % 2)), ry = Math.floor(i / cols); objs.push({ ...mkO('', w, cx - wordLen(w, bs) / 2, H * 0.4 + ry * bs * 1.6, bs, 'opt', col(i % 2)), w }); });
    if (s.k === 'P') objs.push(mkO('p:' + WD[s.word!].p, '', W / 2 - 46, H * 0.16, 92, 'pic', col(2), 1)); else { speaker(); later(450, () => sp.sayLog(s.word!)); }
  }
}
let timers: number[] = []; const later = (ms: number, f: () => void) => { const tk = task; timers.push(window.setTimeout(() => { if (task === tk) f(); }, ms)); };
function replay() { const s = task!.steps[task!.si]; sp.sayLog(s.k === 'F' ? carrier(s.target!) : s.k === 'B' ? s.syl! : s.word!); }
function next() { const t = task!; if (t.arcade) { t.steps = [arcadeStep()]; t.si = 0; streakN++; setup(); return; } t.si++; if (t.si >= t.steps.length) finish(); else setup(); }
function wrong(o: Obj | null, kind: 'j' | 'w', id: string) { const t = task!; if (o) o.bad = T; au.buzz(); au.vib(30); if (!t.err) { t.err = true; if (!t.daily && !t.arcade) mark(S.prog, kind, id, false); } if (t.daily) { S.daily.streak = 0; S.daily.ok = 0; persist(); later(700, () => { task = null; objs = []; mode = 'idle'; auto = false; }); } }
function tap(o: Obj) {
  const t = task!, s = t.steps[t.si]; if (t.lock) return;
  if (o.role === 'ui') { replay(); return; }
  if (s.k === 'T' && o.role === 'touch') { o.tl = 1; o.done = true; sp.sayLog(carrier(o.ch)); au.ping(JI(o.ch)); au.vib(8); if (objs.every((x) => x.role !== 'touch' || x.done)) { t.lock = 1; later(1100, next); } return; }
  if (s.k === 'F' && o.role === 'opt') { if (o.ch === s.target) { o.tl = 1; au.ping(JI(o.ch)); au.vib(10); if (!t.err) mark(S.prog, 'j', o.ch, true); t.lock = 1; later(800, next); } else wrong(o, 'j', s.target!); return; }
  if (s.k === 'B' && o.role === 'tray') { place(o); return; }
  if ((s.k === 'R' || s.k === 'L' || s.k === 'P') && o.role === 'opt') {
    const ok = s.k === 'R' ? o.ch === WD[s.word!].p : o.ch === s.word; if (!ok) { wrong(o, 'w', s.word!); return; }
    o.tl = 1; for (const x of objs) if (x.role === 'word') x.tl = 1; au.chord(wordJamo(s.word!).slice(0, 4).map(JI)); au.vib(12); sp.sayLog(s.word!); if (!t.err) mark(S.prog, 'w', s.word!, true); t.lock = 1; later(1300, next);
  }
}
function place(o: Obj) {
  const t = task!, s = t.steps[t.si], [l, v, tl] = split(s.syl!); let role = '';
  if (!t.fill.includes('l') && o.ch === l) role = 'l'; else if (!t.fill.includes('v') && o.ch === v) role = 'v'; else if (tl && !t.fill.includes('t') && o.ch === tl) role = 't';
  if (!role) { o.x = o.tx; o.y = o.ty; wrong(o, 'j', [l, v, tl].find((j) => j && !t.fill.includes(j === l ? 'l' : j === v ? 'v' : 't')) || l); return; }
  t.fill += role; o.x = o.tx; o.y = o.ty; au.click(); au.ping(JI(o.ch), 0.08); au.vib(10);
  if (t.fill.length === (tl ? 3 : 2)) {
    t.lock = 1; au.chord([l, v, tl].filter(Boolean).map(JI)); if (!t.err && !t.daily && !t.arcade) for (const j of [l, v, tl]) if (j) mark(S.prog, 'j', j, true);
    later(250, () => sp.sayLog(s.syl!));
    if (s.word) { later(900, () => { t.built.push(s.syl!); if (s.last) { const full = [...s.word!].filter(isSyl).length === t.built.length; later(350, () => { if (full) sp.sayLog(s.word!); t.pic = WD[s.word!]?.p && full ? T : 0; if (!t.err && !t.daily) mark(S.prog, 'w', s.word!, true); }); later(full ? 1700 : 500, next); } else next(); }); } else later(1000, next);
  }
}
function finish() {
  const t = task!; objs = []; task = null; timers.forEach(clearTimeout); timers = [];
  if (t.daily) { S.daily.streak = S.daily.ok === 1 && S.daily.date === day() ? S.daily.streak : S.daily.streak + 1; S.daily.ok = 1; persist(); mode = 'idle'; auto = false; idleT = 0; au.ignite(); return; }
  complete(S.prog, t.di, t.li, t.known); S.di = di; persist(); const sl = slots.find((x) => x.kind !== 'secret' && x.i === t.li)!; ign.set(di + ':' + sl.kind + sl.i, T + 0.25); dirty = true; mode = 'reveal'; revealT = 0; au.ignite(); au.vib([10, 60, 10, 40, 30]);
  later2(700, () => sp.sayLog(sl.word)); streakN++; if (streakN >= 6) { auto = false; streakN = 0; }
  if (!S.title && t.di === 0 && t.li === 3) { S.title = 1; titleT = 0.01; document.title = 'Néon'; persist(); }
  const lit = S.prog.lit.reduce((a, b) => a + b, 0); au.setLevel(lit / 120, S.prog.lit.filter((n, i) => n >= DISTRICTS[i].signs.length).length);
}
const later2 = (ms: number, f: () => void) => window.setTimeout(f, ms);
function arcadeStep(): Step { const ss = S.prog.seenW.flatMap((w) => [...w].filter(isSyl)); const s = ss[Math.floor(Math.random() * ss.length)] || '가'; return { k: 'B', syl: s, tray: shuffled([...new Set([...jam(s), ...distractFor(s)])]) }; }
function startArcade() { au.initAudio(); streakN = 0; task = { di, li: -1, steps: [arcadeStep()], si: 0, known: S.prog.known, err: false, fill: '', built: [], lock: 0, arcade: true, pic: 0 }; mode = 'task'; timer = timerMax = 45; setup(); }
function startBlackout() { au.initAudio(); const n = S.prog.lit[di]; if (n < 4) return; bo = { off: new Set(Array.from({ length: Math.min(n, 19) }, (_, i) => i)), target: -1, t: 0, n: 0 }; mode = 'blackout'; timer = timerMax = 60; dirty = true; au.buzz(); boNext(); }
function boNext() { if (!bo) return; const c = [...bo.off]; if (!c.length) { endBlackout(); return; } bo.target = c[Math.floor(Math.random() * c.length)]; const w = slots.find((s) => s.kind === 'sign' && s.i === bo!.target)!.word; later2(250, () => sp.sayLog(w)); }
function endBlackout() { if (!bo) return; S.blackout = Math.max(S.blackout, bo.n); for (const i of bo.off) ign.set(di + ':sign' + i, T + Math.random() * 0.8); bo = null; mode = 'idle'; auto = false; dirty = true; persist(); au.ignite(); }
function goDistrict(n: number) { if (n < 0 || n > 5 || n === di || (n > 0 && S.prog.lit[n - 1] < DISTRICTS[n - 1].signs.length)) return; fadeTo = n; }
// ——— entrées
let down: { x: number; y: number; o: Obj | null; moved: boolean; ox: number; oy: number } | null = null;
const hit = (x: number, y: number) => { for (let i = objs.length - 1; i >= 0; i--) { const o = objs[i]; if (o.role === 'word' || o.role === 'pic') continue; const w = o.w ? wordLen(o.w, o.size) : o.size, m = 12; if (x > o.x - m && x < o.x + w + m && y > o.y - m && y < o.y + o.size + m) return o; } return null; };
const ICON = () => ({ book: { x: 18, y: H - 46 - sab, s: 24 }, day: { x: W - 42, y: H - 46 - sab, s: 24 }, bolt: { x: W / 2 - 12, y: H - 46 - sab, s: 24 }, mute: { x: W - 40, y: 14 + sat, s: 22 } });
let sat = 0, sab = 0;
const inIcon = (i: { x: number; y: number; s: number }, x: number, y: number) => x > i.x - 12 && x < i.x + i.s + 12 && y > i.y - 12 && y < i.y + i.s + 12;
cv.addEventListener('pointerdown', (e) => { au.initAudio(); sp.unlock(); cv.setPointerCapture?.(e.pointerId); const o = mode === 'task' ? hit(e.clientX, e.clientY) : null; down = { x: e.clientX, y: e.clientY, o, moved: false, ox: o ? e.clientX - o.x : 0, oy: o ? e.clientY - o.y : 0 }; });
cv.addEventListener('pointermove', (e) => { if (!down) return; if (Math.hypot(e.clientX - down.x, e.clientY - down.y) > 9) down.moved = true; if (down.o && down.o.role === 'tray' && down.moved && task && !task.lock) { down.o.x = e.clientX - down.ox; down.o.y = e.clientY - down.oy; } });
const up = (e: PointerEvent) => {
  if (!down) return; const d = down; down = null; const x = e.clientX, y = e.clientY, ic = ICON();
  if (mode === 'task') { if (d.o) { if (d.o.role === 'tray' && d.moved) { if (y < H * 0.6) place(d.o); else { /* retour */ } } else if (!d.moved) tap(d.o); } return; }
  if (mode === 'book') { tapBook(x, y); return; }
  if (mode === 'end') { if (endT > 12) { mode = 'idle'; auto = false; } return; }
  if (mode === 'blackout') { const s = slots.find((s) => s.kind === 'sign' && x > s.x - 6 && x < s.x + s.w + 6 && y > s.y - 6 && y < s.y + s.h + 6); if (s && bo) { if (s.i === bo.target) { bo.off.delete(s.i); bo.n++; ign.set(di + ':sign' + s.i, T); dirty = true; au.ignite(); au.vib(12); boNext(); } else if (bo.off.has(s.i)) { au.buzz(); au.vib(30); } } return; }
  if (d.moved) { const dx = x - d.x; if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(y - d.y) * 1.5) goDistrict(di + (dx < 0 ? 1 : -1)); auto = false; return; }
  if (inIcon(ic.book, x, y)) { mode = 'book'; return; }
  if (S.prog.lit[0] >= 20 && S.daily.date !== day() && inIcon(ic.day, x, y)) { startLevel(true); return; }
  if (S.prog.lit[1] >= 20 && inIcon(ic.bolt, x, y)) { startBlackout(); return; }
  if (sp.voiceChecked() && !sp.hasKo && inIcon(ic.mute, x, y)) { hintT = 6; return; }
  const s = slots.find((s) => x > s.x - 6 && x < s.x + s.w + 6 && y > s.y - 6 && y < s.y + s.h + 6);
  if (s) {
    if (s.kind === 'secret') { if (!S.secrets.includes(s.word)) { S.secrets.push(s.word); persist(); ign.set(di + ':secret' + s.i, T); dirty = true; au.ignite(); sp.sayLog(s.word); } else if (s.word === '오락실') startArcade(); else { sp.sayLog(s.word); ign.set(di + ':secret' + s.i, T - 0.5); } return; }
    if (isLit(s)) { sp.sayLog(s.word); ign.set(di + ':' + s.kind + s.i, T - 0.5); au.tick(); auto = false; return; }
    if (s.i === S.prog.lit[di]) { auto = true; streakN = 0; startLevel(); return; }
  }
  if (S.prog.lit[di] < D().signs.length && !auto) { /* un toucher ailleurs ne lance rien */ }
};
cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', () => { down = null; });
window.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') goDistrict(di + 1); if (e.key === 'ArrowLeft') goDistrict(di - 1); if (e.key === 'Escape' && mode === 'book') mode = 'idle'; if (e.key === ' ' && mode === 'idle') { auto = true; startLevel(); } });
// ——— carnet : sans mots
function bookLayout() { const all = [...LEAD, ...VOW], cw = Math.min(34, (W - 36) / 10), y0 = 54 + sat; const js = all.map((j, i) => ({ j, x: (W - cw * 10) / 2 + (i % 10) * cw, y: y0 + Math.floor(i / 10) * (cw + 6), s: cw - 8 })); const ws = S.prog.seenW.filter((w) => WD[w]?.p), pw = Math.min(40, (W - 36) / 8), y1 = y0 + 4 * (cw + 6) + 26; const ps = ws.map((w, i) => ({ w, x: (W - pw * 8) / 2 + (i % 8) * pw, y: y1 + Math.floor(i / 8) * (pw + 4), s: pw - 12 })); return { js, ps, fx: { x: W / 2 - 11, y: H - 44 - sab, s: 22 } }; }
function tapBook(x: number, y: number) { const L = bookLayout(); for (const j of L.js) if (x > j.x - 4 && x < j.x + j.s + 8 && y > j.y - 4 && y < j.y + j.s + 8) { if (S.prog.known.includes(j.j)) { sp.sayLog(carrier(j.j)); au.ping(JI(j.j)); } return; } for (const p of L.ps) if (x > p.x - 4 && x < p.x + p.s + 8 && y > p.y - 4 && y < p.y + p.s + 8) { sp.sayLog(p.w); au.tick(); return; } if (inIcon(L.fx, x, y)) { S.lowfx = !S.lowfx; persist(); resize(); return; } mode = 'idle'; auto = false; }
// ——— dessin
function drawTask() {
  const t = task!, s = t.steps[t.si];
  if (s.k === 'B') { // le cadre guide : voyelles verticales à droite, horizontales dessous, finale en bas
    const Fs = Math.min(190, W * 0.5), fx = W / 2 - Fs / 2, fy = H * 0.3, [, v, tl] = split(s.syl!), sl = hslots(v, !!tl); g.save(); g.strokeStyle = 'rgba(150,165,195,.3)'; g.lineWidth = 1.5; g.setLineDash([3, 6]); g.strokeRect(fx - 10, fy - 10, Fs + 20, Fs + 20);
    const boxes: [string, number[]][] = [['l', sl.l], ['v', sl.v2 ? [Math.min(sl.v[0], sl.v2[0]), Math.min(sl.v[1], sl.v2[1]), Math.max(sl.v[2], sl.v2[2]), Math.max(sl.v[3], sl.v2[3])] : sl.v]]; if (sl.t) boxes.push(['t', sl.t]);
    g.setLineDash([]); for (const [r, b] of boxes) if (!t.fill.includes(r)) { g.strokeStyle = `rgba(170,185,215,${0.16 + 0.07 * Math.sin(T * 3)})`; g.lineWidth = 1.2; rr(fx + b[0] * Fs + 3, fy + b[1] * Fs + 3, (b[2] - b[0]) * Fs - 6, (b[3] - b[1]) * Fs - 6, 8); g.stroke(); } g.restore();
    if (t.fill) tube(g, `s:${s.syl}:${t.fill}`, fx, fy, Fs, col(0), t.fill.length === (tl ? 3 : 2) ? 1 : 0.9, Fs * 0.07, true, 0);
  }
  if (t.built.length) { const w = t.built.join(''), bs = Math.min(40, (W - 60) / Math.max(3, [...(s.word || w)].length) / 1.12); word(g, w, W / 2 - wordLen(s.word && [...s.word].filter(isSyl).length >= t.built.length ? [...s.word].filter(isSyl).join('') : w, bs) / 2, H * 0.2, bs, col(0), 1); }
  if (t.pic && s.word && WD[s.word]?.p) { const k = Math.min(1, (T - t.pic) * 4); tube(g, 'p:' + WD[s.word].p, W / 2 - 50, H * 0.4, 100, col(2), k, 6, false, 0); }
  for (const o of objs) {
    o.x += (o.tx - o.x) * (down?.o === o && down.moved ? 0 : 0.2); o.y += (o.ty - o.y) * (down?.o === o && down.moved ? 0 : 0.2); o.lit += (o.tl - o.lit) * 0.25; const fl = o.bad && T - o.bad < 0.45 ? (Math.floor((T - o.bad) * 24) % 2 ? 0.9 : 0.1) : -1; const lit = fl >= 0 ? fl : o.lit; const c = fl >= 0 ? '#ff5a4d' : o.col;
    if (t.pic && o.role !== 'ui') continue;
    if (o.w) word(g, o.w, o.x, o.y, o.size, c, lit, false); else if (o.role === 'word') word(g, o.ch, o.x, o.y, o.size, c, lit); else tube(g, o.key, o.x, o.y, o.size, c, o.role === 'ui' ? 0.5 + 0.2 * Math.sin(T * 2) : lit, o.role === 'ui' ? 2 : Math.max(2, o.size * 0.075), o.size > 50);
  }
}
function rr(x: number, y: number, w: number, h: number, r: number) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function drawBook() { const L = bookLayout(); for (const j of L.js) { const st = S.prog.jam[j.j] ?? 2, kn = S.prog.known.includes(j.j); tube(g, 'j:' + j.j, j.x + 4, j.y, j.s, isVowel(j.j) ? '#35e0ff' : '#ff5fa8', kn ? 0.25 + 0.75 * (st / 5) : 0, 2, false, kn ? 1 : 0.35); } for (const p of L.ps) tube(g, 'p:' + WD[p.w].p, p.x + 6, p.y, p.s, '#ffcf70', 0.3 + 0.7 * ((S.prog.wrd[p.w] ?? 2) / 5), 1.6); g.strokeStyle = S.lowfx ? 'rgba(160,170,190,.5)' : '#9fb4d8'; g.lineWidth = 2; g.beginPath(); g.arc(L.fx.x + 11, L.fx.y + 11, 9, 0, 7); g.stroke(); if (!S.lowfx) { g.fillStyle = '#9fb4d8'; g.beginPath(); g.arc(L.fx.x + 11, L.fx.y + 11, 9, -1.57, 1.57); g.fill(); } }
function drawEnd() {
  const k = Math.min(1, endT / 9), off = k * k * (3 - 2 * k) * H * 0.9; let seed = 7; const r = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < 520; i++) { const x = r() * W, y = r() * H * 1.9 - H * 0.9 + off, c = r(); if (y < 0 || y > H) continue; g.fillStyle = c < 0.4 ? 'rgba(255,214,150,.8)' : c < 0.7 ? 'rgba(170,205,255,.7)' : DISTRICTS[i % 6].col[i % 3]; g.globalAlpha = 0.35 + 0.65 * r(); g.fillRect(x, y, 2 + r() * 2, 2 + r() * 3); } g.globalAlpha = 1;
  DISTRICTS.forEach((d, i) => { const bs = 20, x = W * (0.16 + 0.68 * ((i * 0.37) % 1)), y = H * 0.9 - i * H * 0.13 + off - H * 0.9 + H * 0.75; if (y > -30 && y < H) word(g, d.name, x - wordLen(d.name, bs) / 2, y, bs, d.col[0], 1); });
  g.textAlign = 'center'; g.fillStyle = '#fff'; if (endT > 6) { g.globalAlpha = Math.min(1, (endT - 6) / 2); g.font = `200 ${Math.min(40, W * 0.09)}px Inter, sans-serif`; g.fillText('Tu sais lire.', W / 2, H * 0.34); } if (endT > 10.5) { g.globalAlpha = Math.min(1, (endT - 10.5) / 2) * 0.8; g.font = `200 ${Math.min(22, W * 0.05)}px Inter, sans-serif`; g.fillText('28 février.', W / 2, H * 0.34 + 46); } g.globalAlpha = 1;
}
let last = 0;
function loop(now: number) {
  requestAnimationFrame(loop); const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now; T += dt;
  if (fadeTo >= 0) { fade -= dt * 2.2; if (fade <= 0) { di = fadeTo; S.di = di; fadeTo = -1; slots = layout(di, W, H); dirty = true; persist(); } } else if (fade < 1) fade = Math.min(1, fade + dt * 1.6);
  if (mode === 'idle') { idleT += dt; if (S.prog.lit.every((n, i) => n >= DISTRICTS[i].signs.length) && !S.ended) { S.ended = 1; persist(); mode = 'end'; endT = 0; } else if (auto && idleT > (S.prog.lit[0] ? 2.4 : 1.2) && S.prog.lit[di] < D().signs.length && fadeTo < 0 && fade >= 1) startLevel(); else if (auto && S.prog.lit[di] >= D().signs.length && di < 5 && idleT > 4) { goDistrict(di + 1); idleT = 0; } } else idleT = 0;
  if (mode === 'reveal') { revealT += dt; if (revealT > 2.3) mode = 'idle'; }
  if (mode === 'end') endT += dt;
  if (timer > 0 && (mode === 'blackout' || task?.arcade)) { timer -= dt; if (timer <= 0) { if (mode === 'blackout') endBlackout(); else { S.arcade = Math.max(S.arcade, streakN); persist(); task = null; objs = []; mode = 'idle'; auto = false; } } }
  if (titleT > 0) { titleT += dt; if (titleT > 5) titleT = 0; } if (hintT > 0) hintT -= dt;
  const dim = mode === 'task' ? 0.22 : mode === 'book' ? 0.04 : mode === 'end' ? 0 : 1; sceneA += (dim - sceneA) * Math.min(1, dt * 5);
  if (dirty) { dirty = false; ga.setTransform(sc, 0, 0, sc, 0, 0); albedo(ga, di, W, H, slots, isLit); post.upload('A', A); }
  g.setTransform(sc, 0, 0, sc, 0, 0); g.globalAlpha = 1; g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
  const total = S.prog.lit.reduce((a, b) => a + b, 0) / 120;
  if (sceneA > 0.01 && mode !== 'end') { g.save(); g.globalAlpha = 1; const a = sceneA * fade; emissive(g, slots, (s) => litLevel(s) * a, W, H, total * a, T);
    if (mode === 'idle' || mode === 'reveal') { const nx = slots.find((s) => s.kind !== 'secret' && s.i === S.prog.lit[di]); if (nx && mode === 'idle') { const p = 0.1 + 0.09 * Math.sin(T * 2.4); if (nx.pic) tube(g, 'p:' + nx.pic, nx.px, nx.py, nx.ps, '#b8c6e6', p * fade, 1.3, false, 0); word(g, nx.word, nx.tx, nx.ty, nx.bs, '#b8c6e6', p * fade, nx.vert, 0.12, 0); } }
    if (bo && bo.target >= 0) { const s = slots.find((x) => x.kind === 'sign' && x.i === bo!.target)!; if (WD[s.word]?.p) tube(g, 'p:' + WD[s.word].p, W / 2 - 34, H * 0.84, 68, col(2), 1, 4, false, 0); }
    // un scooter passe
    scT -= dt; if (scT < 0 && total > 0.03) { scT = 30 + Math.random() * 40; scooter = 0; } if (scooter >= 0) { scooter += dt / 3.2; const x = -40 + scooter * (W + 80), y = H * GY - 9; g.fillStyle = 'rgba(255,236,190,.95)'; g.beginPath(); g.arc(x, y, 2.6, 0, 7); g.fill(); g.fillStyle = 'rgba(255,60,50,.8)'; g.fillRect(x - 24, y + 1, 3, 2); if (scooter > 1) scooter = -1; }
    g.restore(); }
  if (mode === 'task' && task) drawTask(); if (mode === 'book') drawBook(); if (mode === 'end') drawEnd();
  if (timer > 0 && timerMax) { g.fillStyle = col(2); g.fillRect(W * 0.1, 10 + sat, W * 0.8 * (timer / timerMax), 2.5); }
  if (titleT > 0) { const a = Math.min(1, titleT / 0.8, (5 - titleT) / 1.2), s = Math.min(64, W * 0.15), x0 = W / 2 - s * 2.2; 'NEON'.split('').forEach((c, i) => tube(g, 'l:' + c, x0 + i * s * 1.12, H * 0.4, s, i % 2 ? col(1) : col(0), a * (Math.floor(titleT * 20) % 7 === 0 && titleT < 1.2 ? 0.2 : 1), s * 0.09, true, 0)); }
  if (mode === 'idle' || mode === 'reveal') { const ic = ICON(), a = 0.34 * fade; tube(g, 'p:book', ic.book.x, ic.book.y, ic.book.s, '#9fb4d8', a, 1.6, false, 0); if (S.prog.lit[0] >= 20 && S.daily.date !== day()) tube(g, 'p:day', ic.day.x, ic.day.y, ic.day.s, '#ffcf70', a + 0.2 * Math.sin(T * 2), 1.6, false, 0); else if (S.daily.streak > 0) for (let i = 0; i < Math.min(7, S.daily.streak); i++) { g.fillStyle = 'rgba(255,207,112,.6)'; g.fillRect(W - 22 - i * 7, H - 34 - sab, 3, 3); } if (S.prog.lit[1] >= 20) tube(g, 'p:bolt', ic.bolt.x, ic.bolt.y, ic.bolt.s, '#ffe14d', a, 1.6, false, 0); if (sp.voiceChecked() && !sp.hasKo) tube(g, 'p:mute', ic.mute.x, ic.mute.y, ic.mute.s, '#ff8a7a', 0.6, 1.6, false, 0); }
  if (hintT > 0) { g.globalAlpha = Math.min(1, hintT); g.fillStyle = '#dfe6f5'; g.textAlign = 'center'; g.font = '200 12px Inter, sans-serif'; g.fillText('Réglages › Accessibilité › Contenu énoncé › Voix › Coréen', W / 2, 54 + sat); g.globalAlpha = 1; }
  post.upload('E', E); post.frame(T, GY, mode === 'end' ? 0.5 : 1, S.lowfx ? 0.4 : 1, 0.03 + total * 0.05);
  au.musicTick();
}
const safe = document.getElementById('safe')!; const rs = () => { const cs = getComputedStyle(safe); sat = parseFloat(cs.paddingTop) || 0; sab = parseFloat(cs.paddingBottom) || 0; resize(); };
window.addEventListener('resize', rs); rs(); au.setLevel(S.prog.lit.reduce((a, b) => a + b, 0) / 120, S.prog.lit.filter((n, i) => n >= DISTRICTS[i].signs.length).length);
document.fonts?.load('200 20px Inter'); requestAnimationFrame(loop);
document.addEventListener('visibilitychange', () => { if (document.hidden) persist(); });
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('./sw.js').catch(() => { /* */ });
(window as unknown as { __t: unknown }).__t = { S, sp, get mode() { return mode; }, get task() { return task; }, get objs() { return objs; }, get slots() { return slots; }, get di() { return di; }, startLevel, startBlackout, startArcade, goDistrict, tap, place, finish, setMode: (m: typeof mode) => { mode = m; endT = 0; }, redraw: () => { dirty = true; slots = layout(di, W, H); }, setDi: (n: number) => { di = n; slots = layout(di, W, H); dirty = true; }, noAuto: () => { auto = false; } };
