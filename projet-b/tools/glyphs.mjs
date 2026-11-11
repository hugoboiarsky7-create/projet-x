// Relecture des tracés : chaque bloc en tubes, à côté de la même syllabe dans une vraie police.
import { chromium } from 'playwright';
import { build } from 'vite';
import { writeFileSync, mkdirSync } from 'node:fs';
mkdirSync('shots', { recursive: true });
const r = await build({ configFile: false, logLevel: 'silent', build: { write: false, lib: { entry: 'src/hangul.ts', formats: ['iife'], name: 'HG', fileName: 'hg' } } });
const text = process.argv[2] || '아이오우어으가카나마다타라바파사자차하고기누나나무구두바다도시치마산문강물밥집개새네우유여우요리을지로커피버스택시피자호텔치킨카페메뉴와이파이꽃빵옷떡볶이삼겹살닭값없돼지회원웨귀의쌀찌얘계';
const css = new URL('../../node_modules/@fontsource/noto-sans-kr/400.css', import.meta.url).href;
const html = `<link rel="stylesheet" href="${css}"><body style="margin:0;background:#111;color:#fff;font:44px 'Noto Sans KR'"><canvas id="c" width="1200" height="1300"></canvas><script>${r[0].output[0].code}</script><script>
const g=c.getContext('2d'),T=${JSON.stringify(text)};let i=0;document.fonts.load("44px 'Noto Sans KR'",T).then(()=>{for(const ch of T){const x=20+(i%10)*118,y=14+Math.floor(i/10)*62;i++;
 for(const p of HG.parts(ch)){const [x0,y0,x1,y1]=p.box,m=new DOMMatrix([ (x1-x0)*48/10,0,0,(y1-y0)*48/10,x+x0*48,y+y0*48 ]);const pa=new Path2D();pa.addPath(new Path2D(p.d),m);g.lineCap='round';g.lineJoin='round';g.strokeStyle=p.role==='l'?'#ff5fa8':p.role==='v'?'#35e0ff':'#ffe14d';g.lineWidth=3.6;g.stroke(pa);g.strokeStyle='#fff';g.lineWidth=1.3;g.stroke(pa);}
 g.fillStyle='#bbb';g.font="44px 'Noto Sans KR'";g.fillText(ch,x+58,y+42);}document.title='ok';});</script>`;
writeFileSync('shots/glyphs.html', html);
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || undefined }); const p = await b.newPage({ viewport: { width: 1200, height: 1300 } });
await p.goto(new URL('../shots/glyphs.html', import.meta.url).href); await p.waitForFunction(() => document.title === 'ok', null, { timeout: 20000 }).catch(() => console.log('police non chargée')); await p.waitForTimeout(500);
await p.screenshot({ path: 'shots/glyphs.png', clip: { x: 0, y: 0, width: 1200, height: Math.ceil([...text].length / 10) * 62 + 20 } }); await b.close(); console.log('ok');
