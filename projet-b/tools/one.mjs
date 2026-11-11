import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await (await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true })).newPage();
await p.goto('http://localhost:4176/'); await p.waitForTimeout(1500);
const [d, n] = (process.argv[2] || '1,20').split(',').map(Number);
await p.evaluate(([d, n]) => { const t = window.__t; t.noAuto(); t.S.prog.lit = t.S.prog.lit.map((_, i) => (i < d ? 20 : i === d ? n : 0)); t.S.secrets = ['피시방', '리그 오브 레전드', '엘피바', '밥', '시계']; t.setMode('idle'); t.setDi(d); }, [d, n]); await p.waitForTimeout(1500);
await p.screenshot({ path: 'shots/one.png' }); await b.close();
