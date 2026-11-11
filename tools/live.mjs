import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
const p = await ctx.newPage(); const errs = [];
p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
p.on('response', (r) => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url()); });
await p.goto(process.argv[2]); await p.waitForTimeout(4000);
const title = await p.title();
await p.mouse.click(195, 700); await p.waitForTimeout(1500);
const st = await p.evaluate(async () => ({ run: !!window.__t.A.sim, sw: !!(await navigator.serviceWorker.getRegistration()) }));
await p.screenshot({ path: 'shots/live.png' });
// hors ligne
await p.waitForTimeout(2500); await ctx.setOffline(true); await p.reload().catch((e) => errs.push('OFFLINE ' + e.message)); await p.waitForTimeout(2500);
const off = await p.evaluate(() => !!(window.__t && window.__t.G.W)).catch(() => false);
console.log(JSON.stringify({ title, ...st, offline: off }), errs.length ? errs.join('\n') : 'aucune erreur');
await b.close();
