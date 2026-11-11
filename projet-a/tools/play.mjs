import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || undefined });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
await p.route(/hyperliquid|binance|coinbase/, (r) => r.abort());
await p.goto('http://localhost:4174/'); await p.waitForTimeout(1200);
const k = +(process.argv[2] || 0); if (k) { await p.evaluate((k) => { window.__t.S.holes = k; window.__t.jump(k); }, k); await p.waitForTimeout(900); }
await p.mouse.move(250, 600); await p.mouse.down(); await p.mouse.move(180, 660, { steps: 6 }); await p.waitForTimeout(200); await p.screenshot({ path: 'shots/p1-aim.png' });
await p.mouse.up(); await p.waitForTimeout(500); await p.screenshot({ path: 'shots/p2-fly.png' }); await p.waitForTimeout(3500); await p.screenshot({ path: 'shots/p3-rest.png' });
console.log(JSON.stringify(await p.evaluate(() => { const A = window.__t.A; return { st: A.st, hole: A.hole, strokes: A.strokes, x: A.ball.x, cup: A.c.holes[A.hole].cup }; })), errs.join('\n'));
await b.close();
