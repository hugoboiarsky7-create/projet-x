export const FONT = "'Avenir Next Condensed','Roboto Condensed','DIN Condensed','sans-serif-condensed','Arial Narrow','Helvetica Neue',Arial,sans-serif";
export type C2 = CanvasRenderingContext2D;
export const G = {
  cv: null as unknown as HTMLCanvasElement, c: null as unknown as C2,
  W: 0, H: 0, dpr: 1, cx: 0, cy: 0, R: 0, st: 0, sb: 0, now: 0, dt: 0,
};
export function txt(c: C2, s: string, x: number, y: number, px: number, col: string, align: CanvasTextAlign = 'center', w = 600, ls = 0) {
  c.font = `${w} ${px}px ${FONT}`;
  c.textAlign = align; c.textBaseline = 'middle'; c.fillStyle = col;
  try { (c as any).letterSpacing = ls + 'px'; } catch { /* */ }
  c.fillText(s, x + (align === 'center' ? ls / 2 : 0), y);
  try { (c as any).letterSpacing = '0px'; } catch { /* */ }
}
export function rr(c: C2, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
export function wrapText(c: C2, s: string, maxW: number): string[] {
  const out: string[] = []; let cur = '';
  for (const w of s.split(' ')) { const t = cur ? cur + ' ' + w : w; if (c.measureText(t).width > maxW && cur) { out.push(cur); cur = w; } else cur = t; }
  if (cur) out.push(cur);
  return out;
}
export const fmt = (n: number) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
export function vib(p: number | number[]) { try { navigator.vibrate && navigator.vibrate(p); } catch { /* */ } }
export function rgba(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
