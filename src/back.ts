// Le deuxième côté.
import { TAU, TU } from './tuning';
import { mkRng, Rng, clamp } from './rng';
import { G, C2, txt, fmt, rgba } from './g';

export interface Gear { x: number; y: number; r: number; om: number; kind: number; teeth: number; main: number }
export interface Bar { x1: number; x2: number; y: number }
export interface Fork { x: number; y: number; len: number; ph: number }
export const FLOORS = ['BARILLET', 'ROUE DE CENTRE', 'ROUE MOYENNE', 'ROUE DE SECONDE', 'PONT', 'ROUE D\'ÉCHAPPEMENT', 'ANCRE', 'SPIRAL', 'BALANCIER'];
const PR = 0.05;

export class Back {
  rng: Rng; gears: Gear[] = []; bars: Bar[] = []; forks: Fork[] = [];
  t = 0; g = 0; th = 0; x = 0; y = 0; vx = 0; vy = 0; fly = false; from = -1;
  state: 'run' | 'dead' | 'won' = 'run'; best = 0; rise = -1.2; camY = 0; score = 0; ev: string[] = []; started = false; floor = 0;

  constructor(seed: number) {
    this.rng = mkRng(seed); const r = this.rng;
    const N = TU.back.floors * TU.back.perFloor;
    let x = 0, y = 0, rad = 0.32, sgn = 1;
    this.gears.push({ x, y, r: rad, om: TU.back.v / rad, kind: 0, teeth: 28, main: 0 });
    for (let i = 1; i <= N; i++) {
      const fl = Math.floor((i - 1) / TU.back.perFloor);
      const nr = i === N ? 0.3 : clamp(0.3 - fl * 0.014 - r() * 0.1, 0.12, 0.3);
      let nx = 0, ny = 0;
      for (let tr = 0; tr < 20; tr++) {
        const phi = (r() * 2 - 1) * 1.0, d = rad + nr + 0.2 + r() * (0.22 + fl * 0.022);
        nx = x + Math.sin(phi) * d; ny = y + Math.cos(phi) * d;
        if (Math.abs(nx) < 0.92 - nr && ny - y > 0.25) break;
        nx = clamp(nx, -(0.92 - nr), 0.92 - nr);
      }
      sgn = r() < 0.7 ? -sgn : sgn;
      const v = TU.back.v * (1 + fl * 0.045);
      const kind = i === N ? 2 : fl >= 7 && r() < 0.5 ? 1 : 0;
      this.gears.push({ x: nx, y: ny, r: nr, om: (sgn * v) / nr, kind, teeth: Math.max(8, Math.round(nr * 90)), main: i });
      // dangers
      if (i < N && fl >= 1) {
        const midY = (y + ny) / 2, midX = (x + nx) / 2;
        if ((fl === 4 || (fl >= 2 && r() < 0.3)) && ny - y > 0.4) {
          const side = midX > 0 ? -1 : 1; // du côté opposé au trajet
          const b: Bar = side < 0 ? { x1: -1.2, x2: Math.min(midX - 0.3, -0.05), y: midY } : { x1: Math.max(midX + 0.3, 0.05), x2: 1.2, y: midY };
          this.bars.push(b);
          if (!this.reach(this.gears[i - 1], this.gears[i])) this.bars.pop();
        } else if (fl >= 5 && r() < (fl === 6 ? 0.8 : 0.3)) {
          this.forks.push({ x: midX + (midX > 0 ? -0.5 : 0.5), y: midY, len: 0.34, ph: r() * TAU });
        }
      }
      // roues parasites
      if (r() < 0.25 && Math.abs(nx) > 0.3) { const dr = 0.1 + r() * 0.08; this.gears.push({ x: -Math.sign(nx) * (0.5 + r() * 0.3), y: ny + (r() - 0.5) * 0.3, r: dr, om: (-sgn * v) / dr, kind: 0, teeth: Math.round(dr * 90), main: -1 }); }
      x = nx; y = ny; rad = nr;
    }
    this.th = -Math.PI / 2; this.place(); this.camY = this.y + 0.55;
  }
  // Une trajectoire existe-t-elle de a vers b ? (échantillonnage des tangentes)
  reach(a: Gear, b: Gear): boolean {
    for (let k = 0; k < 144; k++) {
      const th = (k / 144) * TAU, s = Math.sign(a.om);
      let px = a.x + Math.cos(th) * a.r, py = a.y + Math.sin(th) * a.r; const dx = -Math.sin(th) * s * 0.02, dy = Math.cos(th) * s * 0.02;
      for (let n = 0; n < 150; n++) {
        px += dx; py += dy;
        if (Math.abs(px) > 1.05 || py < a.y - 1) break;
        if (this.hitBar(px, py)) break;
        if (Math.hypot(px - b.x, py - b.y) < b.r * 0.85) return true;
      }
    }
    return false;
  }
  hitBar(px: number, py: number) { for (const b of this.bars) if (Math.abs(py - b.y) < 0.03 + PR && px > b.x1 - PR && px < b.x2 + PR) return true; return false; }
  rad(g: Gear) { return g.kind === 1 ? g.r * (0.62 + 0.38 * (0.5 + 0.5 * Math.sin(this.t * 2.2 + g.x * 9))) : g.r; }
  om(g: Gear) { return g.kind === 2 ? g.om * Math.cos(this.t * 3) * 1.3 : g.om; }
  place() { const g = this.gears[this.g], r = this.rad(g); this.x = g.x + Math.cos(this.th) * r; this.y = g.y + Math.sin(this.th) * r; }
  press() {
    if (this.state !== 'run') return;
    this.started = true;
    if (this.fly) return;
    const g = this.gears[this.g], s = this.om(g) * this.rad(g);
    this.vx = -Math.sin(this.th) * s; this.vy = Math.cos(this.th) * s;
    const sp = Math.hypot(this.vx, this.vy), want = TU.back.v * 1.05; if (sp < want) { const k = want / Math.max(0.01, sp); this.vx *= k; this.vy *= k; }
    this.fly = true; this.from = this.g; this.ev.push('jump');
  }
  forkTip(f: Fork): [number, number] { const a = Math.sin(this.t * 3 + f.ph) * 0.75; return [f.x + Math.sin(a) * f.len * Math.sign(-f.x || 1), f.y + Math.cos(a) * f.len * 0.4]; }
  step() {
    if (this.state !== 'run') return; const dt = TU.DT; this.t += dt;
    if (this.started) this.rise += dt * (TU.back.rise0 + TU.back.riseK * Math.max(0, this.best) + 0.02 * this.floor);
    this.rise = Math.max(this.rise, this.y - 2.3);
    if (!this.fly) { const g = this.gears[this.g]; this.th += this.om(g) * dt; this.place(); }
    else {
      this.x += this.vx * dt; this.y += this.vy * dt;
      for (let i = 0; i < this.gears.length; i++) {
        const g = this.gears[i]; const d = Math.hypot(this.x - g.x, this.y - g.y), r = this.rad(g);
        if (i === this.from) { if (d > r + 0.07) this.from = -1; continue; }
        if (d <= r + PR) {
          this.fly = false; this.g = i; this.th = Math.atan2(this.y - g.y, this.x - g.x); this.place(); this.ev.push('catch');
          if (g.main > this.best) { this.score += (g.main - this.best) * 150 * (1 + this.floor); this.best = g.main; const fl = Math.min(TU.back.floors - 1, Math.floor((g.main - 1) / TU.back.perFloor)); if (fl !== this.floor) { this.floor = fl; this.ev.push('floor'); } }
          if (g.kind === 2) { this.state = 'won'; this.score += 20000; this.ev.push('won'); }
          return;
        }
      }
      if (Math.abs(this.x) > 1.12 || this.hitBar(this.x, this.y)) return this.die();
      for (const f of this.forks) {
        const [tx, ty] = this.forkTip(f); // segment pivot → pointe
        const vx = tx - f.x, vy = ty - f.y, l2 = vx * vx + vy * vy; const u = clamp(((this.x - f.x) * vx + (this.y - f.y) * vy) / l2, 0, 1);
        if (Math.hypot(this.x - f.x - vx * u, this.y - f.y - vy * u) < 0.03 + PR) return this.die();
      }
    }
    if (this.y < this.rise) this.die();
  }
  die() { this.state = 'dead'; this.ev.push('death'); }
}

export function drawBack(c: C2, b: Back) {
  const W = G.W, H = G.H, u = W / 2.3;
  const target = b.y + 0.55; b.camY += (target - b.camY) * Math.min(1, G.dt * 4);
  const sx = (x: number) => W / 2 + x * u, sy = (y: number) => H * 0.62 - (y - b.camY) * u;
  c.fillStyle = '#0b0a08'; c.fillRect(0, 0, W, H);
  // côtes de Genève
  c.save(); c.globalAlpha = 0.5;
  for (let i = -4; i < 14; i++) { const y0 = ((i * 110 + b.camY * u * 0.5) % (H + 440)) - 220; const g = c.createLinearGradient(0, y0, 0, y0 + 110); g.addColorStop(0, '#1d1a14'); g.addColorStop(0.5, '#0e0d0a'); g.addColorStop(1, '#1d1a14'); c.fillStyle = g; c.beginPath(); c.moveTo(0, y0 + 60); c.lineTo(W, y0); c.lineTo(W, y0 + 110); c.lineTo(0, y0 + 170); c.closePath(); c.fill(); }
  c.restore();
  // ponts
  for (const br of b.bars) { const y = sy(br.y); if (y < -40 || y > H + 40) continue; const g = c.createLinearGradient(0, y - 8, 0, y + 8); g.addColorStop(0, '#d9dde2'); g.addColorStop(1, '#5d636b'); c.fillStyle = g; c.fillRect(sx(br.x1), y - 0.03 * u, (br.x2 - br.x1) * u, 0.06 * u); c.fillStyle = '#b3202a'; const ex = br.x1 < -1 ? sx(br.x2) - 9 : sx(br.x1) + 9; c.beginPath(); c.arc(ex, y, 4, 0, TAU); c.fill(); }
  // roues
  for (let i = 0; i < b.gears.length; i++) {
    const g = b.gears[i], x = sx(g.x), y = sy(g.y); if (y < -150 || y > H + 150) continue;
    const r = b.rad(g) * u, rot = g.kind === 2 ? Math.sin(b.t * 3) * 1.3 * (g.om / 3) : -b.t * g.om;
    const col = g.kind === 2 ? '#f2d98a' : g.kind === 1 ? '#8fb7ff' : g.main < 0 ? '#8a6a3a' : '#d9a441';
    c.save(); c.translate(x, y); c.rotate(rot); c.strokeStyle = col; c.fillStyle = rgba(col, 0.1);
    if (g.kind === 1) { c.lineWidth = 1.4; c.beginPath(); for (let a = 0; a < TAU * 4; a += 0.2) { const rr2 = (a / (TAU * 4)) * r; c.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2); } c.stroke(); c.lineWidth = 2; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.stroke(); }
    else {
      c.lineWidth = 1.6; c.beginPath(); const n = g.teeth, th = Math.min(r * 0.16, 7);
      for (let k = 0; k < n; k++) { const a0 = (k / n) * TAU, a1 = ((k + 0.5) / n) * TAU; c.lineTo(Math.cos(a0) * r, Math.sin(a0) * r); c.lineTo(Math.cos(a0 + 0.12 / n * TAU) * (r + th), Math.sin(a0 + 0.12 / n * TAU) * (r + th)); c.lineTo(Math.cos(a1 - 0.12 / n * TAU) * (r + th), Math.sin(a1 - 0.12 / n * TAU) * (r + th)); c.lineTo(Math.cos(a1) * r, Math.sin(a1) * r); }
      c.closePath(); c.fill(); c.stroke();
      c.lineWidth = 1.2; c.beginPath(); c.arc(0, 0, r * 0.78, 0, TAU); c.stroke(); c.beginPath(); c.arc(0, 0, r * 0.22, 0, TAU); c.stroke();
      const sp = g.kind === 2 ? 2 : r > 40 ? 5 : 4; for (let k = 0; k < sp; k++) { const a = (k / sp) * TAU; c.beginPath(); c.moveTo(Math.cos(a) * r * 0.22, Math.sin(a) * r * 0.22); c.lineTo(Math.cos(a) * r * 0.78, Math.sin(a) * r * 0.78); c.stroke(); }
    }
    c.restore();
    c.fillStyle = '#c2183a'; c.beginPath(); c.arc(x, y, Math.max(3, r * 0.09), 0, TAU); c.fill(); c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); c.arc(x - 1, y - 1, 1.2, 0, TAU); c.fill();
    if (i === b.g && !b.fly) { c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 1; c.beginPath(); c.arc(x, y, r + 10, 0, TAU); c.stroke(); }
  }
  // ancres
  for (const f of b.forks) { const [tx, ty] = b.forkTip(f); const y = sy(f.y); if (y < -80 || y > H + 80) continue; c.strokeStyle = '#e9edf2'; c.lineWidth = 0.06 * u; c.lineCap = 'round'; c.beginPath(); c.moveTo(sx(f.x), y); c.lineTo(sx(tx), sy(ty)); c.stroke(); c.fillStyle = '#c2183a'; c.beginPath(); c.arc(sx(tx), sy(ty), 0.035 * u, 0, TAU); c.fill(); c.fillStyle = '#8a8f96'; c.beginPath(); c.arc(sx(f.x), y, 0.045 * u, 0, TAU); c.fill(); }
  // ressort qui monte
  const ry = sy(b.rise);
  if (ry < H + 30) { const g = c.createLinearGradient(0, ry - 50, 0, ry + 10); g.addColorStop(0, 'rgba(255,60,40,0)'); g.addColorStop(1, 'rgba(255,60,40,.55)'); c.fillStyle = g; c.fillRect(0, ry - 50, W, 60); c.fillStyle = '#1a0503'; c.fillRect(0, ry + 10, W, H); c.strokeStyle = '#ff5a36'; c.lineWidth = 2; c.beginPath(); for (let x = 0; x <= W; x += 8) c.lineTo(x, ry + Math.sin(x * 0.08 + b.t * 5) * 4); c.stroke(); }
  // joueur
  const px = sx(b.x), py = sy(b.y);
  c.save(); c.globalCompositeOperation = 'lighter'; const gg = c.createRadialGradient(px, py, 0, px, py, 22); gg.addColorStop(0, 'rgba(255,231,163,.7)'); gg.addColorStop(1, 'rgba(255,231,163,0)'); c.fillStyle = gg; c.beginPath(); c.arc(px, py, 22, 0, TAU); c.fill(); c.restore();
  c.fillStyle = '#fff'; c.beginPath(); c.arc(px, py, 0.03 * u, 0, TAU); c.fill();
  if (!b.fly && b.state === 'run') { const g = b.gears[b.g], s = Math.sign(b.om(g)) || 1; const dx = -Math.sin(b.th) * s, dy = Math.cos(b.th) * s; const lg = c.createLinearGradient(px, py, px + dx * 1.3 * u, py - dy * 1.3 * u); lg.addColorStop(0, 'rgba(255,255,255,.5)'); lg.addColorStop(1, 'rgba(255,255,255,0)'); c.strokeStyle = lg; c.lineWidth = 1.2; c.setLineDash([3, 6]); c.beginPath(); c.moveTo(px, py); c.lineTo(px + dx * 1.3 * u, py - dy * 1.3 * u); c.stroke(); c.setLineDash([]); }
  // hud
  const top = G.st + H * 0.075;
  { const tg = c.createLinearGradient(0, 0, 0, top + 90); tg.addColorStop(0, 'rgba(0,0,0,.85)'); tg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = tg; c.fillRect(0, 0, W, top + 90); }
  txt(c, fmt(b.score), W / 2, top, Math.min(W * 0.15, 64), '#fff', 'center', 700, -1);
  txt(c, FLOORS[b.floor], W / 2, top + 44, 12, '#d9a441', 'center', 600, 4);
  const pw = W * 0.4; c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(W / 2 - pw / 2, top + 58, pw, 2); c.fillStyle = '#d9a441'; c.fillRect(W / 2 - pw / 2, top + 58, (pw * b.best) / (TU.back.floors * TU.back.perFloor), 2);
}
