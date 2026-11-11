import { TAU, TU } from './tuning';
import { G, C2, txt, vib, fmt, rgba } from './g';
import { A, burst, toast, Overlay } from './app';
import { S, load, persist, today, yesterday } from './save';
import { Sim } from './sim';
import { mkRng, hashStr, wrap, norm, clamp } from './rng';
import '@fontsource/barlow-condensed/latin-500.css';
import '@fontsource/barlow-condensed/latin-600.css';
import '@fontsource/barlow-condensed/latin-700.css';
import '@fontsource/inter/latin-300.css';
import '@fontsource/inter/latin-400.css';
import { post, FX } from './fin';
import { layout, drawHomeWatch, drawRun, drawFx, drawHud, drawCards, drawOverlay, realAngles } from './draw';
import { perksOf, caseK, drawBackCase } from './watch';
import { deathLine, QUARTZ_TAUNTS, WIN_LINES, ACH } from './texts';
import { drawAtelier, drawStats, give, rouLabel } from './screens';
import { Back, drawBack, FLOORS } from './back';
import { shareCard } from './share';
import { CITIES, KANAZAWA, TAKAYAMA } from './cities';

const cv = document.getElementById('c') as HTMLCanvasElement;
const c = cv.getContext('2d', { alpha: false })!;
G.cv = cv; G.c = c;
load(); A.snd.muted = S.mute;

let acc = 0, last = 0, lastFlipT = 0, prevSt: number[] = [], arcSeen = 0, dailyArm = false, autoFlip = 0, lock = 0;
let back: Back | null = null, backOver: null | { line: string; score: number; rou: number; t: number; won: boolean } = null, backAcc = 0;
let ptr: null | { x: number; y: number; swiped: boolean } = null;
const newAch: string[] = [];
const ach = (id: string) => { if (give(id)) newAch.push(ACH[id]); };

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  G.W = window.innerWidth; G.H = window.innerHeight; G.dpr = dpr;
  cv.width = Math.round(G.W * dpr); cv.height = Math.round(G.H * dpr);
  const p = document.getElementById('safe'); if (p) { const cs = getComputedStyle(p); G.st = parseFloat(cs.paddingTop) || 0; G.sb = parseFloat(cs.paddingBottom) || 0; }
  layout();
}
window.addEventListener('resize', resize); window.addEventListener('orientationchange', () => setTimeout(resize, 200)); resize();

function computePA() {
  const t = realAngles(); let best = 0, bd = -1;
  for (let i = 0; i < 72; i++) { const a = (i / 72) * TAU; const d = Math.min(Math.abs(wrap(a - t.h)), Math.abs(wrap(a - t.m)), Math.abs(wrap(a - t.s - 0.6))); if (d > bd) { bd = d; best = a; } }
  A.pA = best;
}
computePA();

function startRun() {
  const daily = dailyArm; dailyArm = false;
  const t = realAngles(), perks = perksOf(S.eq);
  let seed = (Date.now() & 0x7fffffff) >>> 0, secA = t.s, startA = [t.m, t.h];
  if (daily) {
    seed = hashStr('d' + today()); const r = mkRng(seed); secA = r() * TAU; startA = [r() * TAU, r() * TAU]; A.pA = norm(secA + Math.PI);
    if (S.daily.date !== today()) { S.daily.streak = S.daily.date === yesterday() ? S.daily.streak + 1 : 1; S.daily.date = today(); S.daily.score = 0; if (S.daily.streak >= 7) give('d7'); }
  } else {
    const d = Math.min(Math.abs(wrap(A.pA - t.h)), Math.abs(wrap(A.pA - t.m)), Math.abs(wrap(A.pA - t.s)));
    if (d < 0.5) computePA();
  }
  const hr = new Date().getHours();
  A.sim = new Sim({ seed, secA, startA, pA: A.pA, night: hr < 5, daily, perks });
  A.daily = daily; A.overlay = null; A.trail = []; A.ghostRec = []; A.ghostAcc = 0; A.rot = 0; A.parts.length = 0; A.floats.length = 0;
  acc = 0; prevSt = []; arcSeen = 0; lastFlipT = 0; newAch.length = 0; S.runs++; if (S.runs >= 95) give('j95'); persist();
  A.snd.city(); vib(10);
}

function fl(s: string, a: number, col = '#ffffff', px = 15, rad = 0.9) {
  const r = G.R * rad * A.zoom; A.floats.push({ x: G.cx + Math.sin(a + A.rot) * r, y: G.cy - Math.cos(a + A.rot) * r - 14, s, l: 0.9, col, px });
}
function pos(a: number, rad = 0.9): [number, number] { const r = G.R * rad * A.zoom; return [G.cx + Math.sin(a + A.rot) * r, G.cy - Math.cos(a + A.rot) * r]; }

function events(s: Sim) {
  const pal = s.cfg.pal;
  for (const e of s.ev) {
    switch (e.t) {
      case 'tick': {
        let near = 9; for (let i = 0; i < s.plan.hands.length; i++) { const st = s.hSt(i, s.T); if (st === 1 || st === 2) near = Math.min(near, Math.abs(wrap(s.a - s.hAng(i, s.T)))); }
        A.snd.step(e.v!, s.cfg.snow ? 2 : 1, s.cfg, s.ci, clamp(1 - near / 1.2, 0, 1));
        if ((s.has('quartz') || s.perks.quartz) && e.v! % 96 === 60) { A.taunt = QUARTZ_TAUNTS[Math.floor(Math.random() * QUARTZ_TAUNTS.length)]; A.tauntT = 2.2; }
        break;
      }
      case 'flip': A.snd.flip(); lastFlipT = s.time; break;
      case 'index': { A.snd.index(e.v!, s.cfg); const [x, y] = pos(e.a!); burst(x, y, 10, pal.lume, 140); vib(8); if (e.v! > 1) fl('×' + e.v, e.a!, pal.lume, 14); break; }
      case 'graze': { A.snd.graze(); const [x, y] = pos(e.a!); burst(x, y, 14, '#ffffff', 220, 1.8); A.shake = Math.max(A.shake, 4); FX.ca = 0.09; vib(14); fl('FRÔLÉ', e.a!, '#ffffff', 12); S.grazes++; break; }
      case 'perfect': A.snd.perfect(); A.flash = 0.5; A.flashCol = pal.lume; fl('TOUR PARFAIT', 0, pal.lume, 20, 0.3); ach('perfect'); S.perfects++; vib([20, 30, 20]); break;
      case 'city': if (e.v! > 0) { A.snd.city(s.ci); A.flash = 0.7; A.flashCol = s.cfg.pal.hand; vib([15, 40, 30]); } A.cityPrev = e.v! > 0 ? A.cityName : ''; A.cityName = s.cfg.name; A.cityNameT = 2.2; prevSt = []; arcSeen = 0; if (s.cfg.id === 'tak') { S.tak = 1; ach('tak'); } break;
      case 'clear': {
        const idx = CITIES.findIndex((x) => x.id === e.s); if (idx >= 0) { ach('c' + (idx + 1)); S.bestCity = Math.max(S.bestCity, idx + 1); }
        if (e.s === 'kan') { S.kan = 1; ach('kan'); }
        if (s.flipsCity <= 1) ach('hole'); if (s.flipsCity <= 8) ach('eagle'); if (s.flipsCity <= 15) ach('birdie');
        if (s.grazesCity >= 10) ach('graze10'); if (s.has('cacio') && s.nComps() >= 3) ach('pasta'); if (s.maxPim >= 4) ach('mala');
        A.pickT = 0; lock = 0.5; A.snd.quiet(); break;
      }
      case 'rewind': A.snd.rewind(); A.flash = 0.6; A.flashCol = '#ffffff'; fl('RÉSERVE', s.a, '#fff', 14); ach('tenet'); vib(40); A.trail = []; break;
      case 'bounce': A.snd.bounce(); A.shake = 8; fl('VITRE', s.a, '#fff', 14); ach('vitre'); vib(25); break;
      case 'lob': A.snd.lob(); if (s.lobs >= 10) ach('lob'); break;
      case 'eclipse': fl('ÉCLIPSE', s.a, pal.lume, 13); A.snd.chime(); break;
      case 'bounty': A.snd.anvil(); A.flash = 0.4; A.flashCol = '#ffd24a'; fl('BOUNTY', e.a!, '#ffd24a', 18); ach('ko'); vib(40); break;
      case 'piment': A.snd.piment(); fl('PIMENT ×' + e.v, e.a!, '#ff4d2e', 14); vib(15); break;
      case 'tapis': fl(e.v ? 'TAPIS ×3' : 'TAPIS PERDU', 0, e.v ? '#ffd24a' : '#ff4d2e', 20, 0.3); if (e.v) ach('allin'); break;
      case 'shot': fl('SHOT', 0, '#fff', 18, 0.3); break;
      case 'life': fl('+1', s.a, '#fff', 16); break;
      case 'ring': A.snd.click(); break;
      case 'lunette': A.snd.click(); A.flash = 0.25; A.flashCol = '#ffffff'; break;
      case 'death': onDeath(s); break;
      case 'won': finalize(s, true); break;
    }
  }
  s.ev.length = 0;
}

function onDeath(s: Sim) {
  A.snd.death(); A.snd.quiet(); vib([30, 40, 90]); A.shake = 16; FX.ca = 0.15; FX.shock = 0.45;
  const [x, y] = pos(s.a, s.ring ? 0.54 : 0.9); burst(x, y, 46, s.cfg.pal.lume, 320, 3); burst(x, y, 20, s.cfg.pal.hot, 200, 2.4);
  const hT: number[] = [], hA: number[] = []; const HN = s.hT.length;
  for (let k = 0; k < s.hc; k++) { const i = (s.hi - s.hc + k + HN) % HN; hT.push(s.hT[i]); hA.push(s.hA[i]); }
  A.rew = { t: 0, T: s.T, a: s.a, hT, hA }; A.trail = [];
}

function finalize(s: Sim, won: boolean) {
  const perks = s.perks;
  let rou = Math.floor((Math.sqrt(s.score) * TU.rouages.k + s.cleared * TU.rouages.perCity) * (1 + perks.rou) * (perks.quartz ? 0.5 : 1));
  if (won) rou += 150;
  S.rou += rou; S.time += s.time;
  if (!won) { S.deaths++; S.cityDeaths[s.cfg.id] = (S.cityDeaths[s.cfg.id] || 0) + 1; ach('first'); }
  if (s.cause === 'liq') ach('liq');
  if (!won && s.plan.dur - s.T < 1) ach('bulle');
  if (s.enclumes >= 3) ach('enclume');
  if (s.score >= 100000) ach('k100');
  const now = Date.now(); S.recent = S.recent.filter((t) => now - t < 40000); S.recent.push(now); if (!won && S.recent.length >= 5) ach('tilt');
  const best = s.score > S.best;
  if (best) { S.best = s.score; if (!A.daily) S.ghost = A.ghostRec.slice(0, 2400); }
  if (A.daily) S.daily.score = Math.max(S.daily.score, s.score);
  if (won) { S.won++; S.bestCity = Math.max(S.bestCity, 9); if (S.won === 1) autoFlip = 2.6; A.snd.perfect(); A.snd.quiet(); A.flash = 1; A.flashCol = '#ffe7a3'; }
  const o: Overlay = { line: won ? WIN_LINES[Math.min(WIN_LINES.length - 1, S.won - 1)] : deathLine(s, Math.random), score: s.score, best, city: s.cfg.name, time: s.time, rou, won, daily: A.daily, mods: { ...s.mods }, t: 0, cityNo: Math.min(9, s.cityNo), newAch: newAch.splice(0, 3) };
  A.overlay = o; A.sim = null; A.rew = null; A.rot = 0; lock = 0.35; computePA();
  if (!S.seenTitle) { S.seenTitle = true; A.titleT = 0.6; try { document.title = 'CALIBRE 95'; } catch { /* */ } }
  persist();
}

// ——— entrées
function add(x: number, y: number, w: number, h: number, fn: () => void) { A.btns.push({ x, y, w, h, fn }); }
function down(x: number, y: number) {
  A.snd.init();
  for (let i = A.btns.length - 1; i >= 0; i--) { const b = A.btns[i]; if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) { b.fn(); return; } }
  if (A.flipAnim > 0) return;
  if (A.mode === 'dial') {
    const s = A.sim;
    if (A.rew) return;
    if (s && s.state === 'run') { s.press(); ptr = { x, y, swiped: false }; return; }
    if (!s && lock <= 0 && A.boot > 0.3) { autoFlip = 0; startRun(); }
  } else if (A.mode === 'back') {
    if (back && back.state === 'run') back.press();
    else if (backOver && backOver.t > 0.35) { if (backOver.won) leaveBack(); else newBack(); }
  } else if (A.mode === 'desk') { A.mode = 'dial'; }
  else if (A.mode === 'credits') { if (A.credT > 3) { A.mode = 'desk'; } }
}
function up() { ptr = null; A.snd.init(); if (A.sim) A.sim.release(); }
function pickCard(i: number) { const s = A.sim; if (!s || s.state !== 'pick' || A.pickT < 0.55) return; const cd = s.choose(i); if (cd) { if (cd.enclume) A.snd.anvil(); else A.snd.card(); vib(15); A.lastCard = { c: cd, t: 0 }; acc = 0; } }
cv.addEventListener('pointerdown', (e) => { e.preventDefault(); down(e.clientX, e.clientY); }, { passive: false });
cv.addEventListener('pointermove', (e) => { if (ptr && !ptr.swiped && A.sim && Math.abs(e.clientX - ptr.x) > 34) { ptr.swiped = true; A.sim.swipe(Math.sign(e.clientX - ptr.x)); } });
window.addEventListener('pointerup', up); window.addEventListener('pointercancel', up);
for (const ev of ['touchstart', 'touchmove', 'gesturestart', 'contextmenu', 'dblclick']) document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });
window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowUp') { e.preventDefault(); down(-1, -1); }
  else if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') { if (A.sim && A.sim.has('lunette') && A.sim.lunCd <= 0 && A.sim.state === 'run') { A.sim.dir = -A.sim.dir; A.sim.swipe(e.code === 'ArrowLeft' ? -1 : 1); } }
  else if (e.code === 'KeyM') toggleMute();
  else if (/^Digit[1-3]$/.test(e.code)) pickCard(+e.code.slice(5) - 1);
  else if (e.code === 'Digit4' || e.code === 'KeyE') pickCard(-1);
  else if (e.code === 'KeyR') { if (A.sim && A.sim.reroll()) { A.snd.click(); A.pickT = 0.2; } }
  else if (e.code === 'Escape') { if (A.mode === 'back') leaveBack(); else if (A.mode !== 'dial') A.mode = 'dial'; }
});
window.addEventListener('keyup', (e) => { if (e.code === 'Space' || e.code === 'Enter' || e.code === 'ArrowUp') up(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { A.snd.quiet(); last = 0; } });
function toggleMute() { S.mute = !S.mute; A.snd.setMute(S.mute); persist(); }

function newBack() { back = new Back((Date.now() & 0xffffff) + 1); backOver = null; backAcc = 0; }
function enterBack() { A.flipAnim = 0.001; A.flipTo = 'back'; A.overlay = null; newBack(); A.snd.card(); }
function leaveBack() { A.flipAnim = 0.001; A.flipTo = 'dial'; A.snd.card(); }
const BACK_LINES = ['Tombé.', 'Dégrené.', 'Le ressort t\'a rattrapé.', 'Mal engrené.', 'Hors calibre.', 'Tu as lâché trop tôt.', 'Tu as lâché trop tard.', 'Révision complète.'];

// ——— mise à jour
function update(dt: number) {
  G.dt = dt; G.now += dt; A.boot += dt;
  if (lock > 0) lock -= dt;
  const s = A.sim;
  if (A.mode === 'dial') {
    if (s && s.state === 'run') {
      acc += dt; let n = 0;
      while (acc >= TU.DT && n++ < 12) { s.step(); acc -= TU.DT; if (s.state !== 'run') break; }
      if (acc > TU.DT * 4) acc = 0;
      // annonces sonores
      for (let i = 1; i < s.plan.hands.length; i++) { const st = s.hSt(i, s.T); if (st === 2 && prevSt[i] !== 2 && prevSt[i] != null) { if (s.has('repet')) A.snd.chime(); else A.snd.tele(); } prevSt[i] = st; }
      while (arcSeen < s.plan.arcs.length && s.plan.arcs[arcSeen].t0 <= s.T) { const a = s.plan.arcs[arcSeen++]; if (a.kind !== 2 || s.has('repet')) { if (s.has('repet')) A.snd.chime(); else A.snd.tele(); } }
      if (s.time - lastFlipT > 10 && s.time > 10) ach('plan');
      events(s);
      if (A.sim === s && s.state === 'run') {
        A.trail.push(s.a); if (A.trail.length > 12) A.trail.shift();
        A.ghostAcc += dt; if (A.ghostAcc >= 0.2) { A.ghostAcc -= 0.2; A.ghostRec.push(Math.round(norm(s.a) * 100)); }
        let near = 9, na = 0; for (let i = 1; i < s.plan.hands.length; i++) { const st = s.hSt(i, s.T); if (st === 1 || st === 2) { const d = Math.abs(wrap(s.a - s.hAng(i, s.T))); if (d < near) { near = d; na = s.hAng(i, s.T); } } }
        A.snd.whoosh((s.cfg.fog ? 0.3 : 0.06) * clamp(1 - near / 1.1, 0, 1), Math.sin(na + A.rot));
        if (s.has('tourb')) A.rot += dt * 0.4;
        if (s.T > s.plan.spin0) A.rot += dt * Math.min(1.3, 0.2 + (s.T - s.plan.spin0) * 0.11);
      }
    } else {
      if (s) events(s);
      A.idleTk += dt * TU.tickHz; if (A.idleTk >= 1) { A.idleTk -= 1; if (A.boot > 0.3 && !A.rew) A.snd.step(Math.floor(G.now * 8), 0, null, 0, 0); }
      if (s && s.state === 'pick') A.pickT += dt;
    }
    if (A.rew && s) { A.rew.t += dt; if (A.rew.t >= TU.deathAnim) finalize(s, false); }
    if (!A.sim && autoFlip > 0) { autoFlip -= dt; if (autoFlip <= 0) enterBack(); }
    const tz = s && s.has('plan') ? 0.86 : 1; A.zoom += (tz - A.zoom) * Math.min(1, dt * 5);
    if (!s || (!s.has('tourb') && s.T < s.plan.spin0)) A.rot += (0 - A.rot) * Math.min(1, dt * 6);
  } else if (A.mode === 'back' && back) {
    if (back.state === 'run') {
      backAcc += dt; let n = 0; while (backAcc >= TU.DT && n++ < 12) { back.step(); backAcc -= TU.DT; }
      for (const e of back.ev) {
        if (e === 'jump') A.snd.flip(); else if (e === 'catch') { A.snd.index(back.best % 10 + 1, null); vib(8); } else if (e === 'floor') { A.snd.city(); A.flash = 0.4; A.flashCol = '#d9a441'; }
        else if (e === 'death' || e === 'won') {
          const won = e === 'won'; const rou = Math.floor(back.best * 2 + (won ? 200 : 0)); S.rou += rou; S.backBest = Math.max(S.backBest, back.score);
          if (won) { S.backWon++; ach('back'); A.snd.perfect(); A.flash = 1; A.flashCol = '#f2d98a'; } else { A.snd.death(); vib([30, 40, 90]); A.shake = 12; S.deaths++; }
          backOver = { line: won ? 'Remonté.' : BACK_LINES[Math.floor(Math.random() * BACK_LINES.length)], score: back.score, rou, t: 0, won }; persist();
        }
      }
      back.ev.length = 0;
    }
    if (backOver) backOver.t += dt;
    A.idleTk += dt * TU.tickHz; if (A.idleTk >= 1) { A.idleTk -= 1; A.snd.step(Math.floor(G.now * 8), 0, null, 0, 0); }
  } else if (A.mode === 'credits') A.credT += dt;
  else { A.idleTk += dt * TU.tickHz; if (A.idleTk >= 1) { A.idleTk -= 1; if (A.mode === 'desk') A.snd.step(Math.floor(G.now * 8), 0, null, 0, 0); } }
  if (A.flipAnim > 0) {
    const before = A.flipAnim; A.flipAnim += dt / 0.8;
    if (before < 0.5 && A.flipAnim >= 0.5) {
      if (A.flipTo === 'back') A.mode = 'back';
      else { A.mode = 'dial'; if (S.backWon && S.won && !S.ended) { S.ended = true; ach('end'); persist(); A.mode = 'credits'; A.credT = 0; } back = null; backOver = null; }
    }
    if (A.flipAnim >= 1) A.flipAnim = 0;
  }
  for (let i = A.parts.length - 1; i >= 0; i--) { const p = A.parts[i]; p.l -= dt; if (p.l <= 0) { A.parts.splice(i, 1); continue; } p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.95; p.vy *= 0.95; }
  for (let i = A.floats.length - 1; i >= 0; i--) { const f = A.floats[i]; f.l -= dt; f.y -= dt * 26; if (f.l <= 0) A.floats.splice(i, 1); }
  A.shake *= Math.pow(0.0008, dt); if (A.shake < 0.2) A.shake = 0;
  if (A.flash > 0) A.flash -= dt * 2.2;
  if (A.cityNameT > 0) A.cityNameT -= dt; if (A.tauntT > 0) A.tauntT -= dt; if (A.toastT > 0) A.toastT -= dt; if (A.titleT > 0) A.titleT -= dt;
  if (A.overlay) A.overlay.t += dt;
}

// ——— icônes
function icon(k: string, x: number, y: number, on = false, label = '') {
  const col = on ? '#e8c25a' : 'rgba(255,255,255,.62)'; c.save(); c.translate(x, y); c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 1.6; c.lineCap = 'round'; c.lineJoin = 'round';
  if (k === 'daily') { c.strokeRect(-9, -8, 18, 17); c.fillRect(-9, -8, 18, 4); txt(c, label, 0, 3.5, 10, col, 'center', 700); }
  else if (k === 'tool') { c.rotate(-Math.PI / 4); c.lineWidth = 2; c.beginPath(); c.moveTo(0, -12); c.lineTo(0, 1); c.stroke(); c.fillRect(-3.2, 1, 6.4, 11); c.fillRect(-1.6, -13.5, 3.2, 3); }
  else if (k === 'stats') { for (const yy of [-6, 0, 6]) { c.beginPath(); c.moveTo(-9, yy); c.lineTo(9, yy); c.stroke(); } }
  else if (k === 'flip') { c.beginPath(); c.arc(0, 0, 9, -2.4, 1.2); c.stroke(); c.beginPath(); c.moveTo(3.3, 8.4); c.lineTo(8.5, 10.5); c.lineTo(8, 4.6); c.closePath(); c.fill(); c.beginPath(); c.arc(0, 0, 3, 0, TAU); c.stroke(); }
  else if (k === 'desk') { c.beginPath(); c.arc(0, 0, 10, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(0, -6); c.lineTo(0, 0); c.lineTo(4.5, 2.5); c.stroke(); }
  else if (k === 'share') { c.beginPath(); c.moveTo(0, 3); c.lineTo(0, -11); c.moveTo(-4.5, -6.5); c.lineTo(0, -11); c.lineTo(4.5, -6.5); c.stroke(); c.beginPath(); c.moveTo(-8, -1); c.lineTo(-8, 9); c.lineTo(8, 9); c.lineTo(8, -1); c.stroke(); }
  else if (k === 'mute') { c.beginPath(); c.moveTo(-9, -3); c.lineTo(-4, -3); c.lineTo(1, -8); c.lineTo(1, 8); c.lineTo(-4, 3); c.lineTo(-9, 3); c.closePath(); c.fill(); if (S.mute) { c.beginPath(); c.moveTo(5, -4); c.lineTo(11, 4); c.moveTo(11, -4); c.lineTo(5, 4); c.stroke(); } else { c.beginPath(); c.arc(1, 0, 6, -0.8, 0.8); c.stroke(); c.beginPath(); c.arc(1, 0, 10, -0.7, 0.7); c.stroke(); } }
  c.restore();
}

function homeButtons() {
  const W = G.W, y = G.H - G.sb - 40; const list: [string, () => void, boolean, string][] = [];
  const played = S.daily.date === today();
  if (S.deaths >= 3) list.push(['daily', () => { A.snd.click(); if (played) { toast('Demain. ' + fmt(S.daily.score) + '.'); return; } dailyArm = !dailyArm; }, dailyArm, String(S.daily.streak || '')]);
  if (S.deaths >= TU.unlockAtelier) list.push(['tool', () => { A.snd.click(); A.mode = 'atelier'; A.overlay = null; }, false, '']);
  if (S.deaths >= 5) list.push(['stats', () => { A.snd.click(); A.mode = 'stats'; A.overlay = null; }, false, '']);
  if (S.won > 0) list.push(['flip', () => { autoFlip = 0; enterBack(); }, false, '']);
  if (S.ended) list.push(['desk', () => { A.snd.click(); A.mode = 'desk'; A.overlay = null; try { (navigator as any).wakeLock?.request('screen'); } catch { /* */ } }, false, '']);
  const o = A.overlay; if (o && S.deaths >= 3) list.push(['share', () => { A.snd.click(); shareCard(o); }, false, '']);
  const sp = Math.min(64, (W - 30) / Math.max(1, list.length));
  list.forEach(([k, fn, on, lb], i) => { const x = W / 2 + (i - (list.length - 1) / 2) * sp; c.fillStyle = 'rgba(0,0,0,.5)'; c.beginPath(); c.arc(x, y, 21, 0, TAU); c.fill(); icon(k, x, y, on, lb); add(x - sp / 2, y - 26, sp, 56, fn); });
  if (S.deaths >= 1) { icon('mute', W - 26, G.st + 26); add(W - 52, G.st, 52, 52, toggleMute); }
  if (S.deaths >= TU.unlockAtelier && !o) rouLabel(c, 16, G.st + 26, S.rou, 14, 'left');
  if (dailyArm) txt(c, 'DAILY · ' + today().slice(8) + '/' + today().slice(5, 7), W / 2, G.cy + G.R * caseK(S.eq) + 40, 14, '#e8c25a', 'center', 700, 4);
}

// ——— rendu
function renderDial() {
  const s = A.sim, W = G.W, H = G.H;
  c.fillStyle = s ? s.cfg.pal.bg : '#000'; c.fillRect(0, 0, W, H);
  { const bgc = s ? s.cfg.pal.hand : '#8090a8', bg = c.createRadialGradient(G.cx - W * 0.2, G.cy - H * 0.22, 0, G.cx, G.cy, Math.max(W, H) * 0.75); bg.addColorStop(0, rgba(bgc, s ? 0.13 : 0.07)); bg.addColorStop(1, rgba(bgc, 0)); c.fillStyle = bg; c.fillRect(0, 0, W, H); }
  const first = S.runs === 0 && !A.overlay, fade = first ? clamp((A.boot - 0.8) / 2, 0, 1) : clamp(A.boot / 0.4, 0, 1);
  c.save();
  const sh = A.shake; c.translate(G.cx + (Math.random() - 0.5) * sh, G.cy + (Math.random() - 0.5) * sh); c.scale(A.zoom, A.zoom);
  if (s) {
    if (A.rew) {
      const r = A.rew, e = clamp(r.t / TU.deathAnim, 0, 1), Td = Math.max(0, r.T - TU.rewind * (1 - Math.pow(1 - e, 2)));
      let pa = r.a; for (let i = r.hT.length - 1; i >= 0; i--) if (r.hT[i] <= Td) { pa = r.hA[i]; break; }
      drawRun(c, s, Td, pa);
    } else drawRun(c, s, s.T, s.a);
  } else { c.globalAlpha = fade; drawHomeWatch(c, lock <= 0); c.globalAlpha = 1; }
  c.restore();
  if (A.rew) { c.fillStyle = 'rgba(255,255,255,.07)'; c.fillRect(0, 0, W, H); c.fillStyle = 'rgba(0,0,0,.25)'; for (let y = (G.now * 900) % 6; y < H; y += 6) c.fillRect(0, y, W, 1.5); txt(c, '◀◀', 26, G.st + 26, 15, '#fff', 'left', 700); }
  drawFx(c);
  if (s) {
    drawHud(c, s);
    if (s.state === 'pick') drawCards(c, s, add, pickCard, () => { if (s.reroll()) { A.snd.click(); A.pickT = 0.2; } else A.snd.err(); });
  } else {
    drawOverlay(c);
    if (fade >= 1) homeButtons();
    if (!A.overlay && S.deaths < 3 && A.boot > (first ? 3 : 0.6)) txt(c, 'Touche.', W / 2, G.cy + G.R * caseK(S.eq) + 44, 20, `rgba(255,255,255,${0.55 + 0.3 * Math.sin(G.now * 3)})`, 'center', 500, 3);
    else if (!A.overlay && S.best > 0 && !dailyArm) txt(c, fmt(S.best), W / 2, G.st + H * 0.085, 26, 'rgba(255,255,255,.35)', 'center', 700, 1);
  }
}
function renderBack() {
  if (!back) return; drawBack(c, back); drawFx(c);
  icon('flip', 28, G.st + 28); add(0, G.st, 60, 60, leaveBack);
  if (!back.started) txt(c, 'Touche.', G.W / 2, G.H * 0.86, 18, `rgba(255,255,255,${0.5 + 0.3 * Math.sin(G.now * 3)})`, 'center', 500, 3);
  if (backOver) {
    const a = clamp(backOver.t / 0.25, 0, 1); c.fillStyle = `rgba(0,0,0,${0.7 * a})`; c.fillRect(0, 0, G.W, G.H); c.globalAlpha = a;
    txt(c, backOver.line, G.W / 2, G.H * 0.36, 22, '#fff', 'center', 600, 1);
    txt(c, fmt(backOver.score), G.W / 2, G.H * 0.46, Math.min(G.W * 0.2, 90), backOver.won ? '#f2d98a' : '#fff', 'center', 700, -1);
    txt(c, FLOORS[back.floor], G.W / 2, G.H * 0.55, 13, '#d9a441', 'center', 600, 4);
    rouLabel(c, G.W / 2 + 22, G.H * 0.6, backOver.rou, 15); c.globalAlpha = 1;
  }
}
function renderDesk() {
  c.fillStyle = '#000'; c.fillRect(0, 0, G.W, G.H); c.save(); c.translate(G.cx, G.cy); drawHomeWatch(c, false); c.restore();
  const d = new Date(); txt(c, d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase(), G.W / 2, G.H - G.sb - 40, 13, 'rgba(255,255,255,.4)', 'center', 600, 4);
}
function renderCredits() {
  c.fillStyle = '#000'; c.fillRect(0, 0, G.W, G.H);
  const L = ['CALIBRE 95', '95 jours.', '9 villes.', 'Une montre. La tienne.', 'Bon voyage, Bob.'];
  L.forEach((s, i) => { const t = A.credT - 0.6 - i * 1.5, a = clamp(t / 0.8, 0, 1); if (a > 0) txt(c, s, G.W / 2, G.H * (0.3 + i * 0.09), i === 0 ? 34 : 19, `rgba(255,255,255,${a * (i === 0 ? 1 : 0.8)})`, 'center', i === 0 ? 700 : 500, i === 0 ? 12 : 2); });
}

function render() {
  A.btns.length = 0;
  c.setTransform(G.dpr, 0, 0, G.dpr, 0, 0);
  const fa = A.flipAnim; let sx = 1; if (fa > 0) sx = Math.abs(Math.cos(fa * Math.PI));
  if (fa > 0) { c.fillStyle = '#000'; c.fillRect(0, 0, G.W, G.H); c.translate(G.cx, 0); c.scale(Math.max(0.02, sx), 1); c.translate(-G.cx, 0); }
  if (A.mode === 'dial') renderDial();
  else if (A.mode === 'back') renderBack();
  else if (A.mode === 'atelier') drawAtelier(c, add, () => { A.mode = 'dial'; A.snd.click(); });
  else if (A.mode === 'stats') drawStats(c, add, () => { A.mode = 'dial'; A.snd.click(); });
  else if (A.mode === 'desk') renderDesk();
  else renderCredits();
  if (fa > 0) { c.setTransform(G.dpr, 0, 0, G.dpr, 0, 0); if (sx < 0.3) { c.save(); c.translate(G.cx, G.cy); c.scale(Math.max(0.02, sx), 1); drawBackCase(c, G.R, S.eq, S.engr); c.restore(); } A.btns.length = 0; }
  if (A.flash > 0) { c.fillStyle = rgba(A.flashCol, Math.min(0.5, A.flash * 0.5)); c.fillRect(0, 0, G.W, G.H); }
  if (FX.shock > 0) { const e = 1 - FX.shock / 0.45; c.strokeStyle = `rgba(255,255,255,${0.5 * (1 - e)})`; c.lineWidth = 2 + 6 * (1 - e); c.beginPath(); c.arc(G.cx, G.cy, G.R * (0.2 + 1.3 * e), 0, TAU); c.stroke(); FX.shock -= G.dt; }
  post(c, G.cv, G.dt);
  if (A.titleT > 0) { const a = clamp(A.titleT / 0.12, 0, 1); c.fillStyle = `rgba(0,0,0,${0.9 * a})`; c.fillRect(0, 0, G.W, G.H); txt(c, 'CALIBRE 95', G.W / 2, G.H / 2, Math.min(52, G.W * 0.12), `rgba(255,255,255,${a})`, 'center', 700, Math.min(14, G.W * 0.03)); }
  if (A.toastT > 0) txt(c, A.toast, G.W / 2, G.H - G.sb - 84, 14, `rgba(255,255,255,${Math.min(1, A.toastT)})`, 'center', 600, 2);
}

function frame(ts: number) {
  const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016; last = ts;
  update(dt); render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('./sw.js').catch(() => { /* */ });
// accès de test
(window as any).__t = { A, S, G, persist, startRun, down, up, enterBack, finalize, KANAZAWA, TAKAYAMA };
