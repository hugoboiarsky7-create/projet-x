// Son 100 % procédural.
import { SCALES, rootOf } from './eras';
let ac: AudioContext | null = null, out: GainNode, rev: ConvolverNode, wind: GainNode, windF: BiquadFilterNode, noiseBuf: AudioBuffer;
export function initAudio() {
  if (ac) { if (ac.state !== 'running') ac.resume(); return; }
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext; if (!AC) return;
  ac = new AC(); out = ac.createGain(); out.gain.value = 0.9; const comp = ac.createDynamicsCompressor(); out.connect(comp); comp.connect(ac.destination);
  const len = ac.sampleRate * 4, ir = ac.createBuffer(2, len, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); let lp = 0; for (let i = 0; i < len; i++) { const t = i / len; lp += ((Math.random() * 2 - 1) - lp) * (0.5 - 0.42 * t); d[i] = lp * Math.pow(1 - t, 2.6) * (i < 400 ? i / 400 : 1); } }
  rev = ac.createConvolver(); rev.buffer = ir; const rg = ac.createGain(); rg.gain.value = 0.55; rev.connect(rg); rg.connect(out);
  noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate); const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  const ws = ac.createBufferSource(); ws.buffer = noiseBuf; ws.loop = true; windF = ac.createBiquadFilter(); windF.type = 'bandpass'; windF.frequency.value = 420; windF.Q.value = 0.6;
  wind = ac.createGain(); wind.gain.value = 0; ws.connect(windF); windF.connect(wind); wind.connect(out); ws.start();
}
export function setWind(level: number, tone: number) { if (!ac) return; const t = ac.currentTime; wind.gain.setTargetAtTime(0.02 + level * 0.07, t, 1.2); windF.frequency.setTargetAtTime(260 + tone * 700, t, 1.5); }
const hz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
// piano feutré : partiels sinus, attaque douce, longue réverbe
export function note(midi: number, vel = 0.5, delay = 0) {
  if (!ac) return; const t = ac.currentTime + delay, f = hz(midi), g = ac.createGain(), lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900 + vel * 1800;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.16 * vel, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0004, t + 1.6 + vel);
  for (const [k, a] of [[1, 1], [2, 0.32], [3, 0.1], [4.02, 0.05]]) { const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = f * k; const og = ac.createGain(); og.gain.value = a; o.connect(og); og.connect(lp); o.start(t); o.stop(t + 2.8); }
  lp.connect(g); g.connect(out); const s = ac.createGain(); s.gain.value = 0.9; g.connect(s); s.connect(rev);
}
export function tone(day: number, surf: number, i: number, vel: number, delay = 0) { const sc = SCALES[surf] || SCALES[0]; const n = sc.length; const k = ((i % n) + n) % n, oct = Math.floor(i / n); note(rootOf(day) + 12 + sc[k] + oct * 12, vel, delay); }
function burst(dur: number, type: BiquadFilterType, f: number, q: number, vol: number, f2 = f) {
  if (!ac) return; const t = ac.currentTime, s = ac.createBufferSource(); s.buffer = noiseBuf; s.loop = true; const fl = ac.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, t); fl.frequency.exponentialRampToValueAtTime(f2, t + dur); fl.Q.value = q;
  const g = ac.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0005, t + dur); s.connect(fl); fl.connect(g); g.connect(out); const w = ac.createGain(); w.gain.value = 0.25; g.connect(w); w.connect(rev); s.start(t, Math.random()); s.stop(t + dur + 0.02);
}
function ping(f: number, dur: number, vol: number, f2 = f) { if (!ac) return; const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f2, t + dur); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0005, t + dur); o.connect(g); g.connect(out); g.connect(rev); o.start(t); o.stop(t + dur + 0.02); }
export function hit(surf: number, v: number) {
  const a = Math.min(1, v / 320); if (a < 0.04) return;
  if (surf === 0) burst(0.09, 'lowpass', 900, 0.7, 0.3 * a); else if (surf === 1) burst(0.16, 'bandpass', 1900, 0.8, 0.22 * a, 900);
  else if (surf === 2) burst(0.2, 'lowpass', 520, 0.5, 0.36 * a, 200); else if (surf === 3) burst(0.16, 'lowpass', 300, 0.5, 0.42 * a, 140);
  else if (surf === 4) { burst(0.05, 'highpass', 4200, 0.7, 0.2 * a); ping(2900 + Math.random() * 500, 0.3, 0.05 * a); }
  else if (surf === 5) { burst(0.04, 'bandpass', 2600, 2, 0.5 * a); ping(190, 0.07, 0.2 * a, 90); } else burst(0.12, 'bandpass', 1400, 1.2, 0.36 * a, 500);
}
export function swing(p: number) { burst(0.22, 'bandpass', 500 + p * 900, 0.9, 0.1 + p * 0.16, 2400); ping(150, 0.06, 0.2 + 0.2 * p, 70); }
export function splash() { burst(0.5, 'bandpass', 1800, 0.6, 0.34, 300); ping(340, 0.24, 0.2, 80); }
export function skip() { burst(0.12, 'highpass', 2500, 0.6, 0.22); }
export function cupSound() { ping(210, 0.12, 0.3, 120); burst(0.07, 'lowpass', 700, 1, 0.3); }
export function buzz(ms: number | number[]) { try { navigator.vibrate?.(ms); } catch { /* */ } }
