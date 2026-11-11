import { TU, SURF } from './tuning';
import type { Course, Hole } from './world';
export interface Ball { x: number; y: number; vx: number; vy: number; t: number; spin: number; first: boolean; skips: number; still: number; air: number }
export interface Ev { k: 'hit' | 'skip' | 'roll'; s: number; v: number; x: number; y: number }
export type Res = '' | 'rest' | 'in' | 'water' | 'oob';
const { DT, G, R, DX, XMIN } = TU;
export function launch(x: number, y: number, vx: number, vy: number): Ball {
  const ang = Math.atan2(vy, Math.abs(vx)); return { x, y, vx, vy, t: 0, spin: Math.min(1, Math.max(0, (ang - 0.78) / 0.6)), first: true, skips: 0, still: 0, air: 0 };
}
// un pas fixe ; déterministe
export function step(c: Course, h: Hole | null, b: Ball, ev: Ev[] | null): Res {
  const sp = Math.hypot(b.vx, b.vy), n = Math.max(1, Math.ceil((sp * DT) / 2.2)), dt = DT / n; const H = c.H;
  let touch = false, tnx = 0, tny = 1, ts = 0;
  for (let k = 0; k < n; k++) {
    const up = b.air > 0.05 && c.surf(b.x) === 5 ? TU.UPDRAFT : 1;
    b.vy -= G * up * dt; const dr = 1 - TU.AIR * dt; b.vx *= dr; b.vy *= dr;
    b.x += b.vx * dt; b.y += b.vy * dt;
    for (let it = 0; it < 2; it++) {
      const f = (b.x - XMIN) / DX; let i0 = Math.floor(f - R / DX) - 1, i1 = Math.ceil(f + R / DX) + 1; if (i0 < 0) i0 = 0; if (i1 > c.n - 1) i1 = c.n - 1;
      let pen = 0, nx = 0, ny = 1;
      for (let i = i0; i < i1; i++) {
        const ax = XMIN + i * DX, ay = H[i], by = H[i + 1], ex = DX, ey = by - ay;
        let t = ((b.x - ax) * ex + (b.y - ay) * ey) / (ex * ex + ey * ey); t = t < 0 ? 0 : t > 1 ? 1 : t;
        const qx = ax + ex * t, qy = ay + ey * t; let dx = b.x - qx, dy = b.y - qy; const d = Math.hypot(dx, dy);
        const below = b.x >= ax && b.x <= ax + DX && b.y < ay + (ey * (b.x - ax)) / DX;
        if (below) { const l = Math.hypot(ex, ey), p = R + d; if (p > pen) { pen = p; nx = -ey / l; ny = ex / l; } }
        else if (d < R && R - d > pen) { pen = R - d; if (d > 1e-6) { nx = dx / d; ny = dy / d; } else { nx = 0; ny = 1; } }
      }
      if (pen <= 0) break;
      b.x += nx * pen; b.y += ny * pen;
      const vn = b.vx * nx + b.vy * ny;
      if (vn < 0) {
        const s = c.S[c.ix(b.x)], P = SURF[s];
        if (-vn > TU.BOUNCE_MIN) {
          const tx = ny, ty = -nx; let vt = b.vx * tx + b.vy * ty; vt *= 1 - P.fr; if (b.first) { vt *= 1 - 0.55 * b.spin; b.first = false; }
          const vo = -vn * P.e; b.vx = tx * vt + nx * vo; b.vy = ty * vt + ny * vo;
          if (ev) ev.push({ k: 'hit', s, v: -vn, x: b.x, y: b.y });
        } else { b.vx -= vn * nx; b.vy -= vn * ny; }
      }
      touch = true; tnx = nx; tny = ny; ts = c.S[c.ix(b.x)];
    }
  }
  b.t += DT;
  if (touch) {
    b.air = 0; b.first = false; const P = SURF[ts], v = Math.hypot(b.vx, b.vy), dec = P.mu * G * DT * Math.max(0.2, tny);
    if (v <= dec) { b.vx = 0; b.vy = 0; } else { b.vx -= (b.vx / v) * dec; b.vy -= (b.vy / v) * dec; }
    if (ev && v > 30 && (b.t * 120 | 0) % 6 === 0) ev.push({ k: 'roll', s: ts, v, x: b.x, y: b.y });
    const slope = Math.abs(tnx) / Math.max(0.05, tny);
    if (v < TU.REST_V && slope < P.ms) { if (++b.still > 10) { b.vx = 0; b.vy = 0; return h && inCup(h, b) ? 'in' : 'rest'; } } else b.still = 0;
  } else { b.air += DT; b.still = 0; }
  if (h && inCup(h, b) && Math.hypot(b.vx, b.vy) < TU.CAPTURE_V && b.y < h.cy - R * 0.2) return 'in';
  if (b.y - R < TU.WL && c.wet(b.x) && b.y < TU.WL + R) {
    if (b.vy < 0 && Math.abs(b.vx) > TU.SKIP_V && -b.vy < Math.abs(b.vx) * TU.SKIP_SLOPE && b.skips < 3) { b.vy = -b.vy * 0.6 + 20; b.vx *= 0.82; b.skips++; b.y = TU.WL + R; if (ev) ev.push({ k: 'skip', s: 7, v: Math.abs(b.vx), x: b.x, y: TU.WL }); }
    else if (b.y < TU.WL) return 'water';
  }
  if (b.x > c.xEnd + 52 && b.y < c.sea + 2) return 'water';
  if (h && (b.x < h.tee - TU.OOB || b.x > h.cup + TU.OOB)) return 'oob';
  if (b.x < XMIN + 10 || b.y < -900) return 'oob';
  if (b.t > TU.TMAX) return 'rest';
  return '';
}
function inCup(h: Hole, b: Ball) { return Math.abs(b.x - h.cup) < TU.CUPW + 1 && b.y < h.cy - 1.5; }
export function simulate(c: Course, h: Hole, x: number, y: number, vx: number, vy: number) {
  const b = launch(x, y, vx, vy); let r: Res = '';
  for (let i = 0; i < 4000 && !r; i++) r = step(c, h, b, null);
  return { r: r || 'rest', x: b.x, y: b.y };
}
