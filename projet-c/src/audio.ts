// Sons de cuisine stylisés, 100 % synthétisés.
let ac: AudioContext | null = null, out: GainNode, nb: AudioBuffer, room: GainNode; let muted = false;
export function init() {
  if (ac) { if (ac.state !== 'running') ac.resume(); return; }
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext; if (!AC) return;
  ac = new AC(); out = ac.createGain(); out.gain.value = 0.8; const cp = ac.createDynamicsCompressor(); out.connect(cp); cp.connect(ac.destination);
  nb = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate); const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const s = ac.createBufferSource(); s.buffer = nb; s.loop = true; const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 480; f.Q.value = 0.5; room = ac.createGain(); room.gain.value = 0.012; s.connect(f); f.connect(room); room.connect(out); s.start();
}
export const setMute = (m: boolean) => { muted = m; if (ac) out.gain.value = m ? 0 : 0.8; };
function noise(dur: number, type: BiquadFilterType, f0: number, f1: number, vol: number, q = 1, at = 0) { if (!ac || muted) return; const t = ac.currentTime + at, s = ac.createBufferSource(); s.buffer = nb; const f = ac.createBiquadFilter(); f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur); const g = ac.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0006, t + dur); s.connect(f); f.connect(g); g.connect(out); s.start(t, Math.random()); s.stop(t + dur + 0.02); }
function tone(f: number, dur: number, vol: number, type: OscillatorType = 'sine', at = 0, f1 = f) { if (!ac || muted) return; const t = ac.currentTime + at, o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (f1 !== f) o.frequency.exponentialRampToValueAtTime(f1, t + dur); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0006, t + dur); o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.02); }
export const slide = () => noise(0.09, 'lowpass', 700, 300, 0.12);
export const bump = () => tone(90, 0.06, 0.12);
export const chop = () => { for (let i = 0; i < 3; i++) { noise(0.03, 'bandpass', 2400, 1800, 0.3, 2, i * 0.07); tone(170, 0.04, 0.16, 'triangle', i * 0.07, 110); } };
export const whisk = () => { for (let i = 0; i < 6; i++) noise(0.025, 'highpass', 3600, 3000, 0.1, 1, i * 0.04); };
export const sizzle = () => noise(0.5, 'highpass', 5200, 3200, 0.12, 0.8);
export const flame = () => { noise(0.34, 'bandpass', 300, 1200, 0.3, 0.7); sizzle(); };
export const bell = () => { tone(1975, 0.9, 0.16); tone(3950, 0.5, 0.05); tone(5920, 0.3, 0.025); };
export const till = () => { noise(0.05, 'bandpass', 2600, 1800, 0.3, 3); tone(1320, 0.5, 0.1, 'sine', 0.06); tone(1760, 0.7, 0.1, 'sine', 0.14); noise(0.12, 'lowpass', 500, 200, 0.2, 1, 0.02); };
export const clink = () => { tone(2640, 0.5, 0.09); tone(3520, 0.4, 0.05, 'sine', 0.03); };
export const rip = () => noise(0.22, 'bandpass', 1400, 500, 0.24, 0.8);
export const splash = () => { noise(0.3, 'bandpass', 1600, 500, 0.2, 0.7); tone(300, 0.15, 0.1, 'sine', 0, 110); };
export const ice = () => { tone(3100, 0.12, 0.06); noise(0.08, 'highpass', 5000, 4000, 0.1); };
export const undo = () => { tone(520, 0.12, 0.1, 'triangle', 0, 260); clink(); };
export const no = () => tone(140, 0.12, 0.12, 'triangle', 0, 100);
export const paper = () => noise(0.12, 'highpass', 2600, 1800, 0.08);
export const buzz = (ms: number | number[]) => { try { navigator.vibrate?.(ms); } catch { /* */ } };
// la salle s'anime avec le score ; une ritournelle discrète dont la couleur change par cuisine
const SC: Record<string, number[]> = { home: [0, 2, 4, 7, 9], trat: [0, 2, 4, 5, 7, 9, 11], seoul: [0, 2, 5, 7, 9], cheng: [0, 2, 4, 7, 9], bkk: [0, 3, 5, 7, 10], tokyo: [0, 1, 5, 7, 8], omakase: [0, 2, 3, 7, 8] };
const ROOT: Record<string, number> = { home: 60, trat: 62, seoul: 57, cheng: 59, bkk: 58, tokyo: 61, omakase: 56 };
let mt = 0, step = 0;
export function ambient(kit: string, level: number, dt: number) {
  if (!ac || muted) return; room.gain.setTargetAtTime(0.01 + Math.min(0.05, level * 0.05), ac.currentTime, 1.5); mt -= dt; if (mt > 0) return;
  mt = 0.42 * (1 + (step % 8 === 7 ? 3 : 0)); step++; if (Math.sin(step * 2.3) > 0.25) return;
  const sc = SC[kit] || SC.home, n = sc[(step * 3 + (step >> 2)) % sc.length] + (step % 5 === 0 ? 12 : 0), f = 440 * Math.pow(2, (ROOT[kit] + n - 69) / 12);
  tone(f, 0.7, 0.028, 'triangle'); tone(f * 2, 0.3, 0.008); if (Math.random() < level * 0.15) clinkSoft();
}
function clinkSoft() { tone(2200 + Math.random() * 1400, 0.25, 0.012); }
