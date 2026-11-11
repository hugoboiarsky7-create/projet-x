import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
mkdirSync('shots', { recursive: true });
const url = process.argv[2] || 'http://localhost:4174/'; const list = (process.argv[3] || '0,2,20,45,60,95,130,160,200,240,268,300,352,380,400,430,460,500,540,585').split(',').map(Number);
const land = process.argv[4] === 'land';
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || undefined });
const ctx = await b.newContext({ viewport: land ? { width: 844, height: 390 } : { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
const p = await ctx.newPage(); const errs = [];
p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
await p.route('**/api.hyperliquid.xyz/**', (r) => r.abort()); await p.route('**/api.binance.com/**', (r) => r.abort()); await p.route('**/api.exchange.coinbase.com/**', (r) => r.abort());
await p.goto(url); await p.waitForTimeout(1500);
for (const k of list) {
  await p.evaluate((k) => { const t = window.__t; t.S.holes = k; t.jump(k); }, k);
  await p.waitForTimeout(900); await p.screenshot({ path: `shots/h${String(k).padStart(3, '0')}${land ? 'L' : ''}.png` });
}
console.log(errs.length ? [...new Set(errs)].slice(0, 10).join('\n') : 'aucune erreur');
await b.close();
