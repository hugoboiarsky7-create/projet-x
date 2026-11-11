import { TAU } from './tuning';
import { C2, FONT, rgba } from './g';
import type { Pal } from './cities';
import { Perks, NOPERKS } from './sim';
import { mkRng } from './rng';

export type Cat = 'case' | 'bezel' | 'dial' | 'hands' | 'mvt' | 'strap' | 'back';
export interface Piece { id: string; cat: Cat; name: string; price: number; note: string; fx?: Partial<Perks>; lock?: 'kan' | 'back' }
export interface Watch { case: string; bezel: string; dial: string; hands: string; mvt: string; strap: string; back: string }
export const CATS: { id: Cat; name: string }[] = [
  { id: 'case', name: 'BOÎTIER' }, { id: 'bezel', name: 'LUNETTE' }, { id: 'dial', name: 'CADRAN' }, { id: 'hands', name: 'AIGUILLES' },
  { id: 'mvt', name: 'MOUVEMENT' }, { id: 'strap', name: 'BRACELET' }, { id: 'back', name: 'FOND' },
];
export const DEFWATCH: Watch = { case: 'acier', bezel: 'lisse', dial: 'noir', hands: 'baton', mvt: 'manuel', strap: 'cuir', back: 'plein' };
const P = (id: string, cat: Cat, name: string, price: number, note: string, fx?: Partial<Perks>, lock?: 'kan' | 'back'): Piece => ({ id, cat, name, price, note, fx, lock });
export const PIECES: Piece[] = [
  P('acier', 'case', 'Acier poli', 0, 'Sobre.'),
  P('c39', 'case', 'Acier 39 mm', 95, 'La bonne taille. Tu es plus fin.', { hit: 0.05 }),
  P('c44', 'case', 'Acier 44 mm', 44, 'Tu es sûr ? Index +10 %, tu es plus gros.', { idx: 0.1, hit: -0.12 }),
  P('dlc', 'case', 'Noir mat', 120, 'Frôlement plus large.', { graze: 0.06 }),
  P('bronze', 'case', 'Bronze', 200, 'Il se patine. Rouages +5 %.', { rou: 0.05 }),
  P('titane', 'case', 'Titane', 350, 'Léger. Le combo tient plus.', { combo: 0.5 }),
  P('orj', 'case', 'Or jaune', 900, 'Rouages +10 %.', { rou: 0.1 }),
  P('lisse', 'bezel', 'Lisse', 0, 'Rien à dire.'),
  P('cannele', 'bezel', 'Cannelée', 80, 'Index +3 %.', { idx: 0.03 }),
  P('tachy', 'bezel', 'Tachymètre', 140, 'Frôlement plus large.', { graze: 0.06 }),
  P('plongee', 'bezel', 'Plongée', 180, 'Le combo tient plus.', { combo: 0.5 }),
  P('bico', 'bezel', 'Bicolore', 450, 'Prime de ville +10 %.', { bonus: 0.1 }),
  P('octo', 'bezel', 'Octogonale', 700, 'Huit vis. Tu es plus fin.', { hit: 0.03 }),
  P('noir', 'dial', 'Noir mat', 0, 'Lisible.'),
  P('tapis', 'dial', 'Tapisserie argentée', 150, 'Index +3 %.', { idx: 0.03 }),
  P('vert', 'dial', 'Gris, chiffres verts', 220, 'Tu ramasses de plus loin.', { pick: 0.1 }),
  P('bleu', 'dial', 'Bleu profond', 300, 'Prime de ville +5 %.', { bonus: 0.05 }),
  P('c63', 'dial', 'Chronographe « 1963 »', 600, 'Crème. Le combo tient plus.', { combo: 0.5 }),
  P('or', 'dial', 'Feuille d\'or', 400, 'Rouages +8 %.', { rou: 0.08 }, 'kan'),
  P('squel', 'dial', 'Squeletté', 500, 'On voit tout. Frôlement plus large.', { graze: 0.08 }, 'back'),
  P('lune', 'dial', 'Décentré, phase de lune', 2500, 'La pièce. Index +8 %, rouages +8 %.', { idx: 0.08, rou: 0.08 }),
  P('baton', 'hands', 'Bâton', 0, 'Droit.'),
  P('dauphine', 'hands', 'Dauphine', 60, 'Tu ramasses de plus loin.', { pick: 0.05 }),
  P('feuille', 'hands', 'Feuille', 90, 'Index +2 %.', { idx: 0.02 }),
  P('seringue', 'hands', 'Seringue', 130, 'Frôlement plus large.', { graze: 0.04 }),
  P('fleche', 'hands', 'Flèche', 170, 'Prime de ville +5 %.', { bonus: 0.05 }),
  P('squelh', 'hands', 'Squelette', 260, 'Frôlement plus large.', { graze: 0.06 }),
  P('bleuies', 'hands', 'Bleuies au feu', 400, 'Index +5 %.', { idx: 0.05 }, 'back'),
  P('manuel', 'mvt', 'Mécanique, remontage manuel', 0, '28 800 alternances par heure.'),
  P('auto', 'mvt', 'Automatique', 200, 'Le combo tient plus.', { combo: 0.5 }),
  P('quartz', 'mvt', 'Quartz', 1, 'Déconseillé. Aiguilles régulières. Rouages ÷2.', { quartz: true }),
  P('cosc', 'mvt', 'Chronomètre certifié', 800, 'Une relance de plus.', { reroll: 1 }),
  P('tourb', 'mvt', 'Tourbillon', 3000, 'Une relance de plus. Prime de ville +10 %.', { reroll: 1, bonus: 0.1 }),
  P('cuir', 'strap', 'Cuir noir', 0, 'Classique.'),
  P('fauve', 'strap', 'Cuir fauve', 40, 'Ça change tout.'),
  P('nato', 'strap', 'Nato', 70, 'Tu ramasses de plus loin.', { pick: 0.05 }),
  P('caout', 'strap', 'Caoutchouc', 110, 'Frôlement plus large.', { graze: 0.03 }),
  P('acierb', 'strap', 'Acier', 160, 'Prime de ville +3 %.', { bonus: 0.03 }),
  P('milan', 'strap', 'Milanais', 320, 'Index +3 %.', { idx: 0.03 }),
  P('croco', 'strap', 'Croco', 500, 'Rouages +5 %.', { rou: 0.05 }),
  P('plein', 'back', 'Fond plein', 0, 'Vissé.'),
  P('g95', 'back', 'Gravure « 95 »', 95, 'Rouages +3 %.', { rou: 0.03 }),
  P('libre', 'back', 'Gravure libre', 150, 'Ton texte. Touche encore pour l\'écrire.'),
  P('saphir', 'back', 'Fond saphir', 300, 'Prime de ville +5 %.', { bonus: 0.05 }, 'back'),
];
export const PIECE: Record<string, Piece> = Object.fromEntries(PIECES.map((p) => [p.id, p]));
export function perksOf(w: Watch): Perks {
  const p: Perks = { ...NOPERKS };
  for (const cat of CATS) {
    const fx = PIECE[(w as any)[cat.id]]?.fx; if (!fx) continue;
    for (const k in fx) { const v = (fx as any)[k]; if (typeof v === 'boolean') (p as any)[k] = v; else (p as any)[k] += v; }
  }
  return p;
}

const METAL: Record<string, [string, string, string]> = {
  acier: ['#f4f6f8', '#8d949c', '#3a3e44'], c39: ['#f4f6f8', '#8d949c', '#3a3e44'], c44: ['#f4f6f8', '#8d949c', '#3a3e44'],
  dlc: ['#5c6066', '#26282c', '#0b0c0e'], bronze: ['#e6b07a', '#8a5a2b', '#3d2610'], titane: ['#c4c8cc', '#6d737a', '#2b2e33'], orj: ['#ffe9a8', '#c9962e', '#6b4a10'],
};
export const caseK = (w: Watch) => (w.case === 'c44' ? 1.25 : w.case === 'c39' ? 1.17 : 1.2);

function metal(c: C2, cols: [string, string, string], r: number): CanvasGradient {
  const [l, m, d] = cols;
  if ((c as any).createConicGradient) {
    const g: CanvasGradient = (c as any).createConicGradient(-0.6, 0, 0);
    const s = [l, m, d, m, l, m, d, m, l];
    s.forEach((col, i) => g.addColorStop(i / (s.length - 1), col));
    return g;
  }
  const g = c.createLinearGradient(-r, -r, r, r);
  g.addColorStop(0, l); g.addColorStop(0.5, m); g.addColorStop(1, d);
  return g;
}

function strap(c: C2, R: number, k: number, style: string, len: number) {
  const w0 = R * 0.66, w1 = R * 0.56, y0 = k * R * 0.86;
  for (const s of [-1, 1]) {
    c.save(); c.scale(1, s);
    c.beginPath(); c.moveTo(-w0, y0); c.lineTo(w0, y0); c.lineTo(w1, len); c.lineTo(-w1, len); c.closePath();
    const base: Record<string, [string, string]> = { cuir: ['#1b1b1d', '#0b0b0c'], fauve: ['#9a5a2c', '#5a3115'], nato: ['#2f3b2f', '#1a211a'], caout: ['#17181a', '#0a0a0b'], acierb: ['#9aa1a9', '#4a4f55'], milan: ['#aeb4bb', '#5b6067'], croco: ['#3a2416', '#170d07'] };
    const [b0, b1] = base[style] || base.cuir;
    const g = c.createLinearGradient(-w0, 0, w0, 0);
    g.addColorStop(0, b1); g.addColorStop(0.25, b0); g.addColorStop(0.75, b0); g.addColorStop(1, b1);
    c.fillStyle = g; c.fill(); c.clip();
    c.lineWidth = 1;
    if (style === 'cuir' || style === 'fauve' || style === 'croco') {
      c.strokeStyle = style === 'fauve' ? 'rgba(255,230,200,.5)' : 'rgba(255,255,255,.22)'; c.setLineDash([4, 4]);
      for (const sx of [-1, 1]) { c.beginPath(); c.moveTo(sx * (w0 - 7), y0); c.lineTo(sx * (w1 - 7), len); c.stroke(); }
      c.setLineDash([]);
      if (style === 'croco') { c.strokeStyle = 'rgba(0,0,0,.45)'; for (let y = y0; y < len; y += R * 0.16) for (let x = -w0; x < w0; x += R * 0.22) { c.strokeRect(x + (((y / (R * 0.16)) | 0) % 2) * R * 0.11, y, R * 0.2, R * 0.14); } }
    } else if (style === 'nato') {
      c.fillStyle = 'rgba(190,60,50,.75)'; c.fillRect(-R * 0.08, y0, R * 0.16, len);
      c.fillStyle = 'rgba(230,230,220,.5)'; c.fillRect(-R * 0.2, y0, R * 0.05, len); c.fillRect(R * 0.15, y0, R * 0.05, len);
    } else if (style === 'caout') {
      c.strokeStyle = 'rgba(255,255,255,.07)'; c.lineWidth = R * 0.05;
      for (let y = y0 + R * 0.15; y < len; y += R * 0.14) { c.beginPath(); c.moveTo(-w0, y); c.lineTo(w0, y); c.stroke(); }
    } else if (style === 'acierb') {
      c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 1.5;
      for (let y = y0; y < len; y += R * 0.17) { c.beginPath(); c.moveTo(-w0, y); c.lineTo(w0, y); c.stroke(); }
      for (const x of [-R * 0.26, R * 0.26]) { c.beginPath(); c.moveTo(x, y0); c.lineTo(x, len); c.stroke(); }
      c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(-R * 0.26, y0, R * 0.52, len);
    } else if (style === 'milan') {
      c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 1;
      for (let d = -len * 2; d < len * 2; d += 5) { c.beginPath(); c.moveTo(-w0, d); c.lineTo(w0, d + w0 * 2); c.stroke(); c.beginPath(); c.moveTo(w0, d); c.lineTo(-w0, d + w0 * 2); c.stroke(); }
    }
    c.restore();
  }
}

export function drawCase(c: C2, R: number, w: Watch, len: number) {
  const k = caseK(w), cols = METAL[w.case] || METAL.acier;
  strap(c, R, k, w.strap, len);
  // cornes
  c.fillStyle = metal(c, cols, R * k);
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) {
    c.save(); c.scale(sx, sy); c.beginPath();
    c.moveTo(R * 0.6, R * k * 0.72); c.lineTo(R * 0.86, R * k * 0.62); c.lineTo(R * 0.8, R * k * 1.08); c.lineTo(R * 0.67, R * k * 1.1); c.closePath(); c.fill(); c.restore();
  }
  // couronne
  c.fillStyle = cols[1]; c.fillRect(R * k - 2, -R * 0.09, R * 0.1, R * 0.18);
  c.strokeStyle = 'rgba(0,0,0,.4)'; c.lineWidth = 1;
  for (let i = -3; i <= 3; i++) { c.beginPath(); c.moveTo(R * k, i * R * 0.025); c.lineTo(R * k + R * 0.1, i * R * 0.025); c.stroke(); }
  // carrure
  c.beginPath();
  if (w.bezel === 'octo') { for (let i = 0; i < 8; i++) { const a = (i + 0.5) * (TAU / 8); c.lineTo(Math.cos(a) * R * k * 1.03, Math.sin(a) * R * k * 1.03); } c.closePath(); } else c.arc(0, 0, R * k, 0, TAU);
  c.fillStyle = metal(c, cols, R * k); c.fill();
  c.strokeStyle = 'rgba(0,0,0,.55)'; c.lineWidth = 1.5; c.stroke();
  // lunette
  const r0 = R * 1.015, r1 = R * (k - 0.035);
  c.beginPath(); c.arc(0, 0, r1, 0, TAU); c.arc(0, 0, r0, 0, TAU, true);
  const b = w.bezel;
  if (b === 'tachy' || b === 'plongee') c.fillStyle = '#0d0e10';
  else if (b === 'bico') { const g = c.createLinearGradient(0, -r1, 0, r1); g.addColorStop(0, '#1c3f78'); g.addColorStop(0.495, '#1c3f78'); g.addColorStop(0.505, '#0e0f12'); g.addColorStop(1, '#0e0f12'); c.fillStyle = g; }
  else { const g = c.createLinearGradient(-r1, -r1, r1, r1); g.addColorStop(0, cols[0]); g.addColorStop(0.5, cols[1]); g.addColorStop(1, cols[2]); c.fillStyle = g; }
  c.fill('evenodd');
  c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 1; c.beginPath(); c.arc(0, 0, r1, 0, TAU); c.stroke();
  const rm = (r0 + r1) / 2, th = r1 - r0;
  if (b === 'cannele') { c.strokeStyle = 'rgba(0,0,0,.45)'; c.lineWidth = 1.2; for (let i = 0; i < 90; i++) { const a = (i / 90) * TAU; c.beginPath(); c.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); c.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); c.stroke(); } }
  if (b === 'tachy' || b === 'plongee' || b === 'bico') {
    c.strokeStyle = 'rgba(255,255,255,.8)'; c.fillStyle = 'rgba(255,255,255,.85)';
    const n = b === 'tachy' ? 60 : 12;
    for (let i = 0; i < n; i++) { const a = (i / n) * TAU - TAU / 4; const big = b !== 'tachy' || i % 5 === 0; c.lineWidth = big ? 1.6 : 0.8; c.beginPath(); c.moveTo(Math.cos(a) * (rm - th * (big ? 0.3 : 0.15)), Math.sin(a) * (rm - th * (big ? 0.3 : 0.15))); c.lineTo(Math.cos(a) * (rm + th * (big ? 0.3 : 0.15)), Math.sin(a) * (rm + th * (big ? 0.3 : 0.15))); c.stroke(); }
    if (b !== 'tachy') { c.beginPath(); c.moveTo(0, -rm - th * 0.3); c.lineTo(th * 0.3, -rm + th * 0.3); c.lineTo(-th * 0.3, -rm + th * 0.3); c.closePath(); c.fillStyle = '#0d0e10'; c.fill(); c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.arc(0, -rm, th * 0.16, 0, TAU); c.fill(); }
  }
  if (b === 'octo') { for (let i = 0; i < 8; i++) { const a = i * (TAU / 8); const x = Math.cos(a) * rm, y = Math.sin(a) * rm; c.fillStyle = cols[2]; c.beginPath(); c.arc(x, y, th * 0.22, 0, TAU); c.fill(); c.strokeStyle = cols[0]; c.lineWidth = 1; c.beginPath(); c.moveTo(x - th * 0.15, y); c.lineTo(x + th * 0.15, y); c.stroke(); } }
  // rehaut
  c.beginPath(); c.arc(0, 0, R * 1.015, 0, TAU); c.fillStyle = '#050506'; c.fill();
}

interface DialSt { d0: string; d1: string; ink: string; mk: 'baton' | 'num' | 'dot'; tex: string; numCol?: string }
const DIALS: Record<string, DialSt> = {
  noir: { d0: '#1c1d20', d1: '#060607', ink: '#f1f1f1', mk: 'baton', tex: 'sun' },
  tapis: { d0: '#d4d8dc', d1: '#8e949b', ink: '#16181b', mk: 'baton', tex: 'tapis' },
  vert: { d0: '#6b7075', d1: '#34373b', ink: '#7dff9a', mk: 'num', tex: 'grain', numCol: '#7dff9a' },
  bleu: { d0: '#1d4f9c', d1: '#061630', ink: '#f4f7ff', mk: 'dot', tex: 'sun' },
  c63: { d0: '#f3e8cf', d1: '#cdbd98', ink: '#22201b', mk: 'num', tex: 'c63' },
  or: { d0: '#e9c75c', d1: '#9b7616', ink: '#3b2a04', mk: 'baton', tex: 'leaf' },
  squel: { d0: '#2a2c30', d1: '#0a0b0c', ink: '#f0e2c0', mk: 'baton', tex: 'squel' },
  lune: { d0: '#f4f1ea', d1: '#c9c4b8', ink: '#1a2a4a', mk: 'dot', tex: 'lune' },
};
export function dialInk(w: Watch, pal?: Pal | null) { return pal ? pal.ink : (DIALS[w.dial] || DIALS.noir).ink; }
export function dialLight(w: Watch) { const d = w.dial; return d === 'tapis' || d === 'c63' || d === 'lune' || d === 'or'; }

// Cadran (disque de rayon R), teinté par la ville en jeu.
export function drawDial(c: C2, R: number, w: Watch, pal: Pal | null, label?: string, note?: string, day?: number) {
  const ds = DIALS[w.dial] || DIALS.noir;
  const d0 = pal ? pal.d0 : ds.d0, d1 = pal ? pal.d1 : ds.d1, ink = pal ? pal.ink : ds.ink;
  c.save();
  c.beginPath(); c.arc(0, 0, R, 0, TAU); c.clip();
  const g = c.createRadialGradient(0, -R * 0.2, R * 0.05, 0, 0, R);
  g.addColorStop(0, d0); g.addColorStop(1, d1); c.fillStyle = g; c.fillRect(-R, -R, 2 * R, 2 * R);
  const rng = mkRng(95);
  const lightD = pal ? pal.d0 > '#9' : dialLight(w);
  const hi = lightD ? 'rgba(0,0,0,' : 'rgba(255,255,255,';
  if (ds.tex === 'sun') { for (let i = 0; i < 180; i++) { const a = (i / 180) * TAU; c.strokeStyle = hi + (0.02 + rng() * 0.06) + ')'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * R, Math.sin(a) * R); c.stroke(); } }
  else if (ds.tex === 'tapis') { const s = R * 0.085; for (let y = -R; y < R; y += s) for (let x = -R; x < R; x += s) { c.fillStyle = 'rgba(255,255,255,.13)'; c.fillRect(x + 1, y + 1, s - 2, 1.4); c.fillRect(x + 1, y + 1, 1.4, s - 2); c.fillStyle = 'rgba(0,0,0,.2)'; c.fillRect(x + 1, y + s - 2, s - 2, 1.4); c.fillRect(x + s - 2, y + 1, 1.4, s - 2); } }
  else if (ds.tex === 'grain') { for (let i = 0; i < 900; i++) { c.fillStyle = hi + rng() * 0.07 + ')'; c.fillRect((rng() * 2 - 1) * R, (rng() * 2 - 1) * R, 1.5, 1.5); } }
  else if (ds.tex === 'leaf') { for (let i = 0; i < 60; i++) { c.fillStyle = (rng() < 0.5 ? 'rgba(255,255,220,' : 'rgba(90,60,0,') + rng() * 0.12 + ')'; c.save(); c.translate((rng() * 2 - 1) * R, (rng() * 2 - 1) * R); c.rotate(rng() * 0.3); c.fillRect(0, 0, R * 0.34, R * 0.34); c.restore(); } }
  else if (ds.tex === 'c63') { for (const sx of [-1, 1]) { c.beginPath(); c.arc(sx * R * 0.38, 0, R * 0.2, 0, TAU); c.fillStyle = 'rgba(0,0,0,.07)'; c.fill(); c.strokeStyle = rgba('#22201b', 0.6); c.lineWidth = 1; c.stroke(); for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; c.beginPath(); c.moveTo(sx * R * 0.38 + Math.cos(a) * R * 0.16, Math.sin(a) * R * 0.16); c.lineTo(sx * R * 0.38 + Math.cos(a) * R * 0.19, Math.sin(a) * R * 0.19); c.stroke(); } } }
  else if (ds.tex === 'squel') { c.strokeStyle = 'rgba(240,210,150,.28)'; c.lineWidth = 1.5; for (const [x, y, r, n] of [[-0.3, -0.25, 0.3, 14], [0.32, 0.1, 0.36, 18], [-0.12, 0.42, 0.24, 10], [0.25, -0.45, 0.18, 8]] as number[][]) { c.beginPath(); c.arc(x * R, y * R, r * R, 0, TAU); c.stroke(); c.beginPath(); c.arc(x * R, y * R, r * R * 0.3, 0, TAU); c.stroke(); for (let i = 0; i < n; i++) { const a = (i / n) * TAU; c.beginPath(); c.moveTo(x * R + Math.cos(a) * r * R * 0.3, y * R + Math.sin(a) * r * R * 0.3); c.lineTo(x * R + Math.cos(a) * r * R, y * R + Math.sin(a) * r * R); c.stroke(); } } }
  else if (ds.tex === 'lune') {
    c.strokeStyle = rgba('#1a2a4a', 0.5); c.lineWidth = 1; c.beginPath(); c.arc(0, -R * 0.22, R * 0.42, 0, TAU); c.stroke();
    c.save(); c.beginPath(); c.arc(0, R * 0.46, R * 0.2, Math.PI, 0); c.closePath(); c.fillStyle = '#12224a'; c.fill(); c.clip();
    const ph = ((Date.now() / 86400000 - 10.3) % 29.53) / 29.53;
    c.fillStyle = '#f2e7b0'; c.beginPath(); c.arc((ph - 0.5) * R * 0.5, R * 0.38, R * 0.085, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 9; i++) c.fillRect((rng() - 0.5) * R * 0.4, R * 0.27 + rng() * R * 0.18, 1.2, 1.2);
    c.restore();
  }
  // vignette
  const v = c.createRadialGradient(0, 0, R * 0.6, 0, 0, R); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.4)'); c.fillStyle = v; c.fillRect(-R, -R, 2 * R, 2 * R);
  // minuterie
  c.strokeStyle = rgba(ink, 0.5);
  for (let i = 0; i < 60; i++) { const a = (i / 60) * TAU; const big = i % 5 === 0; c.lineWidth = big ? 1.6 : 0.8; const ra = R * (big ? 0.875 : 0.89), rb = R * 0.925; c.beginPath(); c.moveTo(Math.sin(a) * ra, -Math.cos(a) * ra); c.lineTo(Math.sin(a) * rb, -Math.cos(a) * rb); c.stroke(); }
  c.strokeStyle = rgba(ink, 0.16); c.lineWidth = 1; c.beginPath(); c.arc(0, 0, R * 0.9, 0, TAU); c.stroke();
  // index
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU; c.save(); c.rotate(a);
    if (ds.mk === 'baton') { c.fillStyle = rgba(ink, 0.9); const ww = i === 0 ? R * 0.045 : R * 0.024; c.fillRect(-ww, -R * 0.84, ww * 2, R * 0.13); c.fillStyle = rgba(ink, 0.35); c.fillRect(-ww, -R * 0.84, ww * 2, 1.5); }
    else if (ds.mk === 'dot') { c.fillStyle = rgba(ink, 0.92); c.beginPath(); if (i % 3 === 0) c.rect(-R * 0.022, -R * 0.84, R * 0.044, R * 0.11); else c.arc(0, -R * 0.78, R * 0.032, 0, TAU); c.fill(); }
    else { c.translate(0, -R * 0.76); c.rotate(-a); c.font = `600 ${R * 0.14}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = pal ? rgba(ink, 0.9) : ds.numCol || ink; c.fillText(String(i === 0 ? 12 : i), 0, 0); }
    c.restore();
  }
  // textes
  c.textAlign = 'center'; c.textBaseline = 'middle';
  if (label) { c.font = `600 ${R * 0.085}px ${FONT}`; c.fillStyle = rgba(ink, 0.75); try { (c as any).letterSpacing = R * 0.02 + 'px'; } catch { /* */ } c.fillText(label, 0, -R * 0.42); try { (c as any).letterSpacing = '0px'; } catch { /* */ } }
  if (note) { c.font = `500 ${R * 0.06}px ${FONT}`; c.fillStyle = rgba(ink, 0.5); c.fillText(note, 0, -R * 0.32); }
  // guichet de date
  if (day != null && ds.tex !== 'lune') {
    const dw = R * 0.17, dh = R * 0.12, dy = R * 0.36;
    c.fillStyle = '#f2f0ea'; c.fillRect(-dw / 2, dy - dh / 2, dw, dh); c.strokeStyle = rgba(ink, 0.6); c.lineWidth = 1; c.strokeRect(-dw / 2, dy - dh / 2, dw, dh);
    c.font = `700 ${R * 0.1}px ${FONT}`; c.fillStyle = '#111'; c.fillText(String(day), 0, dy + 1);
  }
  c.restore();
}

// Forme d'aiguille pointant vers le haut (−y). hollow = contour seul.
export function handPath(c: C2, style: string, L: number, hw: number) {
  const t = L * 0.14;
  c.beginPath();
  switch (style) {
    case 'dauphine': c.moveTo(0, t); c.lineTo(hw * 1.5, -L * 0.12); c.lineTo(0, -L); c.lineTo(-hw * 1.5, -L * 0.12); break;
    case 'feuille': case 'bleuies': c.moveTo(0, t); c.quadraticCurveTo(hw * 2.6, -L * 0.45, 0, -L); c.quadraticCurveTo(-hw * 2.6, -L * 0.45, 0, t); break;
    case 'seringue': c.moveTo(-hw * 0.5, t); c.lineTo(hw * 0.5, t); c.lineTo(hw * 0.5, -L * 0.2); c.lineTo(hw * 1.3, -L * 0.25); c.lineTo(hw * 1.3, -L * 0.72); c.lineTo(hw * 0.3, -L * 0.78); c.lineTo(0, -L); c.lineTo(-hw * 0.3, -L * 0.78); c.lineTo(-hw * 1.3, -L * 0.72); c.lineTo(-hw * 1.3, -L * 0.25); c.lineTo(-hw * 0.5, -L * 0.2); break;
    case 'fleche': c.moveTo(-hw * 0.7, t); c.lineTo(hw * 0.7, t); c.lineTo(hw * 0.7, -L * 0.8); c.lineTo(hw * 2.2, -L * 0.8); c.lineTo(0, -L); c.lineTo(-hw * 2.2, -L * 0.8); c.lineTo(-hw * 0.7, -L * 0.8); break;
    default: c.moveTo(-hw, t); c.lineTo(hw, t); c.lineTo(hw * 0.75, -L * 0.97); c.lineTo(0, -L); c.lineTo(-hw * 0.75, -L * 0.97);
  }
  c.closePath();
}
export function drawHand(c: C2, style: string, ang: number, L: number, hw: number, col: string, hollow: boolean, alpha = 1, glow = true) {
  c.save(); c.rotate(ang); c.globalAlpha = alpha;
  handPath(c, style, L, hw);
  if (hollow) { c.strokeStyle = col; c.lineWidth = 1.4; c.setLineDash([5, 4]); c.stroke(); c.setLineDash([]); }
  else {
    if (glow) { c.strokeStyle = rgba(col.startsWith('#') ? col : '#ffffff', 0.22); c.lineWidth = hw * 2.2 + 5; c.lineJoin = 'round'; c.stroke(); }
    c.fillStyle = col; c.fill();
    if (style === 'squelh') { c.globalCompositeOperation = 'destination-out'; handPath(c, 'baton', L * 0.8, hw * 0.4); c.fill(); c.globalCompositeOperation = 'source-over'; }
    c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(-0.6, -L * 0.9, 1.2, L * 0.8);
  }
  c.restore();
}

// Fond de boîte (gravure).
export function drawBackCase(c: C2, R: number, w: Watch, engr: string) {
  const k = caseK(w), cols = METAL[w.case] || METAL.acier;
  c.beginPath(); c.arc(0, 0, R * k, 0, TAU); c.fillStyle = metal(c, cols, R * k); c.fill();
  c.beginPath(); c.arc(0, 0, R * 1.02, 0, TAU); c.strokeStyle = 'rgba(0,0,0,.5)'; c.lineWidth = 2; c.stroke();
  for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; c.fillStyle = cols[2]; c.beginPath(); c.arc(Math.cos(a) * R * 1.1, Math.sin(a) * R * 1.1, R * 0.03, 0, TAU); c.fill(); }
  if (w.back === 'saphir') { c.beginPath(); c.arc(0, 0, R * 0.8, 0, TAU); c.fillStyle = '#0b0c0e'; c.fill(); }
  const t = w.back === 'g95' ? '95' : w.back === 'libre' ? engr || '···' : '';
  c.fillStyle = 'rgba(0,0,0,.6)'; c.textAlign = 'center'; c.textBaseline = 'middle';
  if (w.back === 'g95') { c.font = `700 ${R * 0.7}px ${FONT}`; c.fillText('95', 0, R * 0.03); }
  else if (t) { c.font = `600 ${R * 0.13}px ${FONT}`; const s = t.toUpperCase().slice(0, 40); const step = Math.min(0.2, 5.4 / s.length); for (let i = 0; i < s.length; i++) { c.save(); c.rotate((i - (s.length - 1) / 2) * step); c.fillText(s[i], 0, -R * 0.9); c.restore(); } }
}
