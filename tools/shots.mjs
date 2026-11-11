import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
mkdirSync('shots', { recursive: true });
const url = process.argv[2] || 'http://localhost:4173/';
const only = process.argv[3] || '';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
p.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
await p.goto(url); await p.waitForTimeout(3600);
const shot = async (n) => { if (!only || n.includes(only)) await p.screenshot({ path: `shots/${n}.png` }); };
await shot('00-home');
await p.mouse.click(195, 700); await p.waitForTimeout(100); await p.evaluate(() => { window.__t.A.sim.invuln = 1e9; }); await p.waitForTimeout(2600); await shot('01-run');
// villes
for (let k = 0; k < 11; k++) {
  await p.evaluate((k) => { const t = window.__t; const s = t.A.sim; s.invuln = 1e9; if (k > 0) { if (k === 9) s.route.push(s.route[8]); if (k >= 9) { /* villes cachées */ } s.state = 'run'; s.ci = Math.min(k, 8) - 1; s.next(); } }, k);
  if (k === 9) await p.evaluate(async () => { const t = window.__t; const m = await import('/src/cities.ts').catch(() => null); });
  await p.waitForTimeout(k === 8 ? 5200 : 4300);
  await shot('1' + k + '-city');
  if (k === 8) { await p.evaluate(() => { const s = window.__t.A.sim; s.T = s.plan.spin0 + 5; }); await p.waitForTimeout(1500); await shot('18b-boss'); }
  if (k >= 8) break;
}
for (const [nm, key] of [['19-kan', 'KANAZAWA'], ['19-tak', 'TAKAYAMA']]) { await p.evaluate((key) => { const t = window.__t, s = t.A.sim; s.route[8] = t[key]; s.state = 'run'; s.ci = 7; s.next(); s.invuln = 1e9; }, key); await p.waitForTimeout(4300); await shot(nm); }
// cartes
await p.evaluate(() => { const s = window.__t.A.sim; s.state = 'run'; s.ci = 1; s.next(); s.invuln = 1e9; s.T = s.plan.dur - 0.1; });
await p.waitForTimeout(1200); await shot('20-cards');
await p.mouse.click(195, 240); await p.waitForTimeout(1500); await shot('21-after-card');
// mort
await p.evaluate(() => { const s = window.__t.A.sim; s.mods.reserve = 1; s.mods.lev3 = 1; s.mods.gmt = 2; s.mods.plan = 2; s.invuln = 1e9; s.lives = 0; });
await p.waitForTimeout(700); await shot('22-plan-large');
await p.evaluate(() => { const s = window.__t.A.sim; s.invuln = 0; s.a = s.hAng(0, s.T) - 0.02; s.dir = 1; });
await p.waitForTimeout(150); await shot('23-rewind'); await p.waitForTimeout(900); await shot('24-dead');
await p.evaluate(() => { const t = window.__t; t.S.deaths = 12; t.S.rou = 5200; t.A.overlay = null; }); await p.waitForTimeout(300); await shot('25-home2');
await p.evaluate(() => { const t = window.__t; t.A.mode = 'atelier'; }); await p.waitForTimeout(400); await shot('30-atelier');
for (const [i, pos] of [[146, 395], [244, 395], [341, 395], [97, 426], [195, 426], [292, 426]].entries()) { await p.mouse.click(pos[0], pos[1]); await p.waitForTimeout(250); await shot('31-atelier-' + i); }
await p.evaluate(() => { const t = window.__t; Object.assign(t.S.eq, { case: 'orj', bezel: 'bico', dial: 'lune', hands: 'feuille', strap: 'croco' }); t.A.mode = 'dial'; }); await p.waitForTimeout(400); await shot('32-home-lux');
await p.evaluate(() => { const t = window.__t; Object.assign(t.S.eq, { case: 'c39', bezel: 'octo', dial: 'tapis', hands: 'dauphine', strap: 'acierb' }); }); await p.waitForTimeout(400); await shot('33-home-tapis');
await p.evaluate(() => { const t = window.__t; Object.assign(t.S.eq, { case: 'dlc', bezel: 'tachy', dial: 'c63', hands: 'seringue', strap: 'nato' }); }); await p.waitForTimeout(400); await shot('34-home-63');
await p.evaluate(() => { const t = window.__t; Object.assign(t.S.eq, { case: 'bronze', bezel: 'plongee', dial: 'vert', hands: 'fleche', strap: 'fauve' }); }); await p.waitForTimeout(400); await shot('35-home-vert');
await p.evaluate(() => { const t = window.__t; Object.assign(t.S.eq, { case: 'acier', bezel: 'lisse', dial: 'noir', hands: 'baton', strap: 'cuir' }); t.A.mode = 'stats'; }); await p.waitForTimeout(300); await shot('40-stats');
await p.evaluate(() => { const t = window.__t; t.A.mode = 'dial'; t.enterBack(); }); await p.waitForTimeout(1300); await shot('50-back');
await p.mouse.click(195, 500); await p.waitForTimeout(700); await shot('51-back-fly'); await p.waitForTimeout(2500); await shot('52-back-after');
await p.evaluate(() => { const t = window.__t; t.A.mode = 'credits'; t.A.credT = 9; }); await p.waitForTimeout(200); await shot('60-credits');
await p.evaluate(() => { const t = window.__t; t.A.mode = 'desk'; }); await p.waitForTimeout(200); await shot('61-desk');
console.log(errs.length ? errs.slice(0, 12).join('\n') : 'aucune erreur');
await b.close();
