// Audio 100 % procédural.
import type { CityCfg } from './cities';

const mtof = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

export class Snd {
  ctx: AudioContext | null = null; master!: GainNode; mus!: GainNode; sfx!: GainNode; noise!: AudioBuffer;
  muted = false; pad: OscillatorNode[] = []; padG!: GainNode; padF!: BiquadFilterNode;
  wG: GainNode | null = null; wP: StereoPannerNode | null = null; last808 = 0;

  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const AC = (window as any).AudioContext || (window as any).webkitAudioContext; if (!AC) return;
      const ctx: AudioContext = new AC({ latencyHint: 'interactive' }); this.ctx = ctx;
      const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 4; comp.knee.value = 12; comp.attack.value = 0.004; comp.release.value = 0.16; comp.connect(ctx.destination);
      const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 32; hp.connect(comp); const ls = ctx.createBiquadFilter(); ls.type = 'lowshelf'; ls.frequency.value = 110; ls.gain.value = 4.5; ls.connect(hp); const hs = ctx.createBiquadFilter(); hs.type = 'highshelf'; hs.frequency.value = 6500; hs.gain.value = -2; hs.connect(ls);
      this.master = ctx.createGain(); this.master.gain.value = this.muted ? 0 : 0.9; this.master.connect(hs);
      this.mus = ctx.createGain(); this.mus.gain.value = 0.8; this.mus.connect(this.master);
      this.sfx = ctx.createGain(); this.sfx.gain.value = 0.9; this.sfx.connect(this.master);
      const nb = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), d = nb.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      this.noise = nb;
      this.padF = ctx.createBiquadFilter(); this.padF.type = 'lowpass'; this.padF.frequency.value = 500; this.padF.Q.value = 1;
      this.padG = ctx.createGain(); this.padG.gain.value = 0; this.padF.connect(this.padG); this.padG.connect(this.mus);
      for (let i = 0; i < 4; i++) { const o = ctx.createOscillator(); o.type = i === 3 ? 'triangle' : 'sawtooth'; o.detune.value = (i - 1.5) * 7; o.frequency.value = 110; o.connect(this.padF); o.start(); this.pad.push(o); }
      const ws = ctx.createBufferSource(); ws.buffer = nb; ws.loop = true;
      const wf = ctx.createBiquadFilter(); wf.type = 'bandpass'; wf.frequency.value = 420; wf.Q.value = 0.8;
      this.wG = ctx.createGain(); this.wG.gain.value = 0;
      ws.connect(wf); wf.connect(this.wG);
      if (ctx.createStereoPanner) { this.wP = ctx.createStereoPanner(); this.wG.connect(this.wP); this.wP.connect(this.sfx); } else this.wG.connect(this.sfx);
      ws.start();
    } catch { this.ctx = null; }
  }
  setMute(m: boolean) { this.muted = m; if (this.ctx) this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.02); }
  get t() { return this.ctx ? this.ctx.currentTime + 0.012 : 0; }

  private env(g: GainNode, t: number, v: number, a: number, d: number) { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
  nz(t: number, v: number, dur: number, type: BiquadFilterType, f: number, q = 1, f2 = 0, out?: AudioNode) {
    const c = this.ctx; if (!c) return;
    const s = c.createBufferSource(); s.buffer = this.noise; s.loop = true;
    const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, t); fl.Q.value = q;
    if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
    const g = c.createGain(); this.env(g, t, v, 0.002, dur);
    s.connect(fl); fl.connect(g); g.connect(out || this.sfx); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
  }
  tone(t: number, f: number, v: number, dur: number, type: OscillatorType = 'sine', f2 = 0, out?: AudioNode, a = 0.003, cut = 0) {
    const c = this.ctx; if (!c) return;
    const o = c.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(1, f2), t + dur);
    const g = c.createGain(); this.env(g, t, v, a, dur);
    if (cut) { const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.setValueAtTime(cut, t); fl.frequency.exponentialRampToValueAtTime(Math.max(80, cut * 0.25), t + dur); o.connect(fl); fl.connect(g); } else o.connect(g);
    g.connect(out || this.sfx); o.start(t); o.stop(t + a + dur + 0.05);
  }
  hat(t: number, v: number, open = false) { this.nz(t, v, open ? 0.22 : 0.028, 'highpass', 7500, 0.7, 0, this.mus); }
  k808(t: number, m: number, v: number, glide = 0, long = 0.55) {
    const c = this.ctx; if (!c) return; const f = mtof(m);
    const o = c.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(f * 2.6, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.045);
    if (glide) o.frequency.exponentialRampToValueAtTime(mtof(m + glide), t + long * 0.8);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + long);
    const sh = c.createWaveShaper(); const cu = new Float32Array(64); for (let i = 0; i < 64; i++) { const x = i / 31.5 - 1; cu[i] = Math.tanh(x * 2.4); } sh.curve = cu;
    o.connect(sh); sh.connect(g); g.connect(this.mus); o.start(t); o.stop(t + long + 0.05);
    this.nz(t, v * 0.25, 0.012, 'lowpass', 2500, 0.5, 0, this.mus);
  }
  snare(t: number, v: number) { this.nz(t, v, 0.13, 'bandpass', 1900, 0.7, 0, this.mus); this.nz(t, v * 0.5, 0.09, 'highpass', 5000, 0.5, 0, this.mus); this.tone(t, 210, v * 0.5, 0.07, 'triangle', 140, this.mus); }

  // Un pas de séquenceur (double-croche). mode : 0 veille (tic-tac), 1 jeu, 2 silence (tic-tac seul).
  step(n: number, mode: number, cfg: CityCfg | null, ci: number, tension: number) {
    const c = this.ctx; if (!c || this.muted) return; const t = this.t;
    const st = ((n % 16) + 16) % 16, bar = Math.floor(n / 16) & 3;
    if (mode !== 1 || !cfg) {
      this.nz(t, 0.11, 0.016, 'bandpass', n % 2 ? 5200 : 3900, 6); this.tone(t, n % 2 ? 2900 : 2300, 0.035, 0.012, 'square');
      this.padG.gain.setTargetAtTime(0, t, 0.08); return;
    }
    const root = cfg.root, sc = cfg.scale, deg = (i: number) => sc[((i % sc.length) + sc.length) % sc.length] + 12 * Math.floor(i / sc.length);
    // charley : le tic-tac
    this.hat(t, st % 4 === 2 ? 0.16 : st % 2 ? 0.07 : 0.11);
    if (ci >= 1 && ((bar % 2 === 1 && st >= 12) || (ci >= 4 && st === 6) || (ci >= 6 && (st === 3 || st === 11)))) this.hat(t + 0.0625, 0.07);
    if (ci >= 3 && st === 10 && bar % 2 === 0) this.hat(t, 0.08, true);
    // 808
    const pat = cfg.beat ? [[0, 4, 8, 12], [0, 4, 8, 12, 14], [0, 4, 8, 12], [0, 4, 8, 11, 12, 14]][bar] : [[0, 7, 10], [0, 6], [0, 7, 10, 13], [0, 3, 6, 11]][bar];
    const pi = pat.indexOf(st);
    if (pi >= 0) {
      const prog = [0, 0, -2, 1][bar];
      const last = pi === pat.length - 1 && pat.length > 2;
      this.k808(t, root - 12 + (pi && !cfg.beat ? deg(prog + (pi % 2 ? 0 : 2)) - sc[0] : deg(prog)), 0.5, last ? (bar === 3 ? 12 : -5) : 0, cfg.beat ? 0.32 : 0.6);
    }
    if (st === 8 || (bar === 3 && st === 14 && ci >= 2)) this.snare(t, st === 8 ? 0.32 : 0.14);
    // nappe
    if (st === 0) {
      const prog = [0, 5, 3, 4][bar];
      [0, 2, 4, 0].forEach((d, i) => this.pad[i].frequency.setTargetAtTime(mtof(root + 12 + deg(prog + d) - (i === 3 ? 12 : 0)), t, 0.06));
      this.padG.gain.setTargetAtTime(0.05 + 0.012 * Math.min(ci, 6), t, 0.4);
    }
    this.padF.frequency.setTargetAtTime(380 + 2200 * tension + 90 * ci, t, 0.15);
    // couleur de la ville
    if (ci >= 1) {
      const h = (cfg.id.charCodeAt(0) * 7 + cfg.id.charCodeAt(1) * 13 + cfg.id.charCodeAt(2)) | 0;
      const mask = [0x8892, 0xa4a5, 0x9249, 0xb5ad, 0x8888, 0xdb6d][h % 6];
      if ((mask >> st) & 1) {
        const i = (h + st * 3 + bar * 2) % 7;
        const wave: OscillatorType = (['triangle', 'square', 'sawtooth', 'triangle'] as OscillatorType[])[h % 4];
        this.tone(t, mtof(root + 24 + deg(i)), 0.055, 0.16, wave, 0, this.mus, 0.003, 2600 + tension * 2500);
      }
      if (ci >= 4 && st % 4 === 3) this.tone(t, mtof(root + 36 + deg((bar * 3 + st) % 5)), 0.03, 0.3, 'sine', 0, this.mus);
    }
  }
  quiet() { if (this.ctx) this.padG.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05); this.whoosh(0, 0); }
  whoosh(g: number, pan: number) { if (!this.ctx || !this.wG) return; this.wG.gain.setTargetAtTime(g, this.ctx.currentTime, 0.05); if (this.wP) this.wP.pan.setTargetAtTime(Math.max(-1, Math.min(1, pan)), this.ctx.currentTime, 0.05); }

  flip() { this.tone(this.t, 1500, 0.07, 0.03, 'sine', 800); }
  index(combo: number, cfg: CityCfg | null) { const sc = cfg ? cfg.scale : [0, 3, 5, 7, 10]; const i = (combo - 1) % (sc.length * 2); const m = (cfg ? cfg.root : 40) + 36 + sc[i % sc.length] + 12 * Math.floor(i / sc.length); this.tone(this.t, mtof(m), 0.16, 0.35, 'sine'); this.tone(this.t, mtof(m) * 2.01, 0.05, 0.2, 'sine'); }
  graze() { this.nz(this.t, 0.22, 0.16, 'bandpass', 900, 3, 5200); this.tone(this.t, 2400, 0.05, 0.1, 'sine', 3600); }
  death() { const t = this.t; this.tone(t, 260, 0.45, 0.55, 'sawtooth', 32, undefined, 0.003, 1800); this.nz(t, 0.4, 0.3, 'lowpass', 3000, 0.5, 200); }
  rewind() { this.tone(this.t, 200, 0.2, 0.3, 'sawtooth', 1600, undefined, 0.003, 3000); }
  city(sig = 0) { const t = this.t, root = 57 + [0, 2, -2, 3, -4, 5, 0, -5, 7, 4, -3][sig % 11], ch = [[0, 7, 12, 19], [0, 7, 14, 19], [0, 5, 12, 17], [0, 7, 12, 16], [0, 3, 10, 15]][sig % 5]; ch.forEach((d, i) => { this.tone(t + i * 0.06, mtof(root + d), 0.11, 0.9, 'triangle'); this.tone(t + i * 0.06, mtof(root + d + 12), 0.03, 0.5, 'sine'); }); this.tone(t, 82, 0.45, 0.6, 'sine', 33); }
  card() { const t = this.t; this.tone(t, 660, 0.12, 0.12, 'triangle'); this.tone(t + 0.07, 990, 0.12, 0.2, 'triangle'); }
  anvil() { const t = this.t; this.tone(t, 1240, 0.2, 0.7, 'sine'); this.tone(t, 1873, 0.12, 0.5, 'sine'); this.nz(t, 0.3, 0.04, 'highpass', 3000); }
  chime() { const t = this.t; this.tone(t, 1568, 0.07, 0.25, 'sine'); this.tone(t + 0.09, 2093, 0.06, 0.3, 'sine'); }
  bounce() { const t = this.t; this.tone(t, 520, 0.4, 0.07, 'sine', 180); this.nz(t, 0.3, 0.02, 'bandpass', 1800, 2); }
  lob() { this.tone(this.t, 300, 0.15, 0.3, 'sine', 900); }
  perfect() { const t = this.t; [0, 4, 7, 12, 16].forEach((d, i) => this.tone(t + i * 0.06, mtof(72 + d), 0.12, 0.3, 'triangle')); }
  buy() { const t = this.t; this.tone(t, 1320, 0.12, 0.1, 'square'); this.tone(t + 0.08, 1760, 0.12, 0.25, 'square'); }
  err() { this.tone(this.t, 110, 0.2, 0.15, 'square'); }
  piment() { this.tone(this.t, 500, 0.15, 0.2, 'sawtooth', 1500, undefined, 0.003, 3000); }
  tele() { this.tone(this.t, 880, 0.035, 0.08, 'square'); }
  click() { const t = this.t; this.tone(t, 2637, 0.05, 0.05, 'sine'); this.tone(t, 3951, 0.03, 0.03, 'sine'); this.tone(t, 5274, 0.014, 0.02, 'sine'); }
}
