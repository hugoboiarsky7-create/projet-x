import '@fontsource/inter/latin-200.css';
import { TU } from './tuning';
import { Course, type Series, type Extra } from './world';
import { launch, step, type Ball, type Ev } from './physics';
import { humanPar } from './solver';
import { draw, bookLayout, type State, type Mk } from './render';
import { MARKS, dayOf } from './marks';
import { S, load, persist, localDay } from './save';
import * as au from './audio';
import * as live from './live';
import main from './data/m.json';
import holesJ from './data/holes.json';

const cv = document.getElementById('c') as HTMLCanvasElement, g = cv.getContext('2d', { alpha: false })!;
const HJ = holesJ as { flat: Record<string, number>; pars: Record<string, number> };
const series: Record<string, Series> = { m: main as Series };
load();
const key = (cid: string, day: number) => cid + Math.round(day * 100) / 100;
function build(cid: string) {
  let ser = series[cid]; let extra: Extra[] = [];
  if (cid === 'm') { let p = ser.p.concat(S.ext); if (S.hourlyFrom) p = p.slice(0, S.hourlyFrom - ser.d0); ser = { d0: ser.d0, p }; extra = S.hr.filter((e) => e.day >= (S.hourlyFrom || 1e9)); }
  return new Course(cid, ser, extra, HJ.flat, { ...HJ.pars, ...S.pars }, cid === 'm');
}
const A: State & { last: { x: number; y: number }; ts: number; sess: number; wet: number; winter: number; full: boolean; rested: boolean; skipped: boolean; pend: boolean; hot: boolean } = {
  c: build('m'), cid: 'm', W: 0, H: 0, dpr: 1, t: 0, top: 0, bot: 0, v: { x: 0, y: 0, s: 1 }, base: 0, ball: { x: 0, y: 0 }, fly: null, st: 'aim', hole: 0, strokes: 0,
  aim: { on: false, p: 0, ang: 0, px: 0, py: 0 }, preview: [], trail: [], marks: [], tracks: new Set(), sink: 0, ov: { on: false, z: 1, x: 0 }, book: 0, toast: { s: '', t: 0 }, titleT: 0, endT: 0, dark: 0, wx: [0, 0, 0, 0, 0, 0, 0], streakShow: false, fade: 0,
  last: { x: 0, y: 0 }, ts: 1, sess: 0, wet: 0, winter: 0, full: false, rested: false, skipped: false, pend: false, hot: false,
};
let bookOpen = false, tv = { x: 0, y: 0, s: 1 };
function placeMarks() {
  const c = A.c; A.marks = [];
  for (const def of MARKS) {
    if (def.c !== A.cid) continue; let x = c.xOfDay(dayOf(def.date)), y = 0; if (dayOf(def.date) > c.pts[c.pts.length - 1].day + 1) continue;
    if (def.id === 'pizza') x = 9;
    if (def.at === 'lake' || def.at === 'float') { let best: [number, number] | null = null; for (const l of c.lakes) if (!best || Math.abs((l[0] + l[1]) / 2 - x) < Math.abs((best[0] + best[1]) / 2 - x)) best = l; if (!best || Math.abs((best[0] + best[1]) / 2 - x) > 900) continue; x = (best[0] + best[1]) / 2 + (def.at === 'float' ? (best[1] - best[0]) * 0.18 : 0); if (def.at === 'lake') { let m = x; for (let q = best[0] + 6; q < best[1] - 6; q += 2) if (c.gy(q) < c.gy(m)) m = q; x = m; y = c.gy(m) + 1; } else y = TU.WL; }
    else { for (const h of c.holes) if (Math.abs(h.cup - x) < 20 || Math.abs(h.tee - x) < 12) x = h.cup + (def.big ? 60 : 27); if (c.wet(x)) x += 60; y = c.gy(x) + (def.at === 'sky' ? 128 : 0); }
    A.marks.push({ def, x, y, hit: 0 });
  }
}
function enter(cid: string, first = false) {
  if (!first) { S.pos[A.cid] = { x: A.ball.x, n: A.strokes }; S.tracks[A.cid] = [...A.tracks].slice(-500); }
  A.cid = cid; S.cur = cid; A.c = build(cid); const c = A.c; A.tracks = new Set(S.tracks[cid] || []);
  const p = S.pos[cid]; const x0 = p ? Math.min(p.x, c.xEnd) : c.holes[0].tee; A.hole = c.holeAt(x0); A.strokes = p ? p.n : 0;
  c.openCup(A.hole); A.ball.x = x0; A.ball.y = c.gy(x0) + TU.R; A.last = { ...A.ball }; A.fly = null; A.st = A.hole >= c.holes.length ? 'end' : 'aim'; A.endT = A.st === 'end' ? 0.01 : 0; placeMarks(); ensurePar(); frame(true); A.fade = 0; persist();
}
function ensurePar() { const c = A.c, h = c.holes[A.hole]; if (!h || h.par) return; h.par = humanPar(c, A.hole, 3, true); S.pars[key(A.cid, h.day)] = h.par; c.openCup(A.hole); }
function frame(snap = false) {
  const c = A.c, h = c.holes[A.hole], W = A.W, H = A.H; if (!W) return; const land = W > H; A.base = H * (land ? 0.66 : 0.6);
  let x0: number, x1: number;
  if (h) { x0 = Math.min(A.ball.x, h.tee) - 34; x1 = h.cup + 38; } else { x0 = c.xEnd - 120; x1 = c.xEnd + 230; }
  let s = W / (x1 - x0); const smax = land ? H / 300 : Math.max(1.05, W / 330); s = Math.min(s, smax);
  let lo = 1e9, hi = -1e9; for (let x = x0; x <= x1; x += 6) { const y = c.gy(x); if (y < lo) lo = y; if (y > hi) hi = y; }
  if (!h) lo = Math.max(lo, c.yEnd - 110);
  const span = hi - lo + 90; if (span * s > H * 0.6) s = (H * 0.6) / span;
  tv = { x: (x0 + x1) / 2, y: (lo + hi) / 2 - (land ? 0 : 6), s }; if (snap) A.v = { ...tv };
}
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5), W = window.innerWidth, H = window.innerHeight; A.W = W; A.H = H; A.dpr = dpr; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  const sf = document.getElementById('safe')!, cs = getComputedStyle(sf); A.top = parseFloat(cs.paddingTop) || 0; A.bot = parseFloat(cs.paddingBottom) || 0; frame(true);
}
function toast(s: string) { A.toast = { s, t: 4 }; }
function ach(id: string, name: string) { if (S.ach[id]) return; S.ach[id] = Date.now(); toast(name); au.tone(A.c.ptAt(A.ball.x).day, 0, 7, 0.5, 0.3); persist(); }
function unlock(b: string) { if (!S.balls.includes(b)) { S.balls.push(b); toast('○'); persist(); } }
function shoot() {
  const a = A.aim, v = TU.VMIN + a.p * (TU.VMAX - TU.VMIN); A.last = { ...A.ball }; A.fly = launch(A.ball.x, A.ball.y + 0.2, Math.cos(a.ang) * v, Math.sin(a.ang) * v);
  A.st = 'fly'; A.strokes++; S.total++; A.trail = []; A.full = a.p >= 0.985; A.rested = false; A.skipped = false; au.swing(a.p); au.buzz(8); if (S.lastPlay !== localDay()) { S.lastPlay = localDay(); }
}
function holed() {
  const c = A.c, h = c.holes[A.hole], k = key(A.cid, h.day), par = h.par || 3, d = A.strokes - par, day = h.day, sf = c.surf(h.cup - 10);
  A.st = 'sink'; A.sink = 0; A.fly = null; A.ball = { x: h.cup, y: h.cy - TU.CUPD + TU.R }; S.holes++; S.rel += d; A.sess++;
  au.cupSound(); au.buzz([14, 40, 22]); au.tone(day, sf, 0, 0.7, 0.05); au.tone(day, sf, 3, 0.55, 0.22); au.tone(day, sf, 5, 0.5, 0.42); if (d < 0) au.tone(day, sf, 7, 0.5, 0.66);
  if (A.strokes === 1) { if (!S.hio.includes(k)) S.hio.push(k); let cliff = false; for (let x = h.tee; x < h.cup; x += 4) if (c.surf(x) === 6) cliff = true; if (cliff) unlock('obs'); if (A.full && !A.rested) ach('lev', 'Levier ×40'); }
  if (d === -1) ach('birdie', 'Birdie'); if (d <= 0) { S.clean++; if (S.clean > S.bestClean) S.bestClean = S.clean; if (S.clean >= 10) unlock('gold'); } else S.clean = 0;
  if (A.sess >= 59) ach('bondues', 'Bondues');
  const winter = sf === 3 || sf === 4; if (winter) A.winter++; else { if (A.winter >= 12) ach('hodl', 'HODL'); A.winter = 0; }
  if (h.hourly) { const td = localDay(); if (S.lastPlay !== td || !S.streak) { S.streak = S.lastPlay === localDay(-1) || S.lastPlay === td ? S.streak + 1 : 1; } S.lastPlay = td; }
  A.wet = 0; persist(true);
}
function nextHole() {
  const c = A.c; A.hole++; A.strokes = 0; c.openCup(A.hole); A.ball.y = c.gy(A.ball.x) + TU.R; A.last = { ...A.ball };
  if (A.hole >= c.holes.length) { A.st = 'end'; A.endT = 0.01; if (A.cid === 'm') { if (!S.hourlyFrom) S.hourlyFrom = Math.floor(c.pts[c.pts.length - 1].day) + 1; if (!S.ended) { S.ended = 1; setTimeout(() => ach('bob', 'Bob, à l’heure.'), 5000); } sync(); } }
  else { A.st = 'aim'; ensurePar(); if (A.hole === 2 && A.cid === 'm' && !S.title) { S.title = 1; A.titleT = 0.01; document.title = 'Long Game'; } }
  S.pos[A.cid] = { x: A.ball.x, n: 0 }; frame(); persist();
}
function penalty(kind: string) {
  A.fly = null; A.ball = { ...A.last }; A.st = 'aim'; A.strokes++; S.total++;
  if (kind === 'water') { au.splash(); au.buzz(30); if (++A.wet >= 5) ach('liq', 'Liquidé'); } frame(); persist();
}
const evs: Ev[] = [];
function tick() {
  const c = A.c, b = A.fly; if (!b) return; evs.length = 0; const h = c.holes[A.hole] || null;
  const r = step(c, h, b, evs); const day = c.ptAt(b.x).day;
  for (const e of evs) {
    if (e.k === 'hit') { au.hit(e.s, e.v); if (e.v > 70) { au.tone(day, e.s, Math.floor(Math.random() * 6) + (e.v > 220 ? 3 : 0), Math.min(0.6, 0.15 + e.v / 600)); au.buzz(Math.min(14, 3 + e.v / 40)); } if (e.s === 2 || e.s === 3) A.tracks.add(c.ix(e.x)); }
    else if (e.k === 'roll') { if (e.s === 2 || e.s === 3) A.tracks.add(c.ix(e.x)); }
    else if (e.k === 'skip') { au.skip(); A.skipped = true; unlock('sky'); }
  }
  A.trail.push(b.x, b.y); if (A.trail.length > 28) A.trail.splice(0, 2);
  for (const m of A.marks) { const my = m.y + (m.def.at === 'sky' ? 0 : m.def.big ? 10 : 5); if (Math.abs(b.x - m.x) < (m.def.big ? 16 : 8) && Math.abs(b.y - my) < (m.def.big ? 14 : 9) && A.t - m.hit > 2) { m.hit = A.t; au.tone(day, 5, 4 + (MARKS.indexOf(m.def) % 5), 0.6); au.tone(day, 5, 9 + (MARKS.indexOf(m.def) % 3), 0.35, 0.18); au.buzz(18); if (!S.found.includes(m.def.id)) { S.found.push(m.def.id); persist(); } if (m.def.to) { A.pend = true; const to = m.def.to; setTimeout(() => travel(to), 700); } } }
  if (r === 'in') holed(); else if (r === 'rest') { A.ball = { x: b.x, y: b.y }; A.fly = null; A.st = 'aim'; A.rested = true; S.pos[A.cid] = { x: b.x, n: A.strokes }; frame(); persist(); }
  else if (r) penalty(r);
}
async function travel(to: string) {
  A.pend = false; if (!series[to]) { try { series[to] = (await (to === 'e' ? import('./data/e.json') : to === 'd' ? import('./data/d.json') : import('./data/x.json'))).default as Series; } catch { return; } }
  if (!S.courses.includes(to)) S.courses.push(to); if (A.fly) { A.fly = null; A.ball = { ...A.last }; A.strokes = Math.max(0, A.strokes - 1); S.total--; }
  A.fade = -0.6; enter(to);
}
// données récentes
let syncing = false, pendingBuild = false;
async function sync() {
  if (syncing) return; syncing = true;
  try {
    const m = series.m;
    if (!S.hourlyFrom) { const from = m.d0 + m.p.length + S.ext.length, last = S.ext.length ? S.ext[S.ext.length - 1] : m.p[m.p.length - 1]; const add = await live.daily(from, last); if (add.length) { S.ext = S.ext.concat(add); pendingBuild = true; } }
    else { const have = S.hr.length ? S.hr[S.hr.length - 1].day + 1 : S.hourlyFrom; const add = await live.hourly(have); if (add.length) { S.hr = S.hr.concat(add).slice(-400); pendingBuild = true; } }
    persist();
  } catch { /* hors ligne */ }
  syncing = false;
}
function applyBuild() { if (!pendingBuild || A.cid !== 'm' || A.fly || A.st === 'sink') return; pendingBuild = false; const x = A.ball.x, n = A.strokes; S.pos.m = { x, n }; A.c = build('m'); const c = A.c; A.hole = c.holeAt(x); c.openCup(A.hole); A.ball.y = c.gy(x) + TU.R; A.last = { ...A.ball }; A.st = A.hole >= c.holes.length ? 'end' : 'aim'; if (A.st === 'aim') A.endT = 0; placeMarks(); ensurePar(); frame(); }
// entrées
const ptrs = new Map<number, { x: number; y: number }>(); let drag: { x: number; y: number; id: number; moved: boolean } | null = null, pinch: { d: number; z: number; mx: number; x: number } | null = null;
function updAim(x: number, y: number) {
  if (!drag) return; const dx = drag.x - x, dy = drag.y - y, len = Math.hypot(dx, dy); if (len > 6) drag.moved = true;
  A.aim.on = len > 10 && A.st === 'aim' && !A.ov.on; A.aim.p = Math.min(1, Math.max(0, (len - 10) / TU.AIM_FULL)); A.aim.ang = Math.atan2(-dy, dx);
  A.preview = []; if (!A.aim.on) return; const v = TU.VMIN + A.aim.p * (TU.VMAX - TU.VMIN), b = launch(A.ball.x, A.ball.y + 0.2, Math.cos(A.aim.ang) * v, Math.sin(A.aim.ang) * v);
  for (let i = 0; i < TU.PREVIEW_T / TU.DT; i++) { if (step(A.c, null, b, null)) break; if (i % 3 === 2) A.preview.push(b.x, b.y); }
}
const canOv = () => S.holes >= 50 || A.hole >= 50;
cv.addEventListener('pointerdown', (e) => {
  au.initAudio(); cv.setPointerCapture?.(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (ptrs.size === 2) { drag = null; A.aim.on = false; if (canOv() && !bookOpen) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), z: A.ov.on ? A.ov.z : 1, mx: (a.x + b.x) / 2, x: A.ov.on ? A.ov.x : A.v.x }; } return; }
  drag = { x: e.clientX, y: e.clientY, id: e.pointerId, moved: false };
});
cv.addEventListener('pointermove', (e) => {
  const p = ptrs.get(e.pointerId); if (!p) return; p.x = e.clientX; p.y = e.clientY;
  if (pinch && ptrs.size === 2) { const [a, b] = [...ptrs.values()], d = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2; setOv(pinch.z * (d / pinch.d), pinch.x - (mx - pinch.mx) / (A.v.s * Math.max(0.01, A.ov.z))); pinch.mx = mx; pinch.x = A.ov.x; return; }
  if (!drag || drag.id !== e.pointerId) return;
  if (A.ov.on) { A.ov.x -= e.movementX / (A.v.s * A.ov.z); clampOv(); drag.moved = true; return; }
  if (!bookOpen) updAim(e.clientX, e.clientY);
});
const up = (e: PointerEvent) => {
  ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; if (!drag || drag.id !== e.pointerId) return; const d = drag; drag = null;
  if (bookOpen) { tapBook(e.clientX, e.clientY); return; }
  if (A.ov.on) return;
  if (A.aim.on && A.aim.p > 0.02 && A.st === 'aim' && !A.pend) shoot(); else if (!d.moved && e.clientY < A.top + 76 && Math.abs(e.clientX - A.W / 2) < 90) bookOpen = true;
  A.aim.on = false; A.preview = [];
};
cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
function clampOv() { const lo = TU.XMIN + 100, hi = A.ball.x; A.ov.x = Math.min(hi, Math.max(lo, A.ov.x)); }
function setOv(z: number, x: number) { const zmin = Math.min(0.5, (A.W * 0.86) / Math.max(600, A.ball.x + 200) / A.v.s); z = Math.min(1.05, Math.max(zmin, z)); if (z >= 0.97) { A.ov.on = false; A.ov.z = 1; return; } if (!A.ov.on) { A.ov.on = true; x = A.ball.x - A.W / 2 / (A.v.s * z) * 0.7; } A.ov.z = z; A.ov.x = x; clampOv(); }
cv.addEventListener('wheel', (e) => { e.preventDefault(); if (!canOv() || bookOpen) return; if (e.ctrlKey || Math.abs(e.deltaY) > Math.abs(e.deltaX)) setOv((A.ov.on ? A.ov.z : 1) * Math.exp(-e.deltaY * 0.004), A.ov.on ? A.ov.x : A.v.x); else if (A.ov.on) { A.ov.x += e.deltaX / (A.v.s * A.ov.z); clampOv(); } }, { passive: false });
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') { bookOpen = false; A.ov.on = false; } });
function tapBook(x: number, y: number) {
  const L = bookLayout(A.W, A.H, A.top);
  for (const b of L.balls) if (Math.hypot(x - b.x, y - b.y) < 20 && S.balls.includes(b.id)) { S.ball = b.id; persist(); return; }
  for (const c of L.crs) if (Math.hypot(x - c.x, y - c.y) < 20 && S.courses.includes(c.id)) { bookOpen = false; if (c.id !== A.cid && !A.fly) travel(c.id); return; }
  for (const c of L.cells) if (Math.hypot(x - c.x, y - c.y) < L.cw / 2 && S.found.includes(c.id)) { au.tone(A.c.ptAt(A.ball.x).day, 5, 4 + (L.cells.indexOf(c) % 6), 0.5); return; }
  bookOpen = false;
}
// boucle
let lastT = 0, acc = 0;
function loop(now: number) {
  requestAnimationFrame(loop); const dt = Math.min(0.05, (now - lastT) / 1000 || 0); lastT = now; A.t += dt; A.fade += dt * 1.2;
  if (A.fly) { const h = A.c.holes[A.hole], b = A.fly; const near = h && Math.abs(b.x - h.cup) < 30 && Math.abs(b.y - h.cy) < 40 && Math.hypot(b.vx, b.vy) < 260; A.ts += ((near ? 0.62 : 1) - A.ts) * 0.15; acc += dt * A.ts; let n = 0; while (acc >= TU.DT && A.fly && n++ < 12) { tick(); acc -= TU.DT; } if (!A.fly) acc = 0; }
  if (A.st === 'sink') { A.sink += dt; if (A.sink > 0.75) nextHole(); }
  if (A.titleT > 0) { A.titleT += dt; if (A.titleT > 7) A.titleT = 0; } if (A.endT > 0) A.endT += dt; if (A.toast.t > 0) A.toast.t -= dt;
  A.book += ((bookOpen ? 1 : 0) - A.book) * Math.min(1, dt * 10); applyBuild();
  // caméra
  const k = 1 - Math.exp(-dt * (A.st === 'aim' || A.st === 'end' ? 2.6 : 3.4)); let ts = tv.s, ty = tv.y, tx = tv.x;
  if (A.fly) { const need = (A.fly.y - tv.y) * tv.s, room = A.base - A.top - 70; if (need > room) ts = Math.max(tv.s * 0.5, (room / (A.fly.y - tv.y))); const ex = Math.abs(A.fly.x - tv.x) * ts - A.W * 0.42; if (ex > 0) tx += Math.sign(A.fly.x - tv.x) * ex / ts; }
  A.v.x += (tx - A.v.x) * k; A.v.y += (ty - A.v.y) * k; A.v.s += (ts - A.v.s) * k;
  // ambiance
  const sf = A.c.surf(A.v.x), inkT = sf === 6 ? 1 : 0; A.dark += (inkT - A.dark) * dt * 0.7; for (let i = 0; i < 7; i++) A.wx[i] += (((i === sf || (i === 3 && sf === 4)) ? 1 : 0) - A.wx[i]) * dt * 0.6;
  const hh = A.c.holes[A.hole]; A.streakShow = !!hh && hh.hourly;
  if ((now / 500 | 0) !== ((now - dt * 1000) / 500 | 0)) au.setWind((sf === 5 ? 0.9 : sf === 1 ? 0.15 : sf >= 3 ? 0.6 : 0.35) + (A.st === 'end' ? 0.4 : 0), sf === 5 ? 0.9 : sf === 3 ? 0.2 : 0.45);
  draw(g, A);
}
window.addEventListener('resize', resize); window.addEventListener('orientationchange', () => setTimeout(resize, 200));
document.addEventListener('visibilitychange', () => { if (document.hidden) { S.pos[A.cid] = { x: A.fly ? A.last.x : A.ball.x, n: A.strokes }; S.tracks[A.cid] = [...A.tracks].slice(-500); persist(true); } else sync(); });
resize(); enter('m', true);
if (S.cur !== 'm' && S.courses.includes(S.cur)) travel(S.cur);
sync(); document.fonts?.load('200 20px Inter');
requestAnimationFrame(loop);
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('./sw.js').catch(() => { /* */ });
function jump(k: number) { const c = A.c; A.ball.x = k >= c.holes.length ? c.xEnd : c.holes[k].tee; A.strokes = 0; A.fly = null; enter(A.cid); A.fade = 5; }
(window as unknown as { __t: unknown }).__t = { A, S, enter, travel, shoot, persist, setOv, build, jump };
