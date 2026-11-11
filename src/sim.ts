import { TAU, TU } from './tuning';
import { mkRng, Rng, wrap, norm } from './rng';
import { CITIES, KANAZAWA, TAKAYAMA, CityCfg, Plan, genPlan } from './cities';
import { solve } from './solver';
import { COMPS, COMP, Comp } from './comps';

export interface Perks { idx: number; graze: number; combo: number; hit: number; rou: number; reroll: number; bonus: number; pick: number; quartz: boolean }
export const NOPERKS: Perks = { idx: 0, graze: 0, combo: 0, hit: 0, rou: 0, reroll: 0, bonus: 0, pick: 0, quartz: false };
export interface SimOpts { seed: number; secA: number; startA: number[]; pA: number; night?: boolean; daily?: boolean; perks?: Perks }
export interface Ev { t: string; a?: number; v?: number; s?: string }
export interface Card { id: string; lvl: number; enclume?: boolean }
export type SimState = 'run' | 'pick' | 'dead' | 'won';

const HN = 96;

export class Sim {
  o: SimOpts; perks: Perks; rng: Rng; seed: number;
  route: CityCfg[]; ci = 0; plan!: Plan; T = 0; time = 0; cityTime = 0;
  a: number; dir = 1; ring = 0; state: SimState = 'run';
  score = 0; banked = 0; combo = 0; comboT = 0; streak = 0; lit = -1; litT = 0;
  mods: Record<string, number> = {};
  lives = 0; livesUsed = 0; damaged = false; invuln = 0; air = 0; off = 0;
  gauge = 0; held = false; heldT = 0; slowOn = false; lastPress = -9; lobCd = 0; lunCd = 0;
  grazeSlow = 0; vitreLeft = 0; doses = 0; shotT = 0; tapis = false; enclumes = 0; rerolls = 1;
  pim = 0; pims: { h: number; t: number }[] = []; pimNext = 5;
  bountyN = 0; fund = 0; picksTotal = 0; eclipse = false;
  flipsCity = 0; grazesCity = 0; grazes = 0; perfects = 0; cleared = 0; lobs = 0; bounties = 0; maxPim = 0;
  wonTokyo = false; cause = ''; genTries = 0; lastTk = -1; acc = 0; skip = 2;
  prevRel = new Float32Array(16); prevRel2 = new Float32Array(16); gcd = new Float32Array(16);
  hT = new Float32Array(HN); hA = new Float32Array(HN); hD = new Int8Array(HN); hi = 0; hc = 0; hAcc = 0;
  ev: Ev[] = []; cards: Card[] = [];
  allyA = 0; lastHitHand = -1;

  constructor(o: SimOpts) {
    this.o = o; this.perks = o.perks || NOPERKS; this.seed = o.seed; this.rng = mkRng(o.seed ^ 0x9e3779b9);
    this.route = CITIES.slice();
    if (o.night && !o.daily) this.route.splice(1, 0, TAKAYAMA);
    this.a = o.pA; this.rerolls = 1 + this.perks.reroll;
    this.beginCity(true);
  }
  get cfg() { return this.plan.cfg; }
  get cityNo() { return this.ci + 1; }
  lvl(id: string) { return (this.mods[id] | 0) - 1; }
  has(id: string) { return (this.mods[id] | 0) > 0; }
  nComps() { let n = 0; for (const k in this.mods) if (this.mods[k] && k !== 'cacio') n++; return n; }

  beginCity(first: boolean) {
    const cfg = this.route[this.ci];
    const quartz = this.has('quartz') || this.perks.quartz;
    const holMul = this.has('squel') ? [1.4, 1.6, 1.8][this.lvl('squel')] : 1;
    let plan!: Plan, tr = 0;
    const N = TU.solver.tries;
    for (; tr < N * 2; tr++) {
      const hard = tr >= N;
      plan = genPlan(cfg, (this.seed * 7919 + this.ci * 104729 + tr * 31) >>> 0, {
        secA: first ? this.o.secA : this.a + Math.PI, startA: first && !hard ? this.o.startA : undefined,
        holMul: holMul * (hard ? 1.6 : 1), quartz, ease: hard ? 3 + (tr - N) / 6 : tr < 10 ? 0 : (tr - 10) / 8,
      });
      if (solve(plan, this.a)) break;
    }
    this.genTries = tr; this.plan = plan;
    this.T = 0; this.cityTime = 0; this.lastTk = -1; this.off = 0; this.skip = 3;
    this.flipsCity = 0; this.grazesCity = 0; this.damaged = false; this.pim = 0; this.pims = []; this.pimNext = 4;
    this.bountyN = 0; this.gcd.fill(0);
    this.vitreLeft = this.has('vitre') ? this.lvl('vitre') + 1 : 0;
    if (this.has('bounty') && plan.hands.length > 1) plan.hands[1].gold = true;
    if (this.doses > 0) { this.doses--; this.shotT = TU.shot.dur; this.e('shot'); }
    this.banked = this.score;
    this.relight();
    this.e('city', this.ci);
  }

  e(t: string, v?: number, a?: number, s?: string) { this.ev.push({ t, v, a, s }); }
  hAng(i: number, T: number) {
    const h = this.plan.hands[i]; let x = T * TU.SR; if (x < 0) x = 0;
    let k = Math.floor(x); if (k > this.plan.n - 2) k = this.plan.n - 2;
    const f = Math.min(1, x - k);
    return h.ang[k] + (h.ang[k + 1] - h.ang[k]) * f + (i > 0 ? this.off : 0);
  }
  hSt(i: number, T: number) {
    const h = this.plan.hands[i]; if (h.dead) return 0;
    let k = Math.floor(T * TU.SR); if (k < 0) k = 0; if (k > this.plan.n - 1) k = this.plan.n - 1;
    return h.st[k];
  }
  pHit() { return TU.pHit * (this.has('b39') ? 0.62 : 1) * (this.has('b44') ? 2.3 : 1) * (1 - this.perks.hit); }
  baseTs() {
    let ts = 1;
    if (this.has('lev40')) ts *= TU.levier.ts[2]; else if (this.has('lev10')) ts *= TU.levier.ts[1]; else if (this.has('lev3')) ts *= TU.levier.ts[0];
    if (this.shotT > 0) ts *= TU.shot.ts;
    return ts;
  }
  mult() {
    let m = 1;
    if (this.has('tourb')) m *= 1.5;
    if (this.has('b44')) m *= 2;
    if (this.has('quartz')) m *= 0.5;
    if (this.has('lev40')) m *= 40; else if (this.has('lev10')) m *= 10; else if (this.has('lev3')) m *= 3;
    if (this.shotT > 0) m *= TU.shot.mult;
    m *= 1 + TU.piment.mult * this.pim;
    if (this.has('bravoure')) m *= 1 + 0.25 * this.enclumes;
    return m;
  }
  add(base: number) { this.score += Math.round(base * this.mult()); }
  pSpeed() {
    let sp = TU.pSpeed * (1 + TU.piment.speed * this.pim);
    const td = this.cfg.tide; if (td) sp *= 1 + td.amp * Math.sin((TAU * this.T) / td.per);
    if (this.ring) sp *= TU.innerSpeed;
    return sp;
  }
  relight() {
    const h0 = Math.round(norm(this.a) / (TAU / 12));
    const sec = this.hAng(0, this.T + 1.5);
    for (let tr = 0; tr < 8; tr++) {
      const h = (((h0 + (this.rng() < 0.5 ? -1 : 1) * (2 + Math.floor(this.rng() * 4))) % 12) + 12) % 12;
      if (h === this.lit) continue;
      if (Math.abs(wrap(h * (TAU / 12) - sec)) < 0.3 && tr < 7) continue;
      this.lit = h; break;
    }
    this.litT = TU.index.litTimeout;
  }

  press() {
    if (this.state !== 'run') return;
    if (this.has('inception') && this.time - this.lastPress < 0.24) { this.ring ^= 1; this.e('ring'); }
    this.lastPress = this.time; this.dir = -this.dir; this.flipsCity++; this.held = true; this.heldT = 0; this.e('flip');
  }
  release() {
    if (!this.held) return;
    this.held = false;
    if (this.state === 'run' && this.has('bandeja') && this.heldT > 0.16 && this.lobCd <= 0) {
      this.air = TU.lobAir; this.lobCd = TU.lobCd[this.lvl('bandeja')]; this.lobs++; this.e('lob');
    }
  }
  swipe(s: number) {
    if (this.state !== 'run' || !this.has('lunette') || this.lunCd > 0) return;
    this.dir = -this.dir; this.off += (s * TAU) / 12; this.lunCd = TU.lunetteCd[this.lvl('lunette')];
    this.invuln = Math.max(this.invuln, 0.5); this.skip = 3; this.e('lunette');
  }

  private hazard(pa: number, rel: Float32Array, real: boolean): number {
    // retourne 0 rien, >0 main i+1, <0 arc -(kind+1)
    const T = this.T, ph = this.pHit(), hs = this.plan.hands; let hit = 0;
    const gz = TU.graze.zone * (1 + this.perks.graze) * (this.has('repet') ? [1.5, 1.8, 2.1][this.lvl('repet')] : 1);
    const sweep = this.skip <= 0 && !this.has('morte');
    for (let i = real ? 0 : 1; i < hs.length; i++) {
      const st = this.hSt(i, T), r = wrap(pa - this.hAng(i, T)), lim = hs[i].w + ph;
      const armed = st === 1 || st === 2, ar = Math.abs(r);
      if (armed && this.air <= 0) {
        if (ar < lim || (sweep && rel[i] * r < 0 && ar < 0.5 && Math.abs(rel[i]) < 0.5)) { if (!hit) hit = i + 1; }
        else if (real && ar < lim + gz && this.gcd[i] <= 0 && this.invuln <= 0) {
          this.gcd[i] = TU.graze.cd; this.grazes++; this.grazesCity++;
          this.add(TU.graze.pts * this.cityNo); this.grazeSlow = TU.graze.slowT; this.e('graze', i, pa);
          if (hs[i].gold) {
            this.bountyN++;
            if (this.bountyN >= 3) { hs[i].dead = true; this.bounties++; this.add(1500 * this.cityNo * (this.lvl('bounty') + 1)); this.e('bounty', i, pa); }
          }
        }
      }
      rel[i] = armed ? r : 0;
    }
    if (hit || this.air > 0 || this.ring) return hit;
    for (const a of this.plan.arcs) {
      if (a.t0 > T) break;
      if (T >= a.t1 && T < a.t2 && Math.abs(wrap(pa - a.c - a.om * T)) < a.hw - 0.012 + (a.kind === 2 ? ph : 0)) return -(a.kind + 1);
    }
    return 0;
  }

  step() {
    if (this.state !== 'run') return;
    const dt = TU.DT, ix = TU.index;
    let ts = this.baseTs();
    this.slowOn = false;
    if (this.held) {
      this.heldT += dt;
      if (this.heldT > 0.16 && this.has('chrono') && this.gauge > 0) { ts *= TU.chrono.k; this.gauge -= dt; this.slowOn = true; }
    }
    if (this.grazeSlow > 0) { this.grazeSlow -= dt; ts *= TU.graze.slowK; }
    const d = dt * ts;
    this.T += d; this.time += dt; this.cityTime += dt;
    if (this.skip > 0) this.skip--;
    const tk = Math.floor(this.T * TU.tickHz);
    const ticked = tk !== this.lastTk;
    if (ticked) { this.lastTk = tk; this.e('tick', tk); }
    const mv = this.pSpeed() * d * this.dir;
    if (this.has('morte')) { this.acc += mv; if (ticked) { this.a += this.acc; this.acc = 0; } } else this.a += mv;
    if (this.air > 0) this.air -= d;
    if (this.invuln > 0) this.invuln -= d;
    if (this.lobCd > 0) this.lobCd -= d;
    if (this.lunCd > 0) this.lunCd -= d;
    if (this.shotT > 0) this.shotT -= d;
    for (let i = 0; i < this.gcd.length; i++) if (this.gcd[i] > 0) this.gcd[i] -= d;
    if (this.has('lune')) {
      const P = TU.lune.per[this.lvl('lune')], phs = this.time % P;
      const on = phs > P - TU.lune.dur;
      if (on && !this.eclipse) { this.invuln = Math.max(this.invuln, TU.lune.dur); this.e('eclipse'); }
      this.eclipse = on;
    }
    // dangers
    let hz = this.hazard(this.a, this.prevRel, true);
    if (!hz && this.cfg.twin) { hz = this.hazard(-this.a, this.prevRel2, false); if (hz) this.cause = 'twin'; }
    if (hz && this.invuln <= 0) this.onHit(hz);
    if (this.state !== 'run') return;
    // funding
    if (this.has('funding')) {
      let near = 9;
      for (let i = 0; i < this.plan.hands.length; i++) { const st = this.hSt(i, this.T); if (st === 1 || st === 2) near = Math.min(near, Math.abs(wrap(this.a - this.hAng(i, this.T)))); }
      if (near < 0.5) { this.fund += dt * 30 * this.cityNo * (this.lvl('funding') + 1); if (this.fund >= 10) { this.add(10); this.fund -= 10; } }
    }
    // index
    const pr = ix.pickR * (1 + this.perks.pick) * (this.has('rattrap') ? [2, 2.6, 3.2][this.lvl('rattrap')] : 1);
    if (!this.ring) {
      const la = this.lit * (TAU / 12);
      let got = Math.abs(wrap(this.a - la)) < pr;
      if (this.has('gmt')) {
        this.allyA = this.a - this.dir * (0.5 + 0.2 * this.lvl('gmt'));
        if (Math.abs(wrap(this.allyA - la)) < pr) got = true;
        if (this.lvl('gmt') >= 1 && Math.abs(wrap(this.a + this.dir * 0.5 - la)) < pr) got = true;
      }
      if (got) this.pick(la);
      if (this.pims.length) {
        for (let i = this.pims.length - 1; i >= 0; i--) {
          const p = this.pims[i]; p.t -= d;
          if (Math.abs(wrap(this.a - p.h * (TAU / 12))) < pr) {
            this.pims.splice(i, 1); this.pim = Math.min(TU.piment.max, this.pim + 1); this.maxPim = Math.max(this.maxPim, this.pim);
            this.e('piment', this.pim, this.a);
          } else if (p.t <= 0) this.pims.splice(i, 1);
        }
      }
    }
    if (this.cfg.piments) {
      this.pimNext -= d;
      if (this.pimNext <= 0 && this.T < this.plan.dur - 6) {
        this.pimNext = TU.piment.gap[0] + this.rng() * (TU.piment.gap[1] - TU.piment.gap[0]);
        const h = Math.floor(this.rng() * 12);
        if (h !== this.lit && Math.abs(wrap(this.a - h * (TAU / 12))) > 0.5) this.pims.push({ h, t: TU.piment.life });
      }
    }
    if (this.combo > 0) { this.comboT -= d; if (this.comboT <= 0) { this.combo = 0; this.streak = 0; this.e('break'); } }
    this.litT -= d;
    if (this.litT <= 0) { if (this.combo > 0) this.e('break'); this.combo = 0; this.streak = 0; this.relight(); }
    // historique
    this.hAcc += dt;
    if (this.hAcc >= 1 / 30) { this.hAcc = 0; this.hT[this.hi] = this.T; this.hA[this.hi] = this.a; this.hD[this.hi] = this.dir; this.hi = (this.hi + 1) % HN; if (this.hc < HN) this.hc++; }
    if (this.T >= this.plan.dur) this.clearCity();
  }

  pick(la: number) {
    const ix = TU.index;
    this.combo++; this.streak++; this.picksTotal++;
    this.comboT = (ix.comboTime + this.perks.combo) * (this.has('barillet') ? [1.5, 2, 3][this.lvl('barillet')] : 1);
    const m = 1 + ix.comboStep * Math.min(this.combo - 1, ix.comboMax);
    this.add(ix.pts * m * (1 + this.perks.idx) * (this.has('gdate') ? [2, 2.5, 3][this.lvl('gdate')] : 1));
    if (this.has('chrono')) this.gauge = Math.min(TU.chrono.gauge[this.lvl('chrono')], this.gauge + TU.chrono.perIdx);
    this.e('index', this.combo, la);
    if (this.streak % 12 === 0) { this.perfects++; this.add(ix.perfect * this.cityNo); this.e('perfect'); }
    if (this.has('remont') && this.picksTotal % 12 === 0 && this.lives < 3) { this.lives++; this.e('life'); }
    this.relight();
  }

  onHit(hz: number) {
    const liq = this.has('lev40');
    const cause = hz > 0 ? (this.cause === 'twin' ? 'twin' : hz === 1 ? 'sec' : this.plan.hands[hz - 1].kind === 2 ? 'panda' : 'hand') : this.cause === 'twin' ? 'twin' : ['laser', 'crowd', 'spark'][-hz - 1];
    this.cause = '';
    if (!liq && hz > 0 && this.vitreLeft > 0) {
      this.vitreLeft--; this.dir = -this.dir; this.a += this.dir * 0.12; this.invuln = 0.6; this.skip = 3; this.damaged = true; this.e('bounce', hz - 1, this.a); return;
    }
    if (!liq && this.lives > 0) {
      this.lives--; this.livesUsed++; this.damaged = true;
      // rembobine
      let best = -1, bt = 1e9; const target = Math.max(0, this.T - TU.rewind);
      for (let i = 0; i < this.hc; i++) { const dd = Math.abs(this.hT[i] - target); if (this.hT[i] <= this.T && dd < bt) { bt = dd; best = i; } }
      if (best >= 0) { this.T = this.hT[best]; this.a = this.hA[best]; this.dir = this.hD[best]; }
      this.acc = 0; this.invuln = 1.6; this.skip = 3; this.lastTk = Math.floor(this.T * TU.tickHz); this.e('rewind'); return;
    }
    this.state = 'dead'; this.cause = liq ? 'liq' : cause;
    if (this.tapis) this.score = Math.max(0, this.score - this.banked);
    this.e('death', hz, this.a, this.cause);
  }

  clearCity() {
    this.cleared++;
    this.add(TU.cityBonus * this.cityNo * (1 + this.perks.bonus));
    if (this.tapis) {
      if (!this.damaged) { this.score += this.banked * 2; this.e('tapis', 1); } else { this.score = Math.max(0, this.score - this.banked); this.e('tapis', 0); }
      this.tapis = false; this.mods.tapis = 0;
    }
    const id = this.cfg.id;
    this.e('clear', this.ci, 0, id);
    if (id === 'tyo') {
      this.wonTokyo = true;
      if (this.livesUsed === 0 && !this.o.daily) this.route.push(KANAZAWA);
    }
    if (this.ci >= this.route.length - 1) { this.state = 'won'; this.e('won'); return; }
    if (this.has('cacio') && this.nComps() >= 3) { this.add(300 * this.cityNo); this.next(); return; }
    this.cards = this.offer();
    this.state = 'pick'; this.held = false;
  }

  eligible(c: Comp) {
    const own = this.mods[c.id] | 0, m = this.mods;
    if (c.id === 'cacio') return !own && this.nComps() <= 2;
    if (own) return c.fixed == null && own < 3;
    if (c.id === 'lev3') return !m.lev10 && !m.lev40;
    if (c.id === 'lev10') return !m.lev40;
    if (c.id === 'b39') return !m.b44;
    if (c.id === 'b44') return !m.b39;
    if (c.id === 'lumi') return true;
    return true;
  }
  rollLvl(c: Comp, boost = 0) {
    if (c.fixed != null) return c.fixed;
    const r = this.rng(), ci = this.ci;
    let l = r < 0.05 + 0.02 * ci ? 2 : r < 0.3 + 0.05 * ci ? 1 : 0;
    l = Math.max(l, c.min || 0, this.mods[c.id] | 0) + boost;
    if (this.has('cacio')) l++;
    return Math.min(2, l);
  }
  offer(): Card[] {
    const pool = COMPS.filter((c) => this.eligible(c));
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(this.rng() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    return pool.slice(0, 3).map((c) => ({ id: c.id, lvl: this.rollLvl(c) }));
  }
  reroll() { if (this.state !== 'pick' || this.rerolls <= 0) return false; this.rerolls--; this.cards = this.offer(); return true; }
  choose(i: number): Card | null {
    if (this.state !== 'pick') return null;
    let card: Card;
    if (i < 0) {
      const pool = COMPS.filter((c) => this.eligible(c));
      const c = pool[Math.floor(this.rng() * pool.length)];
      card = { id: c.id, lvl: this.rollLvl(c, this.rng() < 0.4 ? 1 : 0), enclume: true };
      this.enclumes++; this.score += Math.round(400 * this.cityNo * (this.has('bravoure') ? 1 + this.enclumes : 1));
    } else card = this.cards[i];
    if (!card) return null;
    this.apply(card.id, card.lvl);
    this.next();
    return card;
  }
  apply(id: string, lvl: number) {
    const had = this.mods[id] | 0;
    this.mods[id] = lvl + 1;
    if (id === 'reserve') this.lives += had ? 1 : lvl + 1;
    if (id === 'shot') this.doses = 3;
    if (id === 'tapis') this.tapis = true;
    if (id === 'chrono') this.gauge = TU.chrono.gauge[lvl];
    if (id === 'lev10' || id === 'lev40') { this.mods.lev3 = 0; if (id === 'lev40') this.mods.lev10 = 0; }
    if (id === 'cacio') for (const k in this.mods) if (this.mods[k] && COMP[k].fixed == null) this.mods[k] = Math.min(3, this.mods[k] + 1);
  }
  next() { this.ci++; this.state = 'run'; this.beginCity(false); }
}
