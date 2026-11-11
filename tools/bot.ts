// Bots de test : faisabilité, courbe de difficulté, fumée.
import { Sim } from '../src/sim';
import { TAU, TU } from '../src/tuning';
import { mkRng, wrap, norm } from '../src/rng';
import { viability } from '../src/solver';

interface Lvl { name: string; react: number; hor: number; pad: number; blindHollow: number; blindArc: number; delays: number[]; err: number }
const LV: Lvl[] = [
  { name: 'novice', react: 0.42, hor: 0.55, pad: -0.01, blindHollow: 1, blindArc: 0.7, delays: [0], err: 0.1 },
  { name: 'moyen', react: 0.24, hor: 1.1, pad: 0.02, blindHollow: 0.25, blindArc: 0.25, delays: [0, 0.25], err: 0.03 },
  { name: 'bon', react: 0.14, hor: 1.8, pad: 0.04, blindHollow: 0, blindArc: 0.05, delays: [0, 0.15, 0.3, 0.5], err: 0.008 },
  { name: 'expert', react: 0.07, hor: 3, pad: 0.05, blindHollow: 0, blindArc: 0, delays: [0, 0.1, 0.2, 0.3, 0.45, 0.6, 0.8, 1.1], err: 0 },
];

function surv(s: Sim, L: Lvl, flipAt: number, seeH: boolean, seeA: boolean): number {
  let a = s.a, dir = s.dir, T = s.T; const st = 1 / 60, ph = s.pHit() + L.pad; let fl = flipAt < 0;
  const n = s.plan.hands.length; const pr = new Float32Array(n);
  for (let t = 0; t < L.hor; t += st) {
    if (!fl && t >= flipAt) { dir = -dir; fl = true; }
    T += st * s.baseTs(); a += dir * s.pSpeed() * st * s.baseTs();
    for (let i = 0; i < n; i++) {
      const x = s.hSt(i, T); const armed = x === 1 || x === 2 || (!seeH && (x === 3 || x === 4));
      const r = wrap(a - s.hAng(i, T));
      if (armed && (Math.abs(r) < s.plan.hands[i].w + ph || (pr[i] * r < 0 && Math.abs(r) < 0.5))) return t;
      if (s.cfg.twin && i > 0 && armed && Math.abs(wrap(-a - s.hAng(i, T))) < s.plan.hands[i].w + ph) return t;
      pr[i] = armed ? r : 0;
    }
    if (seeA) for (const c of s.plan.arcs) {
      if (c.t0 > T) break;
      if (T >= c.t1 - 0.05 && T < c.t2 + 0.05) {
        if (Math.abs(wrap(a - c.c - c.om * T)) < c.hw + 0.03) return t;
        if (s.cfg.twin && Math.abs(wrap(-a - c.c - c.om * T)) < c.hw + 0.03) return t;
      }
    }
  }
  return L.hor + (Math.abs(wrap(s.lit * (TAU / 12) - a)) < 1 ? 0.01 : 0);
}

export function botRun(seed: number, L: Lvl, maxCity = 99) {
  const r = mkRng(seed * 13 + 7);
  const sA = r() * TAU; const sim = new Sim({ seed, secA: sA, startA: [r() * TAU, r() * TAU], pA: sA + Math.PI });
  let timer = 0, pending = -1, steps = 0; const per: number[] = []; let tries = sim.genTries; if (tries >= 40) console.log('  dur depart', tries);
  while (steps++ < 120 * 900) {
    if (sim.state === 'pick') { per.push(1); sim.choose(Math.floor(r() * 4) - 1); tries = Math.max(tries, sim.genTries); if (sim.genTries >= 40) console.log('  dur', sim.cfg.id, sim.genTries); if (sim.ci >= maxCity) break; continue; }
    if (sim.state !== 'run') break;
    sim.release();
    timer -= TU.DT;
    if (pending >= 0) { pending -= TU.DT; if (pending < 0) sim.press(); }
    else if (timer <= 0) {
      timer = L.react * (0.7 + r() * 0.6);
      const seeH = r() >= L.blindHollow, seeA = r() >= L.blindArc;
      let best = surv(sim, L, -1, seeH, seeA), bd = -1;
      if (best < L.hor) for (const dl of L.delays) { const v = surv(sim, L, dl, seeH, seeA); if (v > best + 0.02) { best = v; bd = dl; } }
      if (r() < L.err) bd = bd < 0 ? 0 : -1;
      if (bd >= 0) { pending = bd + L.react * 0.5; timer = pending + 0.05; }
    }
    sim.step(); sim.ev.length = 0;
  }
  return { time: sim.time, city: sim.ci, state: sim.state, score: sim.score, cause: sim.cause, tries, cityTime: sim.cityTime };
}

// Oracle : suit la table de viabilité, avec latence et erreurs optionnelles.
export function oracleRun(seed: number, pad: number, lat = 0, miss = 0, maxCity = 99) {
  const r = mkRng(seed * 13 + 7);
  const sA = r() * TAU; const sim = new Sim({ seed, secA: sA, startA: [r() * TAU, r() * TAU], pA: sA + Math.PI });
  let V = viability(sim.plan, pad), W = viability(sim.plan, pad + 0.16), mt = sim.genTries, ci = 0, steps = 0, lastS = -1, pend = -1, lastFlip = 0, lost = 0;
  while (steps++ < 120 * 900) {
    if (sim.state === 'pick') { sim.choose(Math.floor(r() * 4) - 1); continue; }
    if (sim.state !== 'run') break;
    if (sim.ci !== ci) { ci = sim.ci; mt = Math.max(mt, sim.genTries); if (sim.genTries >= 40) console.log('  dur', sim.cfg.id, sim.genTries, JSON.stringify(sim.mods)); if (ci >= maxCity) break; V = viability(sim.plan, pad); W = viability(sim.plan, pad + 0.16); lastS = -1; }
    sim.release();
    if (pend >= 0) { pend -= TU.DT; if (pend < 0) { sim.press(); lastFlip = sim.time; } }
    const s = Math.min(V.steps, Math.floor(sim.T * V.hz));
    if (s !== lastS && pend < 0) {
      lastS = s;
      const nL = lat > 0 ? Math.ceil(lat * V.hz) + 1 : 0; let mvSum = 0;
      for (let k = 0; k < nL; k++) mvSum += V.mvs[Math.min(V.steps, s + k)];
      const sp = Math.min(V.steps, s + nL);
      const b = (((Math.floor(norm(sim.a) / V.bs) + sim.dir * mvSum) % V.B) + V.B) % V.B; let v = V.via[sp * V.B + b];
      for (let k = 1; k <= 4 && !v; k++) v = V.via[sp * V.B + ((b + k) % V.B)] || V.via[sp * V.B + ((b - k + V.B) % V.B)];
      const w = W.via[sp * V.B + b]; if (w) v = w;
      const cur = sim.dir === 1 ? 1 : 2, oth = 3 - cur;
      let flip = false;
      if (!v) lost++;
      if (v && !(v & cur)) flip = true;
      else if (v === 3 && sim.time - lastFlip > 0.5) { const want = wrap(sim.lit * (TAU / 12) - sim.a) > 0 ? 1 : 2; if (want === oth) flip = true; }
      else if (!v && sim.time - lastFlip > 0.3) flip = r() < 0.3;
      if (flip && r() >= miss) { if (lat > 0) pend = lat * (0.6 + r() * 0.8); else { sim.press(); lastFlip = sim.time; } }
    }
    sim.step(); sim.ev.length = 0;
  }
  return { time: sim.time, city: sim.ci, state: sim.state, score: sim.score, cause: sim.cause, tries: mt, cityTime: sim.cityTime, lost };
}

const med = (a: number[]) => { const b = a.slice().sort((x, y) => x - y); return b[Math.floor(b.length / 2)]; };

if (process.argv[1] && process.argv[1].includes('bot')) {
  const N = +(process.argv[2] || 60);
  const t0 = Date.now(); let total = 0, maxTries = 0;
  for (const L of LV) {
    const res: ReturnType<typeof botRun>[] = []; for (let i = 0; i < N; i++) res.push(botRun(1000 + i * 17, L));
    total += N;
    const reach = Array.from({ length: 10 }, (_, c) => res.filter((x) => x.city >= c || x.state === 'won').length);
    const causes: Record<string, number> = {};
    res.forEach((x) => { causes[x.cause || '-'] = (causes[x.cause || '-'] || 0) + 1; maxTries = Math.max(maxTries, x.tries); });
    console.log(L.name.padEnd(7), 'médiane', med(res.map((x) => x.time)).toFixed(1) + 's', 'atteint', reach.map((x) => Math.round((100 * x) / N)).join(' '), 'gagne', res.filter((x) => x.state === 'won').length, JSON.stringify(causes));
  }
  for (const [nm, pad, lat, miss] of [['oracle', 0.085, 0, 0], ['or+80ms', 0.085, 0.08, 0], ['or+160ms', 0.085, 0.16, 0.02], ['or+240ms', 0.085, 0.24, 0.05]] as [string, number, number, number][]) {
    const res: ReturnType<typeof oracleRun>[] = []; for (let i = 0; i < N; i++) res.push(oracleRun(1000 + i * 17, pad, lat, miss));
    total += N;
    const reach = Array.from({ length: 10 }, (_, c) => res.filter((x) => x.city >= c || x.state === 'won').length);
    const causes: Record<string, number> = {};
    res.forEach((x) => { causes[x.cause || '-'] = (causes[x.cause || '-'] || 0) + 1; });
    res.forEach((x) => { maxTries = Math.max(maxTries, x.tries); });
    console.log(nm.padEnd(8), 'médiane', med(res.map((x) => x.time)).toFixed(1) + 's', 'atteint', reach.map((x) => Math.round((100 * x) / N)).join(' '), 'gagne', res.filter((x) => x.state === 'won').length, JSON.stringify(causes));
  }
  console.log(total, 'runs', ((Date.now() - t0) / 1000).toFixed(1) + 's', 'essais max du générateur', maxTries, 'mem', Math.round(process.memoryUsage().heapUsed / 1e6) + 'Mo');
}
