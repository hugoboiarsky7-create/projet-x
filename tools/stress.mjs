import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--enable-precise-memory-info'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, hasTouch: true, isMobile: true });
const p = await ctx.newPage(); const errs = [];
p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message + ' ' + (e.stack || '').split('\n')[1]));
p.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
await p.goto('http://localhost:4173/'); await p.waitForTimeout(1500);
await p.evaluate(() => { window.__f = 0; window.__slow = 0; let l = performance.now(); const f = (t) => { window.__f++; if (t - l > 25) window.__slow++; l = t; requestAnimationFrame(f); }; requestAnimationFrame(f); });
const m0 = await p.evaluate(() => performance.memory ? performance.memory.usedJSHeapSize : 0);
const t0 = Date.now(); let taps = 0;
while (Date.now() - t0 < 75000) {
  const st = await p.evaluate(() => { const t = window.__t, s = t.A.sim; if (s && s.state === 'run' && Math.random() < 0.6) s.invuln = Math.max(s.invuln, 3); return s ? s.state : t.A.mode; });
  if (st === 'pick') await p.mouse.click(195, [240, 340, 440, 520][Math.floor(Math.random() * 4)]);
  else { await p.mouse.down(); await p.mouse.move(195 + (Math.random() < 0.2 ? 60 : 0), 600); await p.waitForTimeout(Math.random() < 0.3 ? 250 : 30); await p.mouse.up(); await p.mouse.move(195, 600); }
  taps++; await p.waitForTimeout(120 + Math.random() * 400);
}
const r = await p.evaluate(() => ({ f: window.__f, slow: window.__slow, mem: performance.memory ? performance.memory.usedJSHeapSize : 0, deaths: window.__t.S.deaths, runs: window.__t.S.runs, best: window.__t.S.best, city: window.__t.S.bestCity, parts: window.__t.A.parts.length }));
console.log('fps moyen', (r.f / 75).toFixed(1), 'images lentes', r.slow, 'mem', Math.round(m0 / 1e6), '→', Math.round(r.mem / 1e6), 'Mo', JSON.stringify(r), 'taps', taps);
console.log(errs.length ? [...new Set(errs)].slice(0, 10).join('\n') : 'aucune erreur');
await b.close();
