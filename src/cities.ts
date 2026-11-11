import { TAU, TU } from './tuning';
import { mkRng } from './rng';

export interface Pal { d0: string; d1: string; ink: string; hand: string; hot: string; lume: string; bg: string }
export interface HandCfg { om?: number; wob?: number; wf?: number; w?: number; kind?: 'panda'; step?: number; every?: number }
export interface CityCfg {
  id: string; name: string; utc: string; pal: Pal; hands: HandCfg[];
  hol: { gap: [number, number]; len: number; tele: number };
  sparks?: { gap: [number, number]; travel: number };
  lasers?: { gap: [number, number]; hw: [number, number]; tele: number; on: number };
  crowd?: { gap: number; holes: number; holeHw: number; om: number; tele: number; on: number };
  fog?: boolean; twin?: boolean; tide?: { amp: number; per: number }; beat?: number;
  scramble?: { calm: number; tele: number; rush: number; mul: number }; boss?: number;
  gold?: boolean; snow?: boolean; grace?: number; piments?: boolean; note?: string; dur?: number; root: number; scale: number[];
}
export interface Hand { ang: Float32Array; st: Uint8Array; w: number; kind: number; gold?: boolean; dead?: boolean }
// st : 0 absent · 1 armée · 2 armée (annonce creuse) · 3 creuse · 4 creuse (fin) · 7 endormie
export interface Arc { kind: 0 | 1 | 2; t0: number; t1: number; t2: number; c: number; om: number; hw: number }
export interface Phase { a: number; b: number; c: number }
export interface Plan { cfg: CityCfg; dur: number; n: number; hands: Hand[]; arcs: Arc[]; scr: Phase[]; spin0: number }
export interface GenOpts { secA: number; startA?: number[]; holMul: number; quartz: boolean; ease: number; grace?: number }

const MIN = [0, 2, 3, 5, 7, 8, 10], PHR = [0, 1, 3, 5, 7, 8, 10], PENT = [0, 3, 5, 7, 10], HIRA = [0, 1, 5, 7, 8];

export const CITIES: CityCfg[] = [
  { id: 'bkk', name: 'BANGKOK', utc: 'UTC+7', root: 41, scale: PENT, grace: 3.2,
    pal: { d0: '#3a1029', d1: '#12050d', ink: '#ffd9ea', hand: '#ff5fa2', hot: '#ffb347', lume: '#fff4c2', bg: '#0a0307' },
    hands: [{ om: 0.4, wob: 0.25, w: 0.05 }, { om: -0.26, wob: 0.3, w: 0.06 }],
    hol: { gap: [1.6, 2.8], len: 1.8, tele: 0.7 } },
  { id: 'szx', name: 'SHENZHEN', utc: 'UTC+8', root: 43, scale: MIN,
    pal: { d0: '#06303a', d1: '#03090c', ink: '#d6fbff', hand: '#3ff0ff', hot: '#b6ff3f', lume: '#ffffff', bg: '#020708' },
    hands: [{ om: 0.5, wob: 0.3, w: 0.045 }, { om: -0.4, wob: 0.3, w: 0.05 }, { om: 0.24, wob: 0.5, w: 0.045 }],
    hol: { gap: [2.0, 3.4], len: 1.5, tele: 0.7 }, sparks: { gap: [2.2, 3.6], travel: 1.9 },
    lasers: { gap: [5, 8], hw: [0.3, 0.5], tele: 1.1, on: 0.6 } },
  { id: 'pek', name: 'PÉKIN', utc: 'UTC+8', root: 38, scale: PENT, note: 'tarif ×2,65',
    pal: { d0: '#4a0c0c', d1: '#150303', ink: '#ffe9b0', hand: '#ffcf5a', hot: '#ff3b30', lume: '#fff7d6', bg: '#080202' },
    hands: [{ om: 0.55, wob: 0.3, w: 0.045 }, { om: -0.5, wob: 0.3, w: 0.05 }, { om: -0.2, wob: 0.6, w: 0.045 }],
    hol: { gap: [2.4, 4.0], len: 1.25, tele: 0.7 }, sparks: { gap: [3.5, 5.5], travel: 1.8 },
    crowd: { gap: 6.2, holes: 3, holeHw: 0.34, om: 0.3, tele: 1.5, on: 0.4 } },
  { id: 'ctu', name: 'CHENGDU', utc: 'UTC+8', root: 45, scale: PENT, piments: true,
    pal: { d0: '#12381f', d1: '#04100a', ink: '#e2ffd6', hand: '#8de36b', hot: '#ff4d2e', lume: '#ffffff', bg: '#020704' },
    hands: [{ om: 0.65, wob: 0.3, w: 0.045 }, { om: -0.55, wob: 0.3, w: 0.045 }, { om: 0.3, wob: 0.5, w: 0.05 }, { kind: 'panda', w: 0.07 }],
    hol: { gap: [2.5, 4.1], len: 1.2, tele: 0.7 }, sparks: { gap: [3, 5], travel: 1.7 } },
  { id: 'ckg', name: 'CHONGQING', utc: 'UTC+8', root: 40, scale: PHR, fog: true,
    pal: { d0: '#4a4a63', d1: '#17182a', ink: '#e6dcff', hand: '#c9a0ff', hot: '#ff4fd8', lume: '#ffffff', bg: '#040406' },
    hands: [{ om: 0.6, wob: 0.3, w: 0.045 }, { om: -0.6, wob: 0.3, w: 0.045 }, { om: 0.35, wob: 0.4, w: 0.05 }, { om: -0.25, wob: 0.5, w: 0.05 }],
    hol: { gap: [2.5, 4.2], len: 1.15, tele: 0.75 }, lasers: { gap: [6, 9], hw: [0.3, 0.45], tele: 1.3, on: 0.6 } },
  { id: 'sha', name: 'SHANGHAI', utc: 'UTC+8', root: 42, scale: MIN, twin: true,
    pal: { d0: '#0e2244', d1: '#040812', ink: '#dbe8ff', hand: '#7fb2ff', hot: '#ffd27f', lume: '#ffffff', bg: '#020409' },
    hands: [{ om: 0.45, wob: 0.3, w: 0.04 }, { om: -0.35, wob: 0.3, w: 0.04 }],
    hol: { gap: [1.8, 3.2], len: 1.3, tele: 0.7 }, sparks: { gap: [3.5, 5.5], travel: 1.8 } },
  { id: 'hgh', name: 'HANGZHOU', utc: 'UTC+8', root: 36, scale: PENT, tide: { amp: 0.5, per: 7 },
    pal: { d0: '#123239', d1: '#050d10', ink: '#e6fbf7', hand: '#d8f3ee', hot: '#9fd8ff', lume: '#ffffff', bg: '#020607' },
    hands: [{ om: 0.3, wob: 0.2, w: 0.022 }, { om: -0.25, wob: 0.2, w: 0.022 }, { om: 0.18, wob: 0.3, w: 0.022 }, { om: -0.4, wob: 0.2, w: 0.022 }],
    hol: { gap: [3, 5], len: 0.7, tele: 0.9 }, lasers: { gap: [5, 7], hw: [0.45, 0.7], tele: 1.6, on: 0.8 } },
  { id: 'sel', name: 'SÉOUL', utc: 'UTC+9', root: 44, scale: MIN, beat: 0.5,
    pal: { d0: '#260f47', d1: '#090312', ink: '#ffe0ea', hand: '#ff4f7b', hot: '#4fffd0', lume: '#ffffff', bg: '#040109' },
    hands: [{ step: 0.3927, every: 1, w: 0.045 }, { step: -0.5236, every: 2, w: 0.045 }, { step: 0.2618, every: 1, w: 0.045 }, { step: -0.5236, every: 4, w: 0.05 }],
    hol: { gap: [1.5, 3], len: 1.25, tele: 0.5 }, lasers: { gap: [4, 6], hw: [0.26, 0.4], tele: 1.0, on: 0.5 } },
  { id: 'tyo', name: 'TOKYO', utc: 'UTC+9', root: 39, scale: HIRA, dur: 46, boss: 14,
    pal: { d0: '#1a1a1a', d1: '#030303', ink: '#ffffff', hand: '#f4f4f4', hot: '#ff2a2a', lume: '#ffffff', bg: '#000000' },
    hands: [{ om: 0.3, w: 0.04 }, { om: -0.26, w: 0.04 }, { om: 0.22, w: 0.04 }, { om: -0.34, w: 0.04 }, { om: 0.4, w: 0.04 }],
    hol: { gap: [2.6, 4.4], len: 1.1, tele: 0.7 }, sparks: { gap: [2.6, 4.2], travel: 1.7 },
    scramble: { calm: 4.2, tele: 1.0, rush: 2.6, mul: 4.5 } },
];
export const KANAZAWA: CityCfg = { id: 'kan', name: 'KANAZAWA', utc: 'UTC+9', root: 43, scale: HIRA, gold: true,
  pal: { d0: '#d9b34a', d1: '#94700f', ink: '#fff3c0', hand: '#f6dd8a', hot: '#fff8dc', lume: '#ffffff', bg: '#1a1202' },
  hands: [{ om: 0.7, wob: 0.3, w: 0.045 }, { om: -0.6, wob: 0.3, w: 0.045 }, { om: 0.4, wob: 0.4, w: 0.045 }, { om: -0.3, wob: 0.5, w: 0.045 }],
  hol: { gap: [2.4, 4], len: 1.1, tele: 0.7 }, lasers: { gap: [5, 8], hw: [0.3, 0.5], tele: 1.2, on: 0.6 } };
export const TAKAYAMA: CityCfg = { id: 'tak', name: 'TAKAYAMA', utc: 'UTC+9', root: 40, scale: HIRA, snow: true,
  pal: { d0: '#e8edf3', d1: '#a9b4c1', ink: '#2b3644', hand: '#2f3b4b', hot: '#7189a3', lume: '#0b1f3a', bg: '#0b0e12' },
  hands: [{ om: 0.4, wob: 0.3, w: 0.045 }, { om: -0.35, wob: 0.3, w: 0.045 }, { om: 0.2, wob: 0.5, w: 0.05 }],
  hol: { gap: [2.4, 4], len: 1.4, tele: 0.8 }, sparks: { gap: [3, 5], travel: 2.2 } };

const sm = (x: number) => x * x * (3 - 2 * x);

export function genPlan(cfg: CityCfg, seed: number, o: GenOpts): Plan {
  const rng = mkRng(seed);
  const dur = cfg.dur ?? TU.cityDur, SR = TU.SR;
  const n = Math.ceil((dur + TU.PREVIEW) * SR) + 2;
  const grace = o.grace ?? cfg.grace ?? TU.grace;
  const beat = cfg.beat || 0;
  const q = (t: number) => (beat ? Math.round(t / beat) * beat : t);
  const spin0 = cfg.boss ? dur - cfg.boss : 1e9;
  const scr: Phase[] = [];
  if (cfg.scramble) {
    const s = cfg.scramble; let t = grace + 2.2;
    while (t + s.tele + s.rush < Math.min(dur, spin0) - 0.4) {
      scr.push({ a: t, b: t + s.tele, c: t + s.tele + s.rush });
      t += s.tele + s.rush + s.calm * (0.8 + rng() * 0.4);
    }
  }
  const hands: Hand[] = [];
  {
    const ang = new Float32Array(n), st = new Uint8Array(n).fill(1);
    for (let k = 0; k < n; k++) ang[k] = o.secA + (TAU * (k / SR)) / dur;
    hands.push({ ang, st, w: 0.02, kind: 1 });
  }
  const nh = cfg.hands.length - Math.max(0, Math.floor(o.ease - 1.5));
  cfg.hands.forEach((hc, i) => {
    const a0 = o.startA && o.startA[i] != null ? o.startA[i] : rng() * TAU;
    const ph = rng() * TAU;
    if (i >= nh) return;
    const ang = new Float32Array(n), st = new Uint8Array(n).fill(1);
    const kind = hc.kind === 'panda' ? 2 : 0;
    const set = (t0: number, t1: number, v: number) => {
      const k0 = Math.max(0, Math.round(t0 * SR)), k1 = Math.min(n, Math.round(t1 * SR));
      for (let k = k0; k < k1; k++) st[k] = v;
    };
    const pd: number[] = [];
    if (kind === 2) {
      let t = grace + 2 + rng() * 3;
      while (t < dur + TU.PREVIEW) { pd.push(t, t + 0.9, t + 2.6, rng() < 0.5 ? -1 : 1); t += 2.6 + 3.5 + rng() * 3; }
    }
    let a = a0;
    for (let k = 0; k < n; k++) {
      const t = k / SR;
      if (beat && hc.step) {
        const per = beat * (hc.every || 1);
        const j = Math.floor(t / per), f = (t - j * per) / per;
        const e = f < 0.11 / per ? sm(f / (0.11 / per)) : 1;
        ang[k] = a0 + hc.step * (j + e - 1);
        continue;
      }
      let sp = 0;
      if (kind === 2) {
        for (let j = 0; j < pd.length; j += 4) if (t >= pd[j + 1] && t < pd[j + 2]) sp = 1.45 * pd[j + 3];
      } else {
        sp = (hc.om || 0) * (o.quartz ? 1 : 1 + (hc.wob ?? 0.3) * Math.sin((hc.wf ?? 0.8) * t + ph));
        if (cfg.scramble) {
          let m = 0.14;
          if (t >= spin0) m = 1.5;
          else for (const p of scr) if (t >= p.b && t < p.c) m = cfg.scramble.mul * sm(Math.min(1, Math.min(t - p.b, p.c - t) / 0.3));
          sp *= Math.max(0.14, m);
        }
      }
      a += sp / SR;
      ang[k] = a;
    }
    if (kind === 2) {
      st.fill(7);
      for (let j = 0; j < pd.length; j += 4) { set(pd[j], pd[j + 1], 2); set(pd[j + 1], pd[j + 2], 1); }
    } else {
      set(0, grace - TU.graceWarn, 3); set(grace - TU.graceWarn, grace, 4);
      const g = cfg.hol.gap, gm = 1 / (1 + o.ease * 0.6), tele = cfg.hol.tele;
      const len = Math.max(0.5, cfg.hol.len * o.holMul);
      let t = grace + (0.3 + rng() * 0.9) * g[0] * gm;
      while (t < dur + TU.PREVIEW) {
        const ts = q(t);
        set(ts, ts + tele, 2); set(ts + tele, ts + tele + len - 0.35, 3); set(ts + tele + len - 0.35, ts + tele + len, 4);
        t = ts + tele + len + (o.quartz ? (g[0] + g[1]) / 2 : g[0] + rng() * (g[1] - g[0])) * gm;
      }
      scr.forEach((p, pi) => {
        if ((i + pi) % 2 === 0) { set(p.a, p.b, 2); set(p.b, p.c - 0.35, 3); set(p.c - 0.35, p.c, 4); }
      });
    }
    hands.push({ ang, st, w: hc.w ?? 0.045, kind });
  });

  const arcs: Arc[] = [];
  const tEnd = dur - 0.8;
  if (cfg.sparks) {
    const s = cfg.sparks; let t = grace + 1 + rng() * 2;
    while (t + s.travel < Math.min(tEnd, spin0)) {
      const ar = q(t + s.travel);
      arcs.push({ kind: 2, t0: ar - s.travel, t1: ar - 0.07, t2: ar + 0.07, c: rng() * TAU, om: 0, hw: 0.075 });
      t += (s.gap[0] + rng() * (s.gap[1] - s.gap[0])) * (1 + o.ease * 0.3);
    }
  }
  if (cfg.boss) {
    const base = rng() * TAU; let j = 0;
    for (let t = spin0 + 1; t + 1.6 < tEnd; t += 0.5, j++)
      arcs.push({ kind: 2, t0: t, t1: t + 1.6 - 0.07, t2: t + 1.6 + 0.07, c: base + j * 0.62, om: 0, hw: 0.075 });
  }
  if (cfg.lasers) {
    const s = cfg.lasers; let t = grace + 2 + rng() * 2;
    while (t + s.tele + s.on < tEnd) {
      const t1 = q(t + s.tele);
      arcs.push({ kind: 0, t0: t1 - s.tele, t1, t2: t1 + s.on, c: rng() * TAU, om: 0, hw: s.hw[0] + rng() * (s.hw[1] - s.hw[0]) });
      t += (s.gap[0] + rng() * (s.gap[1] - s.gap[0])) * (1 + o.ease * 0.3);
    }
  }
  if (cfg.crowd) {
    const s = cfg.crowd; let t = grace + 2.5;
    while (t + s.tele + s.on < tEnd) {
      const phi = rng() * TAU, om = s.om * (rng() < 0.5 ? -1 : 1);
      for (let j = 0; j < s.holes; j++)
        arcs.push({ kind: 1, t0: t, t1: t + s.tele, t2: t + s.tele + s.on, c: phi + ((j + 0.5) * TAU) / s.holes, om, hw: TAU / s.holes / 2 - s.holeHw });
      t += s.gap * (1 + o.ease * 0.3);
    }
  }
  arcs.sort((x, y) => x.t0 - y.t0);
  return { cfg, dur, n, hands, arcs, scr, spin0 };
}
