import { TAU } from './tuning';
import { G, C2, txt, rr, fmt, FONT, wrapText } from './g';
import { A, toast } from './app';
import { S, persist } from './save';
import { CATS, PIECES, PIECE, Cat, drawCase, drawDial, drawHand, drawBackCase, dialLight } from './watch';
import { realAngles } from './draw';
import { ACH } from './texts';
import { CITIES, KANAZAWA, TAKAYAMA } from './cities';
import { exportWatch } from './share';

type Add = (x: number, y: number, w: number, h: number, fn: () => void) => void;
let cat: Cat = 'case', pv: HTMLCanvasElement | null = null, pvKey = '', shakeT = 0;
export const give = (id: string) => { if (!S.ach[id]) { S.ach[id] = Date.now(); return true; } return false; };

function gearIcon(c: C2, x: number, y: number, r: number, col: string) {
  c.save(); c.translate(x, y); c.strokeStyle = col; c.lineWidth = 1.6; c.beginPath();
  for (let k = 0; k < 8; k++) { const a0 = (k / 8) * TAU, a1 = ((k + 0.5) / 8) * TAU; c.lineTo(Math.cos(a0) * r, Math.sin(a0) * r); c.lineTo(Math.cos(a0 + 0.1) * r * 1.3, Math.sin(a0 + 0.1) * r * 1.3); c.lineTo(Math.cos(a1 - 0.1) * r * 1.3, Math.sin(a1 - 0.1) * r * 1.3); c.lineTo(Math.cos(a1) * r, Math.sin(a1) * r); }
  c.closePath(); c.stroke(); c.beginPath(); c.arc(0, 0, r * 0.35, 0, TAU); c.stroke(); c.restore();
}
export function rouLabel(c: C2, x: number, y: number, n: number, px = 16, align: 'right' | 'left' = 'right') {
  const s = fmt(n); c.font = `700 ${px}px ${FONT}`; const w = c.measureText(s).width;
  if (align === 'right') { txt(c, s, x, y, px, '#e8c25a', 'right', 700); gearIcon(c, x - w - px * 0.75, y, px * 0.36, '#e8c25a'); }
  else { gearIcon(c, x + px * 0.45, y, px * 0.36, '#e8c25a'); txt(c, s, x + px * 1.15, y, px, '#e8c25a', 'left', 700); }
}

export function drawAtelier(c: C2, add: Add, back: () => void) {
  const W = G.W, H = G.H; c.fillStyle = '#070708'; c.fillRect(0, 0, W, H);
  const top = G.st + 30;
  txt(c, '‹', 26, top, 34, '#fff', 'center', 400); add(0, top - 30, 70, 60, back);
  txt(c, 'ÉTABLI', W / 2, top, 15, 'rgba(255,255,255,.7)', 'center', 600, 6);
  rouLabel(c, W - 18, top, S.rou);
  // aperçu
  const R = Math.min(W * 0.26, H * 0.15), py = top + 34 + R * 1.45;
  const key = JSON.stringify(S.eq) + R + cat + S.engr + new Date().getMinutes();
  if (!pv || pvKey !== key) {
    pv = document.createElement('canvas'); pv.width = Math.ceil(W * G.dpr); pv.height = Math.ceil(R * 3.4 * G.dpr); pvKey = key;
    const p = pv.getContext('2d')!; p.scale(G.dpr, G.dpr); p.translate(W / 2, R * 1.7);
    p.save(); p.beginPath(); p.rect(-W / 2, -R * 1.7, W, R * 3.4); p.clip(); drawCase(p, R, S.eq, R * 1.7);
    if (cat === 'back') drawBackCase(p, R, S.eq, S.engr); else drawDial(p, R, S.eq, null, undefined, undefined, new Date().getDate());
    p.restore();
  }
  c.drawImage(pv, 0, py - R * 1.7, W, R * 3.4);
  if (cat !== 'back') {
    c.save(); c.translate(W / 2, py); const t = realAngles(), col = S.eq.hands === 'bleuies' ? '#3d6fd6' : dialLight(S.eq) ? '#1a1c20' : '#e9e9e9';
    drawHand(c, S.eq.hands, t.h, R * 0.52, R * 0.034, col, false, 1, false); drawHand(c, S.eq.hands, t.m, R * 0.8, R * 0.026, col, false, 1, false);
    c.rotate(t.s); c.strokeStyle = '#ff5a36'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(0, R * 0.18); c.lineTo(0, -R * 0.9); c.stroke(); c.restore();
  }
  const g = c.createLinearGradient(0, py + R * 1.2, 0, py + R * 1.7); g.addColorStop(0, 'rgba(7,7,8,0)'); g.addColorStop(1, '#070708'); c.fillStyle = g; c.fillRect(0, py + R * 1.2, W, R * 0.5 + 1);
  // onglets
  let y = py + R * 1.7 + 14; const tw = W / 4;
  CATS.forEach((ct, i) => {
    const row = i < 4 ? 0 : 1, col = i < 4 ? i : i - 4, x = (row ? tw / 2 : 0) + col * tw + tw / 2, yy = y + row * 30;
    const on = ct.id === cat; txt(c, ct.name, x, yy, 11.5, on ? '#fff' : 'rgba(255,255,255,.42)', 'center', on ? 700 : 600, 1.5);
    if (on) { c.fillStyle = '#e8c25a'; c.fillRect(x - 14, yy + 10, 28, 2); }
    add(x - tw / 2, yy - 15, tw, 30, () => { cat = ct.id; A.snd.click(); });
  });
  y += 60;
  const list = PIECES.filter((p) => p.cat === cat), avail = H - G.sb - 56 - y, rh = Math.min(58, avail / list.length);
  if (shakeT > 0) shakeT -= G.dt;
  list.forEach((p, i) => {
    const yy = y + i * rh, own = !!S.own[p.id], eq = (S.eq as any)[cat] === p.id;
    const locked = !own && ((p.lock === 'kan' && !S.kan) || (p.lock === 'back' && !S.backWon));
    rr(c, 14, yy + 2, W - 28, rh - 4, 8); c.fillStyle = eq ? '#16150f' : '#0e0e10'; c.fill(); if (eq) { c.strokeStyle = '#e8c25a'; c.lineWidth = 1; c.stroke(); }
    txt(c, locked ? '· · ·' : p.name.toUpperCase(), 28, yy + rh * 0.36, Math.min(14, rh * 0.27), locked ? 'rgba(255,255,255,.3)' : '#fff', 'left', 700, 1);
    c.font = `500 ${Math.min(12, rh * 0.22)}px ${FONT}`;
    const note = locked ? 'Ailleurs.' : wrapText(c, p.note, W - 150)[0];
    txt(c, note, 28, yy + rh * 0.68, Math.min(12, rh * 0.22), 'rgba(255,255,255,.5)', 'left', 500);
    if (eq) txt(c, 'PORTÉ', W - 28, yy + rh / 2, 11, '#e8c25a', 'right', 700, 2);
    else if (own) txt(c, 'À TOI', W - 28, yy + rh / 2, 11, 'rgba(255,255,255,.55)', 'right', 700, 2);
    else if (!locked) { c.globalAlpha = S.rou >= p.price ? 1 : 0.4; rouLabel(c, W - 28, yy + rh / 2, p.price, 14); c.globalAlpha = 1; }
    add(14, yy, W - 28, rh, () => {
      if (locked) { A.snd.err(); return; }
      if (!own) {
        if (S.rou < p.price) { A.snd.err(); shakeT = 0.3; toast('Pas assez.'); return; }
        S.rou -= p.price; S.own[p.id] = 1; S.bought++; A.snd.buy();
        if (p.id === 'quartz') { toast('Vraiment ?'); give('quartz'); }
        if (S.bought >= 10) give('horloger');
        if (PIECES.every((q) => S.own[q.id])) give('manuf');
      } else A.snd.click();
      if (p.id === 'libre' && (eq || !own)) { const t = prompt('Gravure', S.engr || ''); if (t != null) S.engr = t.slice(0, 40); }
      (S.eq as any)[cat] = p.id; persist();
    });
  });
  txt(c, 'EXPORTER', W / 2, H - G.sb - 28, 12, 'rgba(255,255,255,.6)', 'center', 600, 4); add(W / 2 - 80, H - G.sb - 50, 160, 44, () => { A.snd.click(); exportWatch(); });
}

export function drawStats(c: C2, add: Add, back: () => void) {
  const W = G.W, H = G.H; c.fillStyle = '#070708'; c.fillRect(0, 0, W, H);
  const top = G.st + 30;
  txt(c, '‹', 26, top, 34, '#fff', 'center', 400); add(0, top - 30, 70, 60, back);
  txt(c, 'CARNET', W / 2, top, 15, 'rgba(255,255,255,.7)', 'center', 600, 6);
  const all = [...CITIES, KANAZAWA, TAKAYAMA]; let worst = '—', wn = 0;
  for (const k in S.cityDeaths) if (S.cityDeaths[k] > wn) { wn = S.cityDeaths[k]; worst = all.find((x) => x.id === k)?.name || '—'; }
  const hh = Math.floor(S.time / 3600), mm = Math.floor((S.time % 3600) / 60), ss = Math.floor(S.time % 60);
  const rows: [string, string][] = [
    ['MORTS', fmt(S.deaths)], ['TEMPS PERDU', hh ? `${hh} h ${mm} min` : `${mm} min ${ss} s`], ['RECORD', fmt(S.best)],
    ['PLUS LOIN', S.bestCity >= 9 ? 'TOKYO' : CITIES[Math.min(8, S.bestCity)].name], ['VILLE LA PLUS MEURTRIÈRE', worst],
    ['FRÔLEMENTS', fmt(S.grazes)], ['DAILY, SÉRIE', S.daily.streak + ' j'],
  ];
  if (S.won) rows.push(['ARRIVÉES', String(S.won)]);
  if (S.backWon) rows.push(['CÔTÉ FOND', fmt(S.backBest)]);
  let y = top + 56; const rh = Math.min(34, (H * 0.42) / rows.length);
  rows.forEach(([k, v]) => { txt(c, k, 24, y, 12, 'rgba(255,255,255,.5)', 'left', 600, 2); txt(c, v, W - 24, y, 17, '#fff', 'right', 700, 1); c.fillStyle = 'rgba(255,255,255,.07)'; c.fillRect(24, y + rh / 2, W - 48, 1); y += rh; });
  y += 14; const keys = Object.keys(ACH), got = keys.filter((k) => S.ach[k]);
  txt(c, `SUCCÈS ${got.length}/${keys.length}`, 24, y, 12, '#e8c25a', 'left', 700, 3); y += 24;
  const cols = 2, ch = Math.min(22, (H - G.sb - 16 - y) / Math.ceil(keys.length / cols));
  keys.forEach((k, i) => { const x = 24 + (i % cols) * ((W - 48) / cols), yy = y + Math.floor(i / cols) * ch; txt(c, S.ach[k] ? '★ ' + ACH[k] : '·  ?', x, yy, Math.min(13, ch * 0.62), S.ach[k] ? '#fff' : 'rgba(255,255,255,.25)', 'left', 600, 0.5); });
}
