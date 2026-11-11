// Ambiance 100 % procédurale : pluie, transformateurs, grésillement, ville lointaine, nappe lo-fi qui gagne un instrument par quartier.
let ac: AudioContext | null = null, out: GainNode, music: GainNode, nb: AudioBuffer, hum: GainNode, rev: ConvolverNode; let layers = 0, lvl = 0;
export function initAudio() {
  if (ac) { if (ac.state !== 'running') ac.resume(); return; }
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext; if (!AC) return; ac = new AC();
  out = ac.createGain(); out.gain.value = 0.85; const cp = ac.createDynamicsCompressor(); out.connect(cp); cp.connect(ac.destination);
  nb = ac.createBuffer(1, ac.sampleRate * 3, ac.sampleRate); const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const ir = ac.createBuffer(2, ac.sampleRate * 2.6, ac.sampleRate); for (let c = 0; c < 2; c++) { const x = ir.getChannelData(c); for (let i = 0; i < x.length; i++) x[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / x.length, 3); } rev = ac.createConvolver(); rev.buffer = ir; const rg = ac.createGain(); rg.gain.value = 0.35; rev.connect(rg); rg.connect(out);
  const loop = (type: BiquadFilterType, f: number, q: number, vol: number) => { const s = ac!.createBufferSource(); s.buffer = nb; s.loop = true; const fl = ac!.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const g = ac!.createGain(); g.gain.value = vol; s.connect(fl); fl.connect(g); g.connect(out); s.start(0, Math.random() * 2); return g; };
  loop('highpass', 2600, 0.4, 0.05); loop('bandpass', 900, 0.5, 0.035); loop('lowpass', 140, 0.7, 0.16); // pluie fine, pluie au sol, ville lointaine
  hum = ac.createGain(); hum.gain.value = 0; hum.connect(out); for (const [f, v] of [[50, 0.5], [100, 0.34], [150, 0.1], [200, 0.05]]) { const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; const lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 320; const g = ac.createGain(); g.gain.value = v * 0.1; o.connect(lp); lp.connect(g); g.connect(hum); o.start(); }
  music = ac.createGain(); music.gain.value = 0.5; music.connect(out); music.connect(rev);
}
export function setLevel(lit: number, districts: number) { lvl = lit; layers = districts; if (ac) hum.gain.setTargetAtTime(Math.min(0.5, lit * 0.6), ac.currentTime, 1); }
function env(g: GainNode, t: number, a: number, peak: number, dur: number) { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0004, t + dur); }
function osc(f: number, type: OscillatorType, t: number, a: number, peak: number, dur: number, dest: AudioNode = out, f1 = f) { if (!ac) return; const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (f1 !== f) o.frequency.exponentialRampToValueAtTime(f1, t + dur); env(g, t, a, peak, dur); o.connect(g); g.connect(dest); o.start(t); o.stop(t + dur + 0.05); }
function noise(t: number, dur: number, type: BiquadFilterType, f: number, vol: number, q = 1) { if (!ac) return; const s = ac.createBufferSource(); s.buffer = nb; const fl = ac.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const g = ac.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0004, t + dur); s.connect(fl); fl.connect(g); g.connect(out); s.start(t, Math.random() * 2); s.stop(t + dur + 0.02); }
const hz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
const PENTA = [0, 2, 4, 7, 9];
/** chaque lettre a sa note */
export const noteOf = (i: number) => 60 + PENTA[i % 5] + 12 * Math.floor((i % 15) / 5);
export function ping(i: number, vol = 0.12, delay = 0) { if (!ac) return; const t = ac.currentTime + delay, f = hz(noteOf(i)); osc(f, 'sine', t, 0.005, vol, 1.4, music); osc(f * 2, 'sine', t, 0.005, vol * 0.25, 0.7, music); osc(f * 3.01, 'sine', t, 0.002, vol * 0.08, 0.3, music); }
export function chord(is: number[]) { is.forEach((i, k) => ping(i, 0.1, k * 0.07)); }
export function buzz() { if (!ac) return; const t = ac.currentTime; for (let k = 0; k < 4; k++) noise(t + k * 0.05 + Math.random() * 0.02, 0.035, 'highpass', 3200, 0.16, 0.7); osc(100, 'sawtooth', t, 0.005, 0.07, 0.24); }
export function ignite() { if (!ac) return; const t = ac.currentTime; for (let k = 0; k < 3; k++) noise(t + k * 0.09, 0.04, 'bandpass', 4200, 0.14, 2); osc(100, 'sawtooth', t + 0.26, 0.05, 0.06, 0.9); osc(2400, 'sine', t + 0.28, 0.002, 0.05, 0.5, music); }
export function click() { if (!ac) return; const t = ac.currentTime; noise(t, 0.02, 'bandpass', 3000, 0.22, 3); osc(180, 'triangle', t, 0.002, 0.14, 0.07, out, 120); }
export function tick() { if (!ac) return; noise(ac.currentTime, 0.015, 'highpass', 5000, 0.07); }
export function vib(ms: number | number[]) { try { navigator.vibrate?.(ms); } catch { /* */ } }
// nappe lo-fi : quatre accords, lents. Un instrument de plus par quartier allumé.
const PROG = [[57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65], [52, 55, 59, 62]]; let bar = -1, nextT = 0;
export function musicTick() {
  if (!ac || lvl <= 0) return; const t = ac.currentTime; if (t < nextT - 0.2) return; if (nextT < t) nextT = t + 0.1; bar++; const ch = PROG[bar % 4], T = nextT, B = 3.2; nextT += B;
  for (const m of ch) { osc(hz(m), 'sine', T, 1.2, 0.02 + lvl * 0.012, B + 1.2, music); osc(hz(m) * 1.003, 'triangle', T, 1.4, 0.008, B + 1, music); }
  if (layers >= 1) for (let k = 0; k < 4; k++) { const m = ch[[0, 2, 1, 3][k]] + 12; osc(hz(m), 'triangle', T + k * (B / 4), 0.01, 0.035, 0.9, music); }
  if (layers >= 2) for (let k = 0; k < 4; k++) { osc(110, 'sine', T + k * (B / 4), 0.004, k % 2 ? 0 : 0.2, 0.22, out, 42); noise(T + (k + 0.5) * (B / 4), 0.04, 'highpass', 7000, 0.035); }
  if (layers >= 3) osc(hz(ch[0] - 24), 'sine', T, 0.03, 0.14, B * 0.9, out);
  if (layers >= 4) { const mel = [ch[3] + 12, ch[2] + 12, ch[3] + 14, ch[1] + 12]; mel.forEach((m, k) => { if ((bar + k) % 3) osc(hz(m), 'sine', T + (k + 0.5) * (B / 4) + 0.05, 0.004, 0.03, 1.6, music); }); }
  if (layers >= 5) for (let k = 0; k < 14; k++) noise(T + Math.random() * B, 0.012, 'highpass', 6000, 0.03);
}
