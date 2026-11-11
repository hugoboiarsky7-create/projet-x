import { TAU, TU } from './tuning';
import { G, C2, txt, rr, fmt, rgba, wrapText, FONT, FONT2 } from './g';
import { A } from './app';
import { S } from './save';
import { wrap, clamp } from './rng';
import { drawCase, drawDial, drawHand, caseK, dialLight } from './watch';
import type { Sim } from './sim';
import type { Pal } from './cities';
import { COMP, RAR, RARC } from './comps';
import { sheen, glass, plate, TK, FX } from './fin';

const HOME: Pal = { d0: '#1c1d20', d1: '#060607', ink: '#f1f1f1', hand: '#e9e9e9', hot: '#ff5a36', lume: '#ffe7a3', bg: '#000000' };
let caseCv: HTMLCanvasElement | null = null, caseKey = '';
let dialCv: HTMLCanvasElement | null = null, dialKey = '', prevDial: HTMLCanvasElement | null = null;
const mk = (w: number, h: number) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };

export function layout() {
  G.cx = G.W / 2; G.cy = G.H * 0.5;
  G.R = Math.min(G.W * 0.395, G.H * 0.265);
}
export function caseLayer(): HTMLCanvasElement {
  const key = JSON.stringify(S.eq) + G.W + 'x' + G.H + G.dpr;
  if (!caseCv || caseKey !== key) {
    caseCv = mk(G.W * G.dpr, G.H * G.dpr); caseKey = key;
    const c = caseCv.getContext('2d')!; c.scale(G.dpr, G.dpr); c.translate(G.cx, G.cy);
    drawCase(c, G.R, S.eq, G.H);
  }
  return caseCv;
}
export function dialLayer(pal: Pal | null, label?: string, note?: string): HTMLCanvasElement {
  const day = new Date().getDate();
  const key = S.eq.dial + (pal ? pal.d0 + label : 'home') + G.R + day + G.dpr;
  if (!dialCv || dialKey !== key) {
    const s = G.R * 2 + 4; prevDial = pal && dialCv && dialKey.indexOf('home') < 0 ? dialCv : null; dialCv = mk(s * G.dpr, s * G.dpr); dialKey = key;
    const c = dialCv.getContext('2d')!; c.scale(G.dpr, G.dpr); c.translate(s / 2, s / 2);
    drawDial(c, G.R, S.eq, pal, label, note, day);
  }
  return dialCv;
}
const pt = (a: number, r: number): [number, number] => [Math.sin(a) * r, -Math.cos(a) * r];

function glowDot(c: C2, x: number, y: number, r: number, col: string, a = 1) {
  c.save(); c.globalCompositeOperation = 'lighter';
  const g = c.createRadialGradient(x, y, 0, x, y, r * 3.2);
  g.addColorStop(0, rgba(col, 0.55 * a)); g.addColorStop(1, rgba(col, 0));
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r * 3.2, 0, TAU); c.fill(); c.restore();
  c.fillStyle = rgba(col, a); c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
}

export function realAngles() {
  const d = new Date(), ms = d.getMilliseconds(), s = d.getSeconds() + Math.floor(ms / 125) / 8, m = d.getMinutes() + s / 60, h = (d.getHours() % 12) + m / 60;
  return { h: (h / 12) * TAU, m: (m / 60) * TAU, s: (s / 60) * TAU };
}

// Montre à l'heure réelle (accueil, atelier, mode bureau).
export function drawHomeWatch(c: C2, pulse: boolean) {
  const R = G.R, pal = dialLight(S.eq) ? { ...HOME, hand: '#1a1c20', ink: '#16181b' } : HOME;
  c.drawImage(caseLayer(), -G.cx, -G.cy, G.W, G.H);
  const dl = dialLayer(null); c.drawImage(dl, -R - 2, -R - 2, R * 2 + 4, R * 2 + 4); sheen(c, R, dialLight(S.eq) ? 1.6 : 1);
  const t = realAngles(), st = S.eq.hands;
  const hc = st === 'bleuies' ? '#3d6fd6' : pal.hand;
  drawHand(c, st, t.h, R * 0.52, R * 0.034, hc, false, 1, false);
  drawHand(c, st, t.m, R * 0.8, R * 0.026, hc, false, 1, false);
  secHand(c, t.s, R, pal.hot);
  if (pulse) { const [x, y] = pt(A.pA, R * 0.9); glowDot(c, x, y, R * 0.036 * (1 + 0.25 * Math.sin(G.now * 5)), HOME.lume); }
  glass(c, R);
}
function secHand(c: C2, a: number, R: number, col: string, alpha = 1) {
  c.save(); c.rotate(a); c.globalAlpha = alpha; c.strokeStyle = col; c.lineWidth = Math.max(1.4, R * 0.011); c.lineCap = 'round';
  c.beginPath(); c.moveTo(0, R * 0.18); c.lineTo(0, -R * 0.9); c.stroke();
  c.fillStyle = col; c.beginPath(); c.arc(0, R * 0.12, R * 0.022, 0, TAU); c.fill();
  c.restore();
  c.fillStyle = col; c.beginPath(); c.arc(0, 0, R * 0.035, 0, TAU); c.fill(); c.fillStyle = '#111'; c.beginPath(); c.arc(0, 0, R * 0.012, 0, TAU); c.fill();
}

// Scène de jeu à l'instant T (permet le rembobinage).
export function drawRun(c: C2, s: Sim, T: number, pa: number) {
  const R = G.R, cfg = s.cfg, pal = cfg.pal, plan = s.plan, rr_ = R * 0.9;
  const now = G.now;
  c.drawImage(caseLayer(), -G.cx, -G.cy, G.W, G.H);
  c.save(); c.rotate(A.rot);
  const dl = dialLayer(pal, cfg.name, cfg.note || cfg.utc);
  // changement de ville : la matière se pose par balayage radial, en une seconde
  const wipe = prevDial && A.cityNameT > 1.2 && !FX.low ? clamp((2.2 - A.cityNameT) / 1.0, 0, 1) : 1;
  if (wipe < 1 && prevDial) { c.drawImage(prevDial, -R - 2, -R - 2, R * 2 + 4, R * 2 + 4); const e = 1 - Math.pow(1 - wipe, 3); c.save(); c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, R + 3, -TAU / 4, -TAU / 4 + TAU * e); c.closePath(); c.clip(); c.drawImage(dl, -R - 2, -R - 2, R * 2 + 4, R * 2 + 4); c.restore(); c.save(); c.rotate(TAU * e); c.strokeStyle = rgba(pal.lume, 0.9 * (1 - e)); c.lineWidth = 2; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -R); c.stroke(); c.restore(); }
  else c.drawImage(dl, -R - 2, -R - 2, R * 2 + 4, R * 2 + 4);
  sheen(c, R, cfg.snow || cfg.gold ? 1.7 : 1);
  c.save(); c.beginPath(); c.arc(0, 0, R, 0, TAU); c.clip();
  const light = !!cfg.snow;
  // anneau intérieur
  if (s.has('inception')) { c.strokeStyle = rgba(pal.ink, 0.35); c.lineWidth = 1; c.setLineDash([2, 5]); c.beginPath(); c.arc(0, 0, R * 0.54, 0, TAU); c.stroke(); c.setLineDash([]); }
  // arcs
  for (const a of plan.arcs) {
    if (a.t0 > T) break; if (T >= a.t2 + 0.25) continue;
    const ce = a.c + a.om * T, on = T >= a.t1 && T < a.t2, p = clamp((T - a.t0) / (a.t1 - a.t0), 0, 1);
    if (a.kind === 0) {
      c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, R, ce - a.hw - TAU / 4, ce + a.hw - TAU / 4); c.closePath();
      if (on) { c.fillStyle = rgba(pal.hot, 0.55); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 2; c.stroke(); }
      else if (T < a.t1) { c.fillStyle = rgba(pal.hot, 0.05 + 0.12 * p * (0.6 + 0.4 * Math.sin(now * (10 + p * 30)))); c.fill(); c.strokeStyle = rgba(pal.hot, 0.35 + 0.5 * p); c.lineWidth = 1; c.setLineDash([4, 4]); c.stroke(); c.setLineDash([]);
        c.strokeStyle = rgba(pal.hot, 0.9); c.lineWidth = 3; c.beginPath(); c.arc(0, 0, rr_, ce - a.hw * p - TAU / 4, ce + a.hw * p - TAU / 4); c.stroke(); }
      else { c.fillStyle = rgba(pal.hot, 0.3 * (1 - (T - a.t2) / 0.25)); c.fill(); }
    } else if (a.kind === 1) {
      if (T >= a.t2) continue;
      const e = p * p, rad = on ? rr_ : R * (0.5 + 0.36 * e);
      for (let x = -a.hw + 0.03; x <= a.hw - 0.02; x += 0.085) {
        const [px, py] = pt(ce + x + (on ? 0 : Math.sin(now * 9 + x * 20) * 0.012), rad + (on ? 0 : Math.sin(now * 7 + x * 31) * R * 0.012));
        c.fillStyle = on ? '#fff' : rgba(pal.hot, 0.35 + 0.6 * p); c.beginPath(); c.arc(px, py, R * (on ? 0.03 : 0.019), 0, TAU); c.fill();
      }
      if (!on) { c.strokeStyle = rgba(pal.hot, 0.25 + 0.5 * p); c.lineWidth = 2; c.beginPath(); c.arc(0, 0, R * 0.955, ce - a.hw - TAU / 4, ce + a.hw - TAU / 4); c.stroke(); }
    } else {
      const tA = (a.t1 + a.t2) / 2, q = clamp((T - a.t0) / (tA - a.t0), 0, 1.15);
      if (q > 1.12) continue;
      const [tx, ty] = pt(ce, rr_);
      c.strokeStyle = rgba(pal.hot, 0.25 + 0.6 * q); c.lineWidth = 1.2; c.beginPath(); c.arc(tx, ty, R * 0.05 * (1.6 - 0.6 * q), 0, TAU); c.stroke();
      const [sx, sy] = pt(ce, rr_ * q), [bx, by] = pt(ce, rr_ * Math.max(0, q - 0.12));
      c.strokeStyle = rgba(pal.hot, 0.5); c.lineWidth = 2; c.beginPath(); c.moveTo(bx, by); c.lineTo(sx, sy); c.stroke();
      glowDot(c, sx, sy, R * 0.022, light ? '#3d5c80' : pal.hot);
    }
  }
  // index allumé
  if (s.state !== 'dead' || true) {
    const la = s.lit * (TAU / 12), [lx, ly] = pt(la, rr_), pu = 1 + 0.2 * Math.sin(now * 8);
    const urgent = s.litT < 2.5 ? 0.5 + 0.5 * Math.sin(now * 20) : 1;
    c.save(); c.globalCompositeOperation = 'lighter'; const hg = c.createRadialGradient(lx, ly, 0, lx, ly, R * 0.16); hg.addColorStop(0, rgba(pal.lume, 0.4 * urgent)); hg.addColorStop(1, rgba(pal.lume, 0)); c.fillStyle = hg; c.beginPath(); c.arc(lx, ly, R * 0.16, 0, TAU); c.fill(); c.restore();
    c.save(); c.translate(lx, ly); c.rotate(la + Math.PI / 4 + now * 1.5); c.globalAlpha = urgent; c.strokeStyle = pal.lume; c.lineWidth = 2; const q = R * 0.042 * pu; c.strokeRect(-q, -q, q * 2, q * 2); c.fillStyle = rgba(pal.lume, 0.35); c.fillRect(-q * 0.45, -q * 0.45, q * 0.9, q * 0.9); c.restore();
    c.save(); c.rotate(la); c.fillStyle = rgba(pal.lume, 0.9); c.fillRect(-R * 0.026, -R * 0.84, R * 0.052, R * 0.13); c.restore();
  }
  for (const p of s.pims) {
    const [x, y] = pt(p.h * (TAU / 12), rr_); c.save(); c.translate(x, y); c.rotate(0.6 + Math.sin(now * 6 + p.h) * 0.2); c.globalAlpha = p.t < 1.5 ? 0.4 + 0.6 * Math.abs(Math.sin(now * 12)) : 1;
    c.fillStyle = '#ff3b1f'; c.beginPath(); c.ellipse(0, 0, R * 0.028, R * 0.06, 0, 0, TAU); c.fill(); c.fillStyle = '#4fbf3a'; c.fillRect(-R * 0.012, -R * 0.075, R * 0.024, R * 0.03); c.restore();
  }
  // aperçus
  if (s.has('plan') || s.has('lumi')) {
    const dt = s.has('plan') ? 5 : 1;
    for (let i = 1; i < plan.hands.length; i++) {
      if (plan.hands[i].dead) continue;
      const a0 = s.hAng(i, T), a1 = s.hAng(i, T + dt);
      c.strokeStyle = rgba(pal.hand, 0.3); c.lineWidth = 2;
      c.beginPath(); c.arc(0, 0, R * (0.975 - 0.012 * i), Math.min(a0, a1) - TAU / 4, Math.max(a0, a1) - TAU / 4); c.stroke();
      drawHand(c, 'baton', s.hAng(i, T + 1), rr_, 1, rgba(pal.hand, 0.16), false, 1, false);
    }
  }
  // aiguilles
  const glint = now * 1.3, hst = S.eq.hands;
  for (let i = 1; i < plan.hands.length; i++) {
    const h = plan.hands[i], st = s.hSt(i, T); if (!st) continue;
    const ang = s.hAng(i, T), hollow = st === 3 || st === 4 || st === 7;
    let al = 1, col = h.gold ? '#ffd24a' : pal.hand;
    if (st === 4) al = 0.35 + 0.65 * Math.abs(Math.sin(now * 22));
    if (st === 2) col = Math.sin(now * 26) > 0 ? '#ffffff' : col;
    if (st === 7) al = 0.4;
    if (cfg.gold) al *= 0.16 + 0.84 * Math.pow(Math.max(0, Math.cos(ang - glint)), 6);
    const hw = Math.max(2.2, h.w * rr_ * 0.75);
    drawHand(c, hst, ang, rr_ * 1.0, hw, col, hollow, al, !light);
    if (st === 7) { const [zx, zy] = pt(ang + 0.12, rr_ * 0.7); txt(c, 'z', zx, zy + Math.sin(now * 2) * 3, R * 0.09, rgba(pal.ink, 0.6)); }
    if (h.gold) for (let k = 0; k < 3; k++) { const [bx, by] = pt(ang, rr_ * (0.35 + 0.12 * k)); c.fillStyle = k < s.bountyN ? '#fff' : 'rgba(0,0,0,.5)'; c.beginPath(); c.arc(bx, by, R * 0.018, 0, TAU); c.fill(); }
  }
  secHand(c, s.hAng(0, T), R, pal.hot, cfg.gold ? 0.5 + 0.5 * Math.pow(Math.max(0, Math.cos(s.hAng(0, T) - glint)), 4) : 1);
  // fantôme du record
  if (!A.daily && S.ghost.length && s.state === 'run') {
    const gi = Math.floor(s.time / 0.2);
    if (gi < S.ghost.length) { const [gx, gy] = pt(S.ghost[gi] / 100, rr_); c.strokeStyle = rgba(pal.ink, 0.35); c.lineWidth = 1; c.beginPath(); c.arc(gx, gy, R * 0.028, 0, TAU); c.stroke(); }
  }
  // joueur
  const pr = (s.ring ? 0.54 : 0.9) * R;
  const vis = R * 0.036 * (s.has('b44') ? 1.9 : s.has('b39') ? 0.72 : 1) * (s.air > 0 ? 1.5 : 1);
  const pcol = light ? '#0b1f3a' : pal.lume;
  for (let i = 0; i < A.trail.length; i++) { const [x, y] = pt(A.trail[i], pr); c.fillStyle = rgba(pcol, 0.05 + 0.3 * (i / A.trail.length)); c.beginPath(); c.arc(x, y, vis * (0.3 + 0.6 * (i / A.trail.length)), 0, TAU); c.fill(); }
  const [px, py] = pt(pa, pr);
  if (cfg.twin) {
    const [qx, qy] = pt(-pa, pr); c.strokeStyle = rgba(pal.ink, 0.12); c.lineWidth = 1; c.setLineDash([3, 6]); c.beginPath(); c.moveTo(0, -R); c.lineTo(0, R); c.stroke(); c.setLineDash([]);
    glowDot(c, qx, qy, vis * 0.9, pal.hand, 0.75);
  }
  if (s.has('gmt')) { const [gx, gy] = pt(s.allyA, pr); c.save(); c.translate(gx, gy); c.rotate(Math.PI / 4); c.fillStyle = pal.hot; c.fillRect(-vis * 0.6, -vis * 0.6, vis * 1.2, vis * 1.2); c.restore(); if (s.lvl('gmt') >= 1) { const [hx, hy] = pt(pa + s.dir * 0.5, pr); c.save(); c.translate(hx, hy); c.rotate(Math.PI / 4); c.fillStyle = rgba(pal.hot, 0.7); c.fillRect(-vis * 0.5, -vis * 0.5, vis, vis); c.restore(); } }
  if (s.air > 0) { c.fillStyle = 'rgba(0,0,0,.35)'; c.beginPath(); c.arc(px + 3, py + 5, vis, 0, TAU); c.fill(); }
  glowDot(c, px, py, vis, pcol, s.invuln > 0 ? 0.45 + 0.55 * Math.abs(Math.sin(now * 25)) : 1);
  if (s.invuln > 0) { c.strokeStyle = rgba(pal.lume, 0.8); c.lineWidth = 1.5; c.beginPath(); c.arc(px, py, vis * 2.2, 0, TAU); c.stroke(); }
  // direction
  { const [ax, ay] = pt(pa + s.dir * 0.11, pr); c.fillStyle = rgba(pcol, 0.8); c.beginPath(); c.arc(ax, ay, vis * 0.32, 0, TAU); c.fill(); }
  // brouillard
  if (cfg.fog && !s.has('lumi')) {
    const ca = pa - TAU / 4, hw = 0.95;
    c.fillStyle = 'rgba(10,10,14,.9)'; c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, R + 2, ca + hw, ca - hw + TAU); c.closePath(); c.fill();
    for (let k = 0; k < 4; k++) { c.fillStyle = `rgba(14,15,20,${0.22})`; for (const sg of [-1, 1]) { c.beginPath(); c.moveTo(0, 0); const e0 = ca + sg * (hw - 0.3 + k * 0.075); c.arc(0, 0, R + 2, Math.min(e0, ca + sg * hw), Math.max(e0, ca + sg * hw)); c.closePath(); c.fill(); } }
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 1; i < plan.hands.length; i++) { const st = s.hSt(i, T); if (st !== 1 && st !== 2) continue; const [nx, ny] = pt(s.hAng(i, T), rr_); const g = c.createRadialGradient(nx, ny, 0, nx, ny, R * 0.13); g.addColorStop(0, rgba(i % 2 ? pal.hot : pal.hand, 0.3)); g.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g; c.beginPath(); c.arc(nx, ny, R * 0.13, 0, TAU); c.fill(); }
    c.restore();
  }
  if (cfg.snow) { c.fillStyle = 'rgba(255,255,255,.9)'; for (let i = 0; i < 46; i++) { const x = ((i * 97.3 + now * (8 + (i % 5) * 3)) % (2 * R)) - R, y = ((i * 61.7 + now * (26 + (i % 7) * 6)) % (2 * R)) - R; c.fillRect(x, y, 1.6 + (i % 3), 1.6 + (i % 3)); } }
  c.restore();
  glass(c, R);
  c.restore();
}

export function drawFx(c: C2) {
  for (const p of A.parts) { c.globalAlpha = Math.max(0, p.l / p.m); c.fillStyle = p.col; c.fillRect(p.x - p.s / 2, p.y - p.s / 2, p.s, p.s); }
  c.globalAlpha = 1;
  for (const f of A.floats) txt(c, f.s, f.x, f.y, f.px, rgba(f.col, Math.min(1, f.l * 2)), 'center', 700);
}

let dispScore = 0;
function counter(c: C2, target: number, x: number, y: number, px: number, col: string) {
  if (target < dispScore) dispScore = target; const d = target - dispScore; dispScore = d < 1 ? target : dispScore + Math.max(1, d * Math.min(1, G.dt * 12));
  const str = fmt(dispScore), fin = fmt(target), roll = dispScore !== target; c.font = `700 ${px}px ${FONT}`; const dw = c.measureText('0').width, sw = dw * 0.42; let w = 0; for (const ch of str) w += ch === ' ' ? sw : dw; let cx = x - w / 2;
  for (let i = 0; i < str.length; i++) { const ch = str[i]; if (ch === ' ') { cx += sw; continue; } const moving = roll && fin[fin.length - (str.length - i)] !== ch; if (moving) { const f = (G.now * 9 + i) % 1; c.save(); c.beginPath(); c.rect(cx - 1, y - px * 0.5, dw + 2, px); c.clip(); txt(c, ch, cx + dw / 2, y - f * px * 0.5, px, rgba('#ffffff', 1 - f), 'center', 700); txt(c, String((+ch + 1) % 10), cx + dw / 2, y + (1 - f) * px * 0.5, px, rgba('#ffffff', f), 'center', 700); c.restore(); } else txt(c, ch, cx + dw / 2, y, px, col, 'center', 700); cx += dw; }
}
export function drawHud(c: C2, s: Sim) {
  const W = G.W, pal = s.cfg.pal, top = G.st + G.H * 0.085;
  const px = Math.min(W * 0.2, G.H * 0.1);
  counter(c, s.score, W / 2, top, px, '#fff');
  let sub = ''; const m = s.mult();
  if (s.combo > 1) sub = 'COMBO ' + s.combo;
  if (m !== 1) sub += (sub ? '  ·  ' : '') + '×' + (m >= 10 ? Math.round(m) : m.toFixed(1).replace('.', ','));
  if (sub) txt(c, sub, W / 2, top + px * 0.62, px * 0.2, s.cfg.snow ? '#cfd8e3' : pal.lume, 'center', 600, 2);
  if (s.combo > 0) { const cw = W * 0.26, f = clamp(s.comboT / 6.5, 0, 1); c.fillStyle = 'rgba(255,255,255,.14)'; c.fillRect(W / 2 - cw / 2, top + px * 0.8, cw, 2); c.fillStyle = '#fff'; c.fillRect(W / 2 - cw / 2, top + px * 0.8, cw * f, 2); }
  if (A.daily) txt(c, 'DAILY', 16, G.st + 22, 12, 'rgba(255,255,255,.6)', 'left', 600, 2);
  // vies
  for (let i = 0; i < s.lives; i++) { c.fillStyle = '#fff'; c.beginPath(); c.arc(W / 2 - (s.lives - 1) * 7 + i * 14, top + px * 0.98, 3.5, 0, TAU); c.fill(); }
  // complications
  const ids = Object.keys(s.mods).filter((k) => s.mods[k]);
  const y = G.H - G.sb - 34, n = ids.length, sz = Math.min(30, (W - 30) / Math.max(1, n) - 4);
  ids.forEach((id, i) => {
    const x = W / 2 + (i - (n - 1) / 2) * (sz + 5);
    let dim = 1, prog = -1;
    if (id === 'lunette') { dim = s.lunCd > 0 ? 0.35 : 1; }
    if (id === 'bandeja') { dim = s.lobCd > 0 ? 0.35 : 1; }
    if (id === 'vitre') dim = s.vitreLeft > 0 ? 1 : 0.35;
    if (id === 'chrono') prog = s.gauge / TU.chrono.gauge[s.lvl('chrono')];
    if (id === 'lune') { const P = TU.lune.per[s.lvl('lune')]; prog = (s.time % P) / P; }
    if (id === 'shot') prog = s.shotT > 0 ? s.shotT / TU.shot.dur : -1;
    c.globalAlpha = dim;
    c.fillStyle = 'rgba(0,0,0,.6)'; c.beginPath(); c.arc(x, y, sz / 2, 0, TAU); c.fill();
    c.strokeStyle = RARC[s.mods[id] - 1]; c.lineWidth = 1.3; c.stroke();
    if (prog >= 0) { c.strokeStyle = '#fff'; c.lineWidth = 2.4; c.beginPath(); c.arc(x, y, sz / 2 + 2.5, -TAU / 4, -TAU / 4 + TAU * clamp(prog, 0, 1)); c.stroke(); }
    txt(c, COMP[id].g, x, y + 1, sz * (COMP[id].g.length > 2 ? 0.34 : 0.46), '#fff', 'center', 700);
    c.globalAlpha = 1;
  });
  if (A.cityNameT > 0) {
    const a = Math.min(1, A.cityNameT), e = clamp((2.2 - A.cityNameT) / 0.9, 0, 1), ez = 1 - Math.pow(1 - e, 3), yy = G.cy + G.R * caseK(S.eq) + 46;
    c.save(); c.beginPath(); c.rect(0, yy - 30, W, 80); c.clip();
    if (A.cityPrev) txt(c, A.cityPrev, W / 2 - ez * W, yy, 30, `rgba(255,255,255,${a * 0.5})`, 'center', 700, 8);
    txt(c, A.cityName, W / 2 + (A.cityPrev ? (1 - ez) * W : 0), yy, 30, `rgba(255,255,255,${a})`, 'center', 700, 8);
    c.fillStyle = `rgba(255,255,255,${a * 0.35})`; c.fillRect(W * 0.2, yy + 26, W * 0.6, 1);
    const n = 9, ci = Math.min(8, s.ci); for (let i = 0; i < n; i++) { const x = W * 0.2 + (W * 0.6 * i) / (n - 1); c.fillStyle = i <= ci ? `rgba(255,255,255,${a})` : `rgba(255,255,255,${a * 0.3})`; c.beginPath(); c.arc(x, yy + 26, i === ci ? 4 : 2, 0, TAU); c.fill(); }
    txt(c, s.cfg.utc, W / 2, yy + 44, 11, `rgba(255,255,255,${a * 0.6})`, 'center', 600, 3);
    c.restore();
  }
  if (A.tauntT > 0) txt(c, A.taunt, W / 2, G.cy + G.R * caseK(S.eq) + 80, 14, `rgba(255,255,255,${Math.min(0.7, A.tauntT)})`, 'center', 500, 1);
}

export function drawCards(c: C2, s: Sim, add: (x: number, y: number, w: number, h: number, fn: () => void) => void, onPick: (i: number) => void, onReroll: () => void) {
  const W = G.W, H = G.H, t = A.pickT, e = clamp(t / 0.35, 0, 1), ez = 1 - Math.pow(1 - e, 3);
  c.fillStyle = `rgba(0,0,0,${0.78 * ez})`; c.fillRect(0, 0, W, H);
  const cw = Math.min(W * 0.88, 420), x0 = (W - cw) / 2, ch = Math.min(104, (H - G.st - G.sb - 200) / 3.9), gap = 12;
  let y = G.st + Math.max(54, (H - G.st - G.sb - (ch * 3 + gap * 4 + ch * 0.62 + 50)) / 2);
  txt(c, fmt(s.score), W / 2, y - 26, 22, `rgba(255,255,255,${0.8 * ez})`, 'center', 700, 1);
  const ready = t > 0.55;
  s.cards.forEach((cd, i) => {
    const cp = COMP[cd.id], col = RARC[cd.lvl], off = (1 - clamp((t - i * 0.07) / 0.3, 0, 1)) * 40;
    c.globalAlpha = clamp((t - i * 0.07) / 0.3, 0, 1);
    const mat = cd.lvl >= 2 ? TK.plat : cd.lvl === 1 ? TK.goldM : (['#aeb5bd', '#5d646c', '#24272c'] as [string, string, string]);
    c.fillStyle = 'rgba(0,0,0,.5)'; rr(c, x0 + 2, y + off + 5, cw, ch, 8); c.fill(); rr(c, x0, y + off, cw, ch, 8); plate(c, x0, y + off, cw, ch, mat);
    rr(c, x0 + 4, y + off + 4, cw - 8, ch - 8, 5); c.fillStyle = '#0b0c0f'; c.fill(); c.strokeStyle = 'rgba(0,0,0,.6)'; c.lineWidth = 1; c.stroke();
    { const gx0 = x0 + 18 + ch * 0.3, gy0 = y + off + ch / 2, g0 = ch * 0.3; c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = 0.7; c.setLineDash([6, 3, 1.500, 3]); c.beginPath(); c.moveTo(gx0 - g0 * 1.25, gy0); c.lineTo(gx0 + g0 * 1.25, gy0); c.moveTo(gx0, gy0 - g0 * 1.25); c.lineTo(gx0, gy0 + g0 * 1.25); c.stroke(); c.setLineDash([]); c.beginPath(); c.arc(gx0, gy0, g0 * 0.62, 0, TAU); c.stroke(); c.beginPath(); c.arc(gx0, gy0, g0 * 1.12, -0.5, 0.5); c.stroke(); }
    const gx = x0 + 18 + ch * 0.3, gy = y + off + ch / 2, gr = ch * 0.3;
    c.strokeStyle = rgba(col, 0.9); c.lineWidth = 1; c.beginPath(); c.arc(gx, gy, gr, 0, TAU); c.stroke();
    for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU; c.beginPath(); c.moveTo(gx + Math.cos(a) * gr * 0.82, gy + Math.sin(a) * gr * 0.82); c.lineTo(gx + Math.cos(a) * gr * 0.95, gy + Math.sin(a) * gr * 0.95); c.stroke(); }
    txt(c, cp.g, gx, gy + 1, gr * (cp.g.length > 2 ? 0.6 : 0.85), '#fff', 'center', 700);
    const tx = gx + gr + 14;
    txt(c, cp.name.toUpperCase(), tx, y + off + ch * 0.28, Math.min(19, ch * 0.2), '#fff', 'left', 700, 1);
    txt(c, RAR[cd.lvl] + (s.has(cd.id) ? ' +' : ''), x0 + cw - 12, y + off + ch - 13, 9.5, col, 'right', 700, 2);
    c.font = `500 ${Math.min(14, ch * 0.15)}px ${FONT}`;
    wrapText(c, cp.desc, cw - (tx - x0) - 14).slice(0, 2).forEach((ln, k) => txt(c, ln, tx, y + off + ch * 0.56 + k * Math.min(17, ch * 0.18), Math.min(14, ch * 0.15), 'rgba(255,255,255,.72)', 'left', 500));
    c.globalAlpha = 1;
    if (ready) { const yy = y; add(x0, yy, cw, ch, () => onPick(i)); }
    y += ch + gap;
  });
  // enclume
  const eh = ch * 0.62; c.globalAlpha = clamp((t - 0.25) / 0.3, 0, 1);
  c.fillStyle = 'rgba(0,0,0,.55)'; rr(c, x0 + 2, y + 5, cw, eh, 6); c.fill(); rr(c, x0, y, cw, eh, 6); plate(c, x0, y, cw, eh, ['#4a4338', '#221e17', '#0c0a07'], 1.6); c.strokeStyle = '#8a6a2a'; c.lineWidth = 1.2; c.stroke(); for (const [bx, by] of [[10, 10], [cw - 10, 10], [10, eh - 10], [cw - 10, eh - 10]]) { c.fillStyle = '#0c0a07'; c.beginPath(); c.arc(x0 + bx, y + by, 3.2, 0, TAU); c.fill(); c.fillStyle = '#b08a3a'; c.beginPath(); c.arc(x0 + bx - 0.5, y + by - 0.5, 2.2, 0, TAU); c.fill(); }
  txt(c, 'L\'ENCLUME', x0 + 26, y + eh * 0.36, Math.min(17, eh * 0.3), '#e8c25a', 'left', 700, 2);
  txt(c, 'Au hasard. Ça paie.' + (s.has('bravoure') ? ' Bravoure.' : ''), x0 + 26, y + eh * 0.7, Math.min(13, eh * 0.22), 'rgba(255,255,255,.6)', 'left', 500);
  txt(c, '?', x0 + cw - 30, y + eh / 2, eh * 0.6, '#e8c25a', 'center', 700);
  if (ready) { const yy = y; add(x0, yy, cw, eh, () => onPick(-1)); }
  y += eh + gap + 6;
  if (s.rerolls > 0) { txt(c, 'RELANCER · ' + s.rerolls, W / 2, y + 14, 13, 'rgba(255,255,255,.75)', 'center', 600, 3); if (ready) { const yy = y; add(W / 2 - 90, yy - 6, 180, 40, onReroll); } }
  c.globalAlpha = 1;
}

export function drawOverlay(c: C2) {
  const o = A.overlay; if (!o) return; const W = G.W, H = G.H, a = clamp(o.t / 0.25, 0, 1);
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, `rgba(0,0,0,${0.85 * a})`); g.addColorStop(0.3, `rgba(0,0,0,${0.25 * a})`); g.addColorStop(0.7, `rgba(0,0,0,${0.25 * a})`); g.addColorStop(1, `rgba(0,0,0,${0.85 * a})`);
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  const top = G.st + H * 0.085, px = Math.min(W * 0.2, H * 0.1);
  c.globalAlpha = a;
  { const lp = Math.min(30, W * 0.074); c.font = `300 ${lp}px ${FONT2}`; const lines = wrapText(c, o.line, W - 44).slice(0, 2); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff'; lines.forEach((ln, i) => c.fillText(ln, W / 2, G.cy - G.R * caseK(S.eq) - 34 - (lines.length - 1 - i) * lp * 1.15)); }
  txt(c, fmt(o.score), W / 2, top, px, o.won ? '#ffe7a3' : '#fff', 'center', 700, -1);
  txt(c, o.best ? 'RECORD' : 'RECORD ' + fmt(S.best), W / 2, top + px * 0.64, 12, o.best ? '#ffe7a3' : 'rgba(255,255,255,.5)', 'center', 700, 3);
  const y = G.cy + G.R * caseK(S.eq) + 34;
  const mm = Math.floor(o.time / 60), ss = Math.floor(o.time % 60);
  txt(c, `${o.daily ? 'DAILY · ' : ''}${o.city} · ${mm}:${String(ss).padStart(2, '0')}`, W / 2, y, 14, 'rgba(255,255,255,.8)', 'center', 600, 3);
  if (S.deaths >= TU.unlockAtelier || o.rou > 20) txt(c, '+' + o.rou + ' ROUAGES', W / 2, y + 24, 12, '#e8c25a', 'center', 700, 3);
  o.newAch.forEach((n, i) => txt(c, '★ ' + n, W / 2, y + 48 + i * 18, 12, '#ffe7a3', 'center', 600, 2));
  c.globalAlpha = 1;
}
