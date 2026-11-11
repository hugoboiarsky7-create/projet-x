import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || undefined });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message + (e.stack || '').split('\n')[1]));
await p.route(/hyperliquid|binance|coinbase/, (r) => r.abort());
await p.goto('http://localhost:4174/'); await p.waitForTimeout(1200);
const J = async (k) => { await p.evaluate((k) => { window.__t.S.holes = k; window.__t.jump(k); }, k); await p.waitForTimeout(900); };
const at = async (id, name) => { await p.evaluate((id) => { const t = window.__t, A = t.A; const m = A.marks.find((m) => m.def.id === id); if (!m) return; A.ball.x = m.x - 40; A.ball.y = A.c.gy(A.ball.x) + 4; t.enter('m'); A.fade = 5; }, id); await p.waitForTimeout(1100); await p.screenshot({ path: `shots/m-${name || id}.png` }); };
for (const id of ['pizza', 'wreck', 'swan', 'statue', 'car', 'bell', 'h2', 'volcano', 'lantern', 'burrow', 'buoy', 'camel', 'wall', 'snowman', 'libra', 'luna', 'domino', 'arch', 'safe', 'column']) await at(id);
await J(9999); await p.waitForTimeout(3500); await p.screenshot({ path: 'shots/s-end.png' });
await J(300); await p.evaluate(() => { const t = window.__t; t.S.found = t.A.marks.map((m) => m.def.id).slice(0, 22); t.S.balls = ['w', 'obs', 'gold']; t.S.courses = ['m', 'e', 'x']; t.S.hio = t.A.c.holes.filter((h, i) => i % 9 === 0).map((h) => 'm' + Math.round(h.day * 100) / 100); });
await p.mouse.click(195, 30); await p.waitForTimeout(700); await p.screenshot({ path: 'shots/s-book.png' }); await p.mouse.click(30, 800); await p.waitForTimeout(400);
for (const z of [0.5, 0.2, 0.06, 0.012]) { await p.evaluate((z) => { const t = window.__t; t.setOv(z, t.A.ball.x - 100 / z); }, z); await p.waitForTimeout(300); await p.screenshot({ path: `shots/s-ov${z}.png` }); }
await p.evaluate(() => { const t = window.__t; t.setOv(1, 0); t.A.ball.x = t.A.c.xEnd; t.enter('m'); t.setOv(0.004, 0); }); await p.waitForTimeout(400); await p.screenshot({ path: 'shots/s-ovall.png' });
await p.evaluate(() => window.__t.setOv(1, 0));
for (const c of ['e', 'd', 'x']) { await p.evaluate((c) => window.__t.travel(c), c); await p.waitForTimeout(1200); await p.evaluate(() => { window.__t.jump(150); }); await p.waitForTimeout(900); await p.screenshot({ path: `shots/s-c${c}.png` }); }
console.log(errs.length ? [...new Set(errs)].join('\n') : 'aucune erreur'); await b.close();
