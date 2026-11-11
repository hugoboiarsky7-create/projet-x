import { TU } from './tuning';
export interface Pt { x: number; v: number; r: number; s: number; day: number; g: number }
export interface Hole { i: number; tee: number; cup: number; cy: number; ty: number; par: number; day: number; len: number; hourly: boolean }
export interface Series { d0: number; p: number[] }
export interface Extra { day: number; c: number[] } // jour « horaire »
export type Flat = Record<string, number>;
const { DX, DAYW, AMP, XMIN } = TU;
function hash(n: number) { let t = (n | 0) + 0x6d2b79f5; t = Math.imul(t ^ (t >>> 15), 1 | t); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
export function vnoise(x: number, seed: number) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return (hash(i * 7919 + seed) * (1 - u) + hash((i + 1) * 7919 + seed) * u) * 2 - 1; }
export const sstep = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export class Course {
  pts: Pt[] = []; H!: Float32Array; S!: Uint8Array; W!: Uint8Array; n = 0; holes: Hole[] = []; xEnd = 0; yEnd = 0; sea = 0;
  lakes: [number, number][] = []; far!: Float32Array[]; g0 = 0; g1 = 1; day0 = 0; nDaily = 0;
  private open = -1; private bak: number[] = [];
  constructor(public id: string, ser: Series, extra: Extra[], flat: Flat, pars: Record<string, number>, prelude = false) {
    let p = ser.p.slice(), d0 = ser.d0;
    if (prelude) { // jours d'avant les données : plat, puis la première pente
      const pre: number[] = []; const P = TU.PRE;
      for (let i = 0; i < P; i++) pre.push(i < P - 8 ? 0.0041 * Math.exp((i / (P - 8)) * 0.62 + 0.012 * Math.sin(i * 1.7)) : 0.0076 * Math.pow(p[0] / 0.0076, (i - (P - 9)) / 9));
      p = pre.concat(p); d0 -= P;
    }
    this.day0 = d0; this.nDaily = p.length;
    const ext = p.concat(extra.map((e) => e.c[e.c.length - 1])); const N = ext.length; const lp = ext.map(Math.log);
    const sma: number[] = [], reg: number[] = [], vol: number[] = []; let ath = -1e9, athD = 0, crash = 0;
    for (let d = 0, acc = 0, acc2 = 0; d < N; d++) {
      acc += lp[d]; if (d >= TU.WIN) acc -= lp[d - TU.WIN]; sma.push(acc / Math.min(d + 1, TU.WIN));
      acc2 += lp[d]; if (d >= 200) acc2 -= lp[d - 200]; const below = lp[d] < acc2 / Math.min(d + 1, 200);
      if (lp[d] > ath) { ath = lp[d]; athD = d; }
      const dd = Math.exp(lp[d] - ath) - 1, since = d - athD;
      const r1 = d ? lp[d] - lp[d - 1] : 0, r3 = d >= 3 ? lp[d] - lp[d - 3] : 0, r30 = d >= 30 ? lp[d] - lp[d - 30] : 0;
      let v2 = 0, c = 0; for (let k = Math.max(1, d - 29); k <= d; k++) { const r = lp[k] - lp[k - 1]; v2 += r * r; c++; }
      const vo = Math.sqrt(v2 / Math.max(1, c)); vol.push(vo);
      let s = 0;
      if (d > 40 && vo < 0.024 && Math.abs(r30) < 0.13) s = 1;
      if (dd < -0.4 && since > 70 && below) s = 2;
      if (dd < -0.58 && since > 150 && below) s = 3;
      if (r30 > 0.45 && dd > -0.2 && d > 60) s = 5;
      if (r3 < -0.2 || r1 < -0.12) crash = 3;
      if (crash > 0) { s = 6; crash--; }
      reg.push(s);
    }
    for (let d = 2; d < N - 2; d++) if (reg[d] !== 6 && reg[d - 1] === reg[d + 1] && reg[d - 1] !== 6) reg[d] = reg[d - 1];
    this.g0 = Math.min(...lp); this.g1 = Math.max(...lp);
    const tr = (v: number) => AMP * Math.tanh(v / TU.SCALE);
    for (let d = 0; d < p.length; d++) this.pts.push({ x: d * DAYW, v: tr(lp[d] - sma[d]), r: Math.min(5.5, Math.abs(d ? lp[d] - lp[d - 1] : 0) * 70), s: reg[d], day: d0 + d, g: lp[d] });
    const hourEnd: number[] = [];
    extra.forEach((e, j) => {
      const d = p.length + j, base = (sma[d] * Math.min(d + 1, TU.WIN) - lp[d]) / Math.max(1, Math.min(d + 1, TU.WIN) - 1); let x = this.pts[this.pts.length - 1].x, prev = lp[d - 1];
      e.c.forEach((c, h) => { x += TU.HOURW; const l = Math.log(c); this.pts.push({ x, v: tr(l - base), r: Math.min(5.5, Math.abs(l - prev) * 260), s: reg[d], day: e.day + (h + 1) / e.c.length, g: l }); prev = l; });
      hourEnd.push(this.pts.length - 1);
    });
    const P = this.pts, last = P[P.length - 1]; this.xEnd = last.x;
    const n = this.n = Math.ceil((this.xEnd + 700 - XMIN) / DX); const H = this.H = new Float32Array(n), S = this.S = new Uint8Array(n); this.W = new Uint8Array(n);
    // interpolation d'Hermite + micro-relief
    let k = 0; const seed = id.charCodeAt(0) * 131;
    for (let i = 0; i < n; i++) {
      const x = XMIN + i * DX;
      if (x <= 0) { H[i] = P[0].v + Math.pow(-x / 60, 2) * 9 + vnoise(x / 23, seed) * 1.5; S[i] = P[0].s; continue; }
      if (x >= this.xEnd) { H[i] = last.v; S[i] = last.s; continue; }
      while (k < P.length - 2 && P[k + 1].x <= x) k++;
      const a = P[k], b = P[k + 1], a0 = P[Math.max(0, k - 1)], b1 = P[Math.min(P.length - 1, k + 2)];
      const w = b.x - a.x, t = (x - a.x) / w, m0 = ((b.v - a0.v) / Math.max(1, b.x - a0.x)) * w, m1 = ((b1.v - a.v) / Math.max(1, b1.x - a.x)) * w;
      const t2 = t * t, t3 = t2 * t;
      let h = (2 * t3 - 3 * t2 + 1) * a.v + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * b.v + (t3 - t2) * m1;
      const amp = a.r + (b.r - a.r) * t;
      h += amp * (vnoise(x / 13, seed) * 0.7 + vnoise(x / 5.3, seed + 9) * 0.3);
      H[i] = h; S[i] = t < 0.5 ? a.s : b.s;
    }
    for (let pass = 0; pass < 2; pass++) { let pv = H[0]; for (let i = 1; i < n - 1; i++) { const c = H[i]; H[i] = (pv + 2 * c + H[i + 1]) / 4; pv = c; } }
    // trous : un point remarquable toutes les ~10 journées
    const cups: number[] = []; let a = prelude ? 1 : 0; const nD = p.length; const teeI = a;
    const okCup = (q: number) => P[q].v > TU.WL + 16;
    while (a + TU.HOLE_MIN <= nD - 1) {
      let best = -1, bs = -1e9;
      if (nD - 1 - a <= TU.HOLE_MAX + 4) best = nD - 1;
      else for (let q = a + TU.HOLE_MIN; q <= a + TU.HOLE_MAX; q++) {
        const pk = P[q].v > P[q - 1].v && P[q].v >= P[q + 1].v, tr2 = P[q].v < P[q - 1].v && P[q].v <= P[q + 1].v;
        const sc = (pk ? 3 : 0) + (tr2 ? 1.6 : 0) - 0.45 * Math.abs(q - a - TU.HOLE_AIM) - (okCup(q) ? 0 : 100) - Math.abs(P[q + 1].v - P[q - 1].v) * 0.02;
        if (sc > bs) { bs = sc; best = q; }
      }
      cups.push(best); a = best;
    }
    for (const e of hourEnd) cups.push(e);
    const ix = (x: number) => Math.round((x - XMIN) / DX);
    let tee = P[teeI].x;
    cups.forEach((q, i) => {
      const cx = XMIN + ix(P[q].x) * DX, i0 = ix(tee), i1 = ix(cx), key = id + Math.round(P[q].day * 100) / 100, f = flat[key] ?? 1;
      if (f < 1) { const y0 = H[i0], y1 = H[i1]; for (let j = i0 + 1; j < i1; j++) { const L = y0 + ((y1 - y0) * (j - i0)) / (i1 - i0); H[j] = L + (H[j] - L) * f; } }
      this.holes.push({ i, tee, cup: cx, cy: 0, ty: 0, par: pars[key] ?? 0, day: P[q].day, len: cx - tee, hourly: q >= nD }); tee = cx;
    });
    // fin du monde : plateau, falaise, mer
    const ie = ix(this.xEnd); this.yEnd = H[ie]; this.sea = this.yEnd - 64;
    for (let i = ie; i < n; i++) { const x = XMIN + i * DX - this.xEnd; H[i] = x < 46 ? this.yEnd + vnoise(x / 9, 5) * 0.8 : this.yEnd - sstep(46, 62, x) * 700 - vnoise(x / 6, 3) * 3; if (x > 40) S[i] = 5; }
    // eau : cuvettes, lacs bornés ; l'hiver, ça gèle
    const isCupNear = (i: number) => this.holes.some((h) => Math.abs(ix(h.cup) - i) < 14 || Math.abs(ix(h.tee) - i) < 8);
    for (let i = ix(0); i < ie; i++) {
      if (H[i] >= TU.WL) continue; let j = i; while (j < ie && H[j] < TU.WL) j++;
      let a2 = i, b2 = j; const maxN = TU.LAKEMAX / DX;
      if (b2 - a2 > maxN) { let m = a2; for (let q = a2; q < b2; q++) if (H[q] < H[m]) m = q; a2 = Math.max(a2, Math.round(m - maxN / 2)); b2 = Math.min(b2, a2 + maxN); a2 = Math.max(i, b2 - maxN); }
      for (let q = i; q < j; q++) {
        if (q < a2 || q >= b2 || isCupNear(q)) H[q] = TU.WL + 1.2 + vnoise(q / 7, 77) * 0.8;
        else if (S[q] === 3) { H[q] = TU.WL; S[q] = 4; }
        else { this.W[q] = 1; const dq = Math.min(q - a2, b2 - 1 - q) * DX; H[q] = Math.max(H[q], TU.WL - 2.5 - dq * 0.8); }
      }
      i = j;
    }
    for (let i = 0; i < n; i++) if (this.W[i]) { let j = i; while (j < n && this.W[j]) j++; if (j - i < 5) { for (let q = i; q < j; q++) { this.W[q] = 0; H[q] = TU.WL + 1; } } else { this.lakes.push([XMIN + i * DX, XMIN + j * DX]); for (let q = 1; q <= 6; q++) { if (S[i - q] < 2) S[i - q] = 2; if (S[j + q - 1] < 2) S[j + q - 1] = 2; } } i = j; }
    // greens
    for (const h of this.holes) {
      const c = ix(h.cup), cy = H[c]; h.cy = cy;
      for (let d = -TU.GREEN - 8; d <= TU.GREEN + 8; d += DX) { const q = c + d / DX; if (q < 0 || q >= n || this.W[q]) continue; const w = 1 - sstep(TU.GREEN * 0.55, TU.GREEN + 8, Math.abs(d)); H[q] += (cy - H[q]) * w; }
    }
    for (const h of this.holes) h.ty = H[ix(h.tee)];
    // lointains : la tendance longue, en silhouettes
    const mk = (win: number, sm: number) => { const o = new Float32Array(N); for (let d = 0; d < N; d++) { let s = 0, c = 0; for (let q = Math.max(0, d - win); q <= d; q++) { s += lp[q]; c++; } o[d] = lp[d] - s / c; } const o2 = new Float32Array(N); for (let d = 0; d < N; d++) { let s = 0, c = 0; for (let q = Math.max(0, d - sm); q <= Math.min(N - 1, d + sm); q++) { s += o[q]; c++; } o2[d] = Math.tanh(s / c / 0.9); } return o2; };
    this.far = [mk(365, 30), mk(200, 14), mk(100, 6)];
  }
  ix(x: number) { const i = Math.round((x - XMIN) / DX); return i < 0 ? 0 : i >= this.n ? this.n - 1 : i; }
  gy(x: number) { const f = (x - XMIN) / DX; let i = Math.floor(f); if (i < 0) return this.H[0]; if (i >= this.n - 1) return this.H[this.n - 1]; const t = f - i; return this.H[i] * (1 - t) + this.H[i + 1] * t; }
  surf(x: number) { return this.S[this.ix(x)]; }
  wet(x: number) { return this.W[this.ix(x)] === 1; }
  xOfDay(day: number) { const P = this.pts; if (day <= P[0].day) return P[0].x; let lo = 0, hi = P.length - 1; if (day >= P[hi].day) return P[hi].x; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (P[m].day <= day) lo = m; else hi = m; } return P[lo].x + ((P[hi].x - P[lo].x) * (day - P[lo].day)) / (P[hi].day - P[lo].day); }
  ptAt(x: number) { const P = this.pts; let lo = 0, hi = P.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (P[m].x <= x) lo = m; else hi = m; } return P[lo]; }
  gAt(x: number) { const P = this.pts; let lo = 0, hi = P.length - 1; if (x <= 0) return P[0].g; if (x >= P[hi].x) return P[hi].g; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (P[m].x <= x) lo = m; else hi = m; } return P[lo].g + ((P[hi].g - P[lo].g) * (x - P[lo].x)) / (P[hi].x - P[lo].x); }
  holeAt(x: number) { for (const h of this.holes) if (h.cup > x + 0.5) return h.i; return this.holes.length; }
  // un seul godet ouvert à la fois : celui du trou en cours
  openCup(hi: number) {
    if (this.open === hi) return; const w = TU.CUPW / DX;
    if (this.open >= 0) { const c = this.ix(this.holes[this.open].cup); this.bak.forEach((v, k) => { this.H[c - w + k] = v; }); }
    this.open = hi; this.bak = [];
    if (hi >= 0 && hi < this.holes.length) { const c = this.ix(this.holes[hi].cup); for (let k = -w; k <= w; k++) { this.bak.push(this.H[c + k]); this.H[c + k] = this.holes[hi].cy - TU.CUPD; } } else this.open = -1;
  }
}
