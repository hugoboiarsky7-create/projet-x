// Longue durée + données en direct simulées : pas de fuite, le monde s'étend, le trou du jour arrive.
import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || undefined, args: ['--enable-precise-memory-info'] });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true })).newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
const today = Math.floor(Date.now() / 864e5);
await p.route('**/api.hyperliquid.xyz/**', async (r) => { const q = JSON.parse(r.request().postData()).req, out = []; const step = q.interval === '1d' ? 864e5 : 36e5; for (let t = Math.floor(q.startTime / step) * step; t < Date.now(); t += step) out.push({ t, T: t + step - 1, s: 'BTC', i: q.interval, o: '1', c: String(80000 * (1 + 0.1 * Math.sin(t / 864e5 / 9) + 0.02 * Math.sin(t / 36e5 / 5))), h: '1', l: '1', v: '1', n: 1 }); await r.fulfill({ json: out }); });
await p.goto('http://localhost:4174/'); await p.waitForTimeout(2500);
const info = async () => p.evaluate(() => { const t = window.__t; return { holes: t.A.c.holes.length, ext: t.S.ext.length, hr: t.S.hr.length, st: t.A.st, hole: t.A.hole, hf: t.S.hourlyFrom }; });
console.log('après synchro', JSON.stringify(await info()));
await p.evaluate(() => window.__t.jump(99999)); await p.waitForTimeout(3500); await p.screenshot({ path: 'shots/z-end.png' }); console.log('au bout', JSON.stringify(await info()));
// le lendemain : un jour horaire de plus
await p.evaluate(() => { const t = window.__t; t.S.hourlyFrom -= 2; t.S.ext = t.S.ext.slice(0, -2); }); await p.evaluate(() => document.dispatchEvent(new Event('visibilitychange'))); await p.waitForTimeout(3000); console.log('trous du jour', JSON.stringify(await info())); await p.screenshot({ path: 'shots/z-daily.png' });
await p.evaluate(() => window.__t.jump(40)); const m0 = await p.evaluate(() => performance.memory.usedJSHeapSize);
for (let i = 0; i < 70; i++) { await p.mouse.move(250, 600); await p.mouse.down(); await p.mouse.move(250 - 40 - Math.random() * 90, 600 + 30 + Math.random() * 80, { steps: 3 }); await p.mouse.up(); await p.waitForTimeout(650); }
const m1 = await p.evaluate(() => performance.memory.usedJSHeapSize); console.log('mémoire', Math.round(m0 / 1e6), '→', Math.round(m1 / 1e6), 'Mo ;', JSON.stringify(await p.evaluate(() => ({ total: window.__t.S.total, hole: window.__t.A.hole }))), errs.length ? errs.join('|') : 'aucune erreur');
await b.close();
