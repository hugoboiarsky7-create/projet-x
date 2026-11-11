// Voix : synthèse du navigateur en ko-KR. On choisit la meilleure voix disponible ; on attend leur chargement.
let voice: SpeechSynthesisVoice | null = null, ready = false, unlocked = false; export let hasKo = true; let checked = false;
const PREF = ['Yuna', 'Sora', 'Jian', 'Google 한국의', 'Google Korean', 'Heami', 'SunHi', 'InJoon', 'Narae'];
function pick() {
  const ss = window.speechSynthesis; if (!ss) { hasKo = false; checked = true; return; } const vs = ss.getVoices().filter((v) => /^ko([-_]|$)/i.test(v.lang)); if (!vs.length) { if (ss.getVoices().length) { hasKo = false; checked = true; } return; }
  const score = (v: SpeechSynthesisVoice) => { const i = PREF.findIndex((p) => v.name.includes(p)); return (i < 0 ? 50 : i) - (/premium|enhanced|natural|neural/i.test(v.name) ? 100 : 0) - (v.localService ? 5 : 0); };
  voice = vs.sort((a, b) => score(a) - score(b))[0]; hasKo = true; ready = true; checked = true;
}
export function initSpeech() { if (!('speechSynthesis' in window)) { hasKo = false; checked = true; return; } pick(); window.speechSynthesis.addEventListener?.('voiceschanged', pick); setTimeout(() => { pick(); if (!ready) { hasKo = false; checked = true; } }, 2500); }
export function unlock() { if (unlocked || !('speechSynthesis' in window)) return; unlocked = true; try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; u.lang = 'ko-KR'; window.speechSynthesis.speak(u); } catch { /* */ } pick(); }
export const voiceChecked = () => checked;
let last = 0;
export function say(text: string, rate = 0.82, onend?: () => void) {
  if (!('speechSynthesis' in window)) { onend?.(); return; } const ss = window.speechSynthesis; if (!voice) pick();
  try { ss.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'ko-KR'; if (voice) u.voice = voice; u.rate = rate; u.pitch = 1; u.volume = 1; const id = ++last; u.onend = () => { if (id === last) onend?.(); }; u.onerror = () => { if (id === last) onend?.(); }; setTimeout(() => ss.speak(u), 30); } catch { onend?.(); }
}
export const spoken: string[] = []; // pour les tests
export function sayLog(text: string, rate?: number) { spoken.push(text); if (spoken.length > 40) spoken.shift(); say(text, rate); }
