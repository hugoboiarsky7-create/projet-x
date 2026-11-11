import { TAU, TU } from './tuning';
import { norm } from './rng';
import type { Plan } from './cities';

// Table de viabilité complète (pour le bot oracle) : via[s*B+b] = 1 si l'état peut survivre jusqu'au bout.
export function viability(plan: Plan, pad: number) {
  const B = TU.solver.bins, hz = TU.solver.hz, SR = TU.SR, cfg = plan.cfg, bs = TAU / B;
  const steps = Math.floor(plan.dur * hz), kd = Math.round(SR / hz), hd = Math.round(TU.solver.hollowDelay * SR);
  const masks = new Uint8Array((steps + 2) * B), mvs = new Uint8Array(steps + 2), via = new Uint8Array((steps + 2) * B);
  const bin = (x: number) => Math.floor(norm(x) / bs) % B;
  const pass = (x: number) => x === 3 || x === 7 || x === 0;
  let cum = 0, moved = 0;
  for (let s = 0; s <= steps + 1; s++) {
    const t = s / hz, k = Math.min(plan.n - 1, Math.round(t * SR)), k2 = Math.min(plan.n - 1, k + kd), k0 = Math.max(0, k - kd), o = s * B;
    const cover = (lo: number, hi: number) => { const c = Math.min(B, Math.ceil((hi - lo) / bs) + 1); let b = bin(lo); for (let i = 0; i < c; i++) { masks[o + b] = 1; b = b + 1 === B ? 0 : b + 1; } };
    for (const h of plan.hands) {
      if (h.dead || (pass(h.st[k]) && pass(h.st[Math.max(0, k - hd)]) && pass(h.st[k2]))) continue;
      const a = h.ang[k0], b = h.ang[k], c = h.ang[k2];
      const lo = Math.min(a, b, c) - h.w - pad, hi = Math.max(a, b, c) + h.w + pad;
      cover(lo, hi); if (cfg.twin && h.kind !== 1) cover(-hi, -lo);
    }
    for (const a of plan.arcs) if (t >= a.t1 - 0.1 && t <= a.t2 + 0.1) { const c = a.c + a.om * t, lo = c - a.hw - TU.solver.arcPad, hi = c + a.hw + TU.solver.arcPad; cover(lo, hi); if (cfg.twin) cover(-hi, -lo); }
    const sp = TU.pSpeed * (cfg.tide ? 1 + cfg.tide.amp * Math.sin((TAU * t) / cfg.tide.per) : 1);
    cum += sp / hz / bs; mvs[s] = Math.floor(cum) - moved; moved += mvs[s];
  }
  for (let b = 0; b < B; b++) via[(steps + 1) * B + b] = masks[(steps + 1) * B + b] ? 0 : 1;
  for (let s = steps; s >= 0; s--) {
    const o = s * B, o1 = o + B, mv = mvs[s];
    for (let b = 0; b < B; b++) {
      if (masks[o + b]) continue;
      let ok = 0;
      for (const d of [1, -1]) {
        let f = 1, x = b;
        for (let m = 0; m < mv; m++) { x = (x + d + B) % B; if (masks[o + x]) { f = 0; break; } }
        if (f && via[o1 + x]) ok |= d === 1 ? 1 : 2;
      }
      via[o + b] = ok;
    }
  }
  return { via, masks, mvs, steps, B, hz, bs };
}

// Vérifie qu'un chemin existe avec des marges humaines (propagation d'états atteignables).
export function solve(plan: Plan, pA: number, pad = TU.solver.pad): boolean {
  const B = TU.solver.bins, hz = TU.solver.hz, SR = TU.SR, cfg = plan.cfg;
  const al0 = new Uint8Array(B), al1 = new Uint8Array(B), mask = new Uint8Array(B);
  const bs = TAU / B;
  const bin = (x: number) => Math.floor(norm(x) / bs) % B;
  al0[bin(pA)] = 1; al1[bin(pA)] = 1;
  const steps = Math.floor(plan.dur * hz), kd = Math.round(SR / hz), hd = Math.round(TU.solver.hollowDelay * SR);
  const cover = (lo: number, hi: number) => {
    const c = Math.min(B, Math.ceil((hi - lo) / bs) + 1);
    let b = bin(lo);
    for (let i = 0; i < c; i++) { mask[b] = 1; b = b + 1 === B ? 0 : b + 1; }
  };
  const pass = (x: number) => x === 3 || x === 7 || x === 0;
  let cum = 0, moved = 0;
  for (let s = 0; s <= steps; s++) {
    const t = s / hz, k = Math.min(plan.n - 1, Math.round(t * SR));
    const k2 = Math.min(plan.n - 1, k + kd), k0 = Math.max(0, k - kd);
    mask.fill(0);
    for (const h of plan.hands) {
      if (pass(h.st[k]) && pass(h.st[Math.max(0, k - hd)]) && pass(h.st[k2])) continue;
      const a = h.ang[k0], b = h.ang[k], c = h.ang[k2];
      const lo = Math.min(a, b, c) - h.w - pad, hi = Math.max(a, b, c) + h.w + pad;
      cover(lo, hi); if (cfg.twin && h.kind !== 1) cover(-hi, -lo);
    }
    for (const a of plan.arcs) {
      if (t >= a.t1 - 0.1 && t <= a.t2 + 0.1) { const c = a.c + a.om * t, lo = c - a.hw - TU.solver.arcPad, hi = c + a.hw + TU.solver.arcPad; cover(lo, hi); if (cfg.twin) cover(-hi, -lo); }
    }
    let any = 0;
    for (let b = 0; b < B; b++) {
      if (mask[b]) { al0[b] = 0; al1[b] = 0; }
      else if (al0[b] | al1[b]) { al0[b] = 1; al1[b] = 1; any = 1; }
    }
    if (!any) return false;
    const sp = TU.pSpeed * (cfg.tide ? 1 + cfg.tide.amp * Math.sin((TAU * t) / cfg.tide.per) : 1);
    cum += sp / hz / bs;
    const mv = Math.floor(cum) - moved; moved += mv;
    for (let m = 0; m < mv; m++) {
      const l0 = al0[B - 1];
      for (let b = B - 1; b > 0; b--) al0[b] = al0[b - 1];
      al0[0] = l0;
      const f1 = al1[0];
      for (let b = 0; b < B - 1; b++) al1[b] = al1[b + 1];
      al1[B - 1] = f1;
      for (let b = 0; b < B; b++) if (mask[b]) { al0[b] = 0; al1[b] = 0; }
    }
  }
  for (let b = 0; b < B; b++) if (al0[b] | al1[b]) return true;
  return false;
}
