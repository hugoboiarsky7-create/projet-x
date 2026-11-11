import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || undefined });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message + (e.stack || '').split('\n')[1])); p.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
await p.goto('http://localhost:4175/'); await p.waitForTimeout(1500); await p.screenshot({ path: 'shots/00-start.png' });
const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'];
const play = async (n) => { for (let i = 0; i < n; i++) { await p.keyboard.press(keys[(i * 7 + (i >> 2)) % 4]); await p.waitForTimeout(60); await p.keyboard.press('Enter'); await p.waitForTimeout(60); if (await p.evaluate(() => window.__t.G.over)) break; } };
await play(14); await p.waitForTimeout(500); await p.screenshot({ path: 'shots/01-home.png' });
await p.evaluate(() => window.__t.menuScreen()); await p.waitForTimeout(500); await p.screenshot({ path: 'shots/02-menu.png' }); await p.keyboard.press('Escape'); await p.waitForTimeout(300);
for (const k of ['trat', 'seoul', 'cheng', 'bkk', 'tokyo', 'omakase']) { await p.evaluate((k) => { const t = window.__t; t.S.best = { home: 999, trat: 999, seoul: 999, cheng: 999, bkk: 999, tokyo: 999 }; t.start(k, '', 12345); }, k); await p.waitForTimeout(300); await play(22); await p.waitForTimeout(500); await p.screenshot({ path: `shots/1-${k}.png` }); }
await p.evaluate(() => window.__t.start('seoul', 'tablee', 99)); await play(18); await p.waitForTimeout(400); await p.screenshot({ path: 'shots/2-tablee.png' });
await p.evaluate(() => { const t = window.__t; t.start('home', '', 7); }); await play(400); await p.waitForTimeout(1600); await p.screenshot({ path: 'shots/3-end.png' });
await p.evaluate(() => { const t = window.__t; for (const r of ['cacio', 'tartb', 'cesar', 'carbo', 'bibim', 'kimbap', 'hotpot', 'padthai', 'sushi', 'ramen', 'lasagnes', 'mochi']) t.S.carnet[r] = 1 + (r.length % 3); t.carnet(); }); await p.waitForTimeout(400); await p.screenshot({ path: 'shots/4-carnet.png', fullPage: false });
await p.evaluate(() => { const t = window.__t; t.S.reg = { monsieur: 3, padel: 2, trader: 4, mamie: 1 }; t.S.perk = 'joker'; t.regs(); }); await p.waitForTimeout(400); await p.screenshot({ path: 'shots/5-regs.png' });
console.log(errs.length ? [...new Set(errs)].slice(0, 8).join('\n') : 'aucune erreur'); await b.close();
