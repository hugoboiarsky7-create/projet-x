import { ING } from './data/ingredients';
import { RECIPES } from './data/recipes';
import { dishArt, prepArt, svg, BG } from './art';
export function sheetHTML() {
  const cell = (inner: string, bg: string) => `<div style="width:92px;height:92px;border-radius:18px;background:${bg};box-shadow:0 3px 0 rgba(60,40,20,.25),0 8px 14px rgba(60,40,20,.18);display:grid;place-items:center">${svg(inner).replace('<svg', '<svg width="84" height="84"')}</div>`;
  const ings = Object.keys(ING).map((k) => cell(`<g transform="translate(3.2 3.2) scale(.9)">${ING[k]}</g>`, '#fbf8f1')).join('');
  const dishes = RECIPES.map((r, i) => cell(dishArt(r.id, 1 + (i % 3), 'home'), 'transparent')).join('');
  const preps = RECIPES.filter((r) => r.ing[2] !== '-').slice(0, 10).map((r) => cell(prepArt(r.id, r.ing[2], 1), BG.prep)).join('');
  return `<body style="margin:0;padding:26px;background:#c9a577;display:flex;flex-wrap:wrap;gap:14px">${ings}<div style="flex-basis:100%"></div>${preps}<div style="flex-basis:100%"></div>${dishes}</body>`;
}
export function iconHTML(s: number) { return `<body style="margin:0"><div style="width:${s}px;height:${s}px;background:linear-gradient(135deg,#e6c391,#cfa26b);display:grid;place-items:center"><div style="width:62%;height:62%;border-radius:22%;background:#fbf8f1;box-shadow:0 ${s * 0.02}px 0 rgba(70,45,20,.28),0 ${s * 0.05}px ${s * 0.08}px rgba(50,25,5,.3);display:grid;place-items:center"><svg viewBox="0 0 64 64" width="84%" height="84%">${ING.moulin}</svg></div></div></body>`; }
