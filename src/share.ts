import { TAU } from './tuning';
import { txt, fmt, FONT } from './g';
import { S } from './save';
import { drawCase, drawDial, drawHand, dialLight } from './watch';
import { COMP, RARC } from './comps';
import type { Overlay } from './app';
import { realAngles } from './draw';

function watchOn(c: CanvasRenderingContext2D, cx: number, cy: number, R: number, len: number) {
  c.save(); c.translate(cx, cy);
  drawCase(c, R, S.eq, len); drawDial(c, R, S.eq, null, undefined, undefined, new Date().getDate());
  const t = realAngles(), col = S.eq.hands === 'bleuies' ? '#3d6fd6' : dialLight(S.eq) ? '#1a1c20' : '#e9e9e9';
  drawHand(c, S.eq.hands, t.h, R * 0.52, R * 0.034, col, false, 1, false);
  drawHand(c, S.eq.hands, t.m, R * 0.8, R * 0.026, col, false, 1, false);
  c.rotate(t.s); c.strokeStyle = '#ff5a36'; c.lineWidth = R * 0.012; c.beginPath(); c.moveTo(0, R * 0.18); c.lineTo(0, -R * 0.9); c.stroke();
  c.restore();
}
async function out(cv: HTMLCanvasElement, name: string) {
  const blob: Blob | null = await new Promise((r) => cv.toBlob(r, 'image/png'));
  if (!blob) return;
  try {
    const f = new File([blob], name, { type: 'image/png' });
    if ((navigator as any).canShare && (navigator as any).canShare({ files: [f] })) { await (navigator as any).share({ files: [f] }); return; }
  } catch { /* */ }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
export function shareCard(o: Overlay) {
  const cv = document.createElement('canvas'); cv.width = 1080; cv.height = 1350; const c = cv.getContext('2d')!;
  c.fillStyle = '#000'; c.fillRect(0, 0, 1080, 1350);
  watchOn(c, 540, 760, 300, 700);
  const g = c.createLinearGradient(0, 0, 0, 1350); g.addColorStop(0, 'rgba(0,0,0,.92)'); g.addColorStop(0.3, 'rgba(0,0,0,0)'); g.addColorStop(0.78, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.95)'); c.fillStyle = g; c.fillRect(0, 0, 1080, 1350);
  txt(c, 'CALIBRE 95', 540, 90, 44, '#fff', 'center', 700, 16);
  txt(c, fmt(o.score), 540, 235, 190, '#fff', 'center', 700, -2);
  txt(c, `${o.daily ? 'DAILY · ' : ''}${o.city} · ${o.cityNo}/9`, 540, 370, 38, '#ffe7a3', 'center', 600, 8);
  const ids = Object.keys(o.mods).filter((k) => o.mods[k]);
  ids.forEach((id, i) => { const x = 540 + (i - (ids.length - 1) / 2) * 84, y = 1215; c.strokeStyle = RARC[o.mods[id] - 1]; c.lineWidth = 3; c.beginPath(); c.arc(x, y, 34, 0, TAU); c.stroke(); txt(c, COMP[id].g, x, y + 2, COMP[id].g.length > 2 ? 22 : 30, '#fff', 'center', 700); });
  c.font = `500 30px ${FONT}`;
  txt(c, '« ' + o.line + ' »', 540, 1295, 30, 'rgba(255,255,255,.7)', 'center', 500, 1);
  out(cv, 'calibre95.png');
}
export function exportWatch() {
  const cv = document.createElement('canvas'); cv.width = 1080; cv.height = 1350; const c = cv.getContext('2d')!;
  c.fillStyle = '#060607'; c.fillRect(0, 0, 1080, 1350);
  watchOn(c, 540, 675, 360, 700);
  if (S.eq.back === 'libre' && S.engr) txt(c, S.engr.toUpperCase(), 540, 1290, 30, 'rgba(255,255,255,.6)', 'center', 600, 8);
  out(cv, 'ma-montre.png');
}
