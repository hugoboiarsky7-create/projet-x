import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: true, isMobile: true });
const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message + (e.stack || '').split('\n')[1])); p.on('console', (m) => { if (m.type() === 'error') errs.push('CONSOLE ' + m.text()); });
await p.goto('http://localhost:4176/'); await p.waitForTimeout(2600); await p.screenshot({ path: 'shots/00-first.png' });
// joue les premiers niveaux comme un débutant appliqué
const solve = async () => { for (let k = 0; k < 40; k++) { const st = await p.evaluate(() => { const t = window.__t; if (t.mode !== 'task' || !t.task) return null; const s = t.task.steps[t.task.si]; if (t.task.lock) return 'wait'; const o = t.objs; let pick = null;
  if (s.k === 'T') pick = o.find((x) => x.role === 'touch' && !x.done); else if (s.k === 'F') pick = o.find((x) => x.role === 'opt' && x.ch === s.target);
  else if (s.k === 'B') { const c = s.syl.charCodeAt(0) - 0xac00; const L = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ', V = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ', TT = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ']; const need = { l: L[Math.floor(c / 588)], v: V[Math.floor((c % 588) / 28)], t: TT[c % 28] }; const r = ['l', 'v', 't'].find((r) => need[r] && !t.task.fill.includes(r)); pick = o.find((x) => x.role === 'tray' && x.ch === need[r]); }
  else pick = o.find((x) => x.role === 'opt' && (s.k === 'R' ? x.key === 'p:' + s.opts.find((q) => q) && false : x.ch === s.word)) || o.find((x) => x.role === 'opt' && x.key.startsWith('p:') && window.__pic && x.ch === window.__pic[s.word]);
  if (!pick && s.k === 'R') { for (const x of o.filter((x) => x.role === 'opt')) { t.tap(x); if (t.task.lock) break; } return 'ok'; }
  if (pick) { t.tap(pick); return 'ok'; } return 'none'; }); if (st === null) break; await p.waitForTimeout(st === 'wait' ? 350 : 220); } };
const shot = async (n) => { await p.waitForTimeout(350); await p.screenshot({ path: `shots/${n}.png` }); };
await shot('01-T'); await p.evaluate(() => { const t = window.__t; t.tap(t.objs[0]); }); await shot('02-T-lit'); await solve(); await p.waitForTimeout(2800); await shot('03-after1');
for (let i = 0; i < 3; i++) { await p.waitForTimeout(1500); await solve(); await p.waitForTimeout(600); } await p.waitForTimeout(2500);
const st = await p.evaluate(() => { const t = window.__t; return { mode: t.mode, lit: t.S.prog.lit, known: t.S.prog.known, k: t.task && t.task.steps[t.task.si].k }; }); console.log(JSON.stringify(st)); await shot('04-level5');
// étape B en cours
await p.evaluate(() => { const t = window.__t; t.S.prog.lit[0] = 3; t.S.prog.known = 'ㅏㅣㅗㅜㅓㅡ'; t.setMode('idle'); t.startLevel(); });
for (let i = 0; i < 14; i++) { await p.waitForTimeout(600); const k = await p.evaluate(() => { const t = window.__t; if (!t.task) return 'none'; const s = t.task.steps[t.task.si]; if (s.k === 'B') return 'B'; const o = t.objs.find((x) => (s.k === 'T' && x.role === 'touch' && !x.done) || (s.k === 'F' && x.ch === s.target)); if (o && !t.task.lock) t.tap(o); return s.k; }); if (k === 'B') break; }
await p.waitForTimeout(900); await shot('05-B'); await p.evaluate(() => { const t = window.__t; if (!t.task) return; const o = t.objs.find((x) => x.role === 'tray' && x.ch === 'ㄱ') || t.objs.find((x) => x.role === 'tray'); if (o) t.tap(o); }); await shot('06-B-part');
await p.evaluate(() => { const t = window.__t; t.S.prog.lit = [20, 20, 6, 0, 0, 0]; t.S.prog.known = 'ㅏㅣㅗㅜㅓㅡㄱㅋㄴㅁㄷㅌㄹㅂㅍㅅㅈㅊㅇㅎㅐㅔㅑㅕㅛㅠㅘ'; t.S.prog.seenW = ['커피', '버스', '택시', '피자', '호텔', '치킨', '고기', '나무', '바다', '산', '물', '밥', '개', '여우', '은행', '약국', '서점', '식당', '출구', '입구']; t.setDi(2); t.setMode('idle'); t.startLevel(); }); await p.waitForTimeout(1200); await shot('07-R');
await p.evaluate(() => { const t = window.__t; t.S.prog.lit = [20, 20, 20, 20, 0, 0]; t.setDi(4); t.setMode('idle'); t.startLevel(); }); await p.waitForTimeout(1200); await shot('08-P');
// quartiers à 0, 50, 100 %
for (let d = 0; d < 6; d++) for (const pc of [0, 10, 20]) { await p.evaluate(([d, pc]) => { const t = window.__t; t.noAuto(); t.finish && 0; t.S.prog.lit = t.S.prog.lit.map((_, i) => (i < d ? 20 : i === d ? pc : 0)); t.S.prog.known = 'ㅏㅣㅗㅜㅓㅡㄱㅋㄴㅁㄷㅌㄹㅂㅍㅅㅈㅊㅇㅎㅐㅔㅑㅕㅛㅠㅘㅝㅢㄲㅃㄸㅆㅉㅙㅚㅟㅖㅒㅞ'; t.S.secrets = pc === 20 ? ['밥', '시계', '피시방', '리그 오브 레전드', '엘피바', '놀란', '파스타', '오락실', '파델', '하이퍼리퀴드'] : []; if (t.mode === 'task') { t.setMode('idle'); } t.setDi(d); }, [d, pc]); await p.waitForTimeout(1300); await p.screenshot({ path: `shots/d${d}-${String(pc * 5).padStart(3, '0')}.png` }); }
await p.evaluate(() => { const t = window.__t; t.S.prog.seenW = ['커피', '버스', '택시', '피자', '호텔', '치킨', '고기', '나무', '바다', '산', '물', '밥', '개', '여우', '라면', '맥주']; t.setMode('book'); }); await shot('20-book');
await p.evaluate(() => { const t = window.__t; t.setMode('end'); }); await p.waitForTimeout(12500); await shot('21-end');
console.log(errs.length ? [...new Set(errs)].slice(0, 8).join('\n') : 'aucune erreur'); await b.close();
