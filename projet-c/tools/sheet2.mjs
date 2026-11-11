import { chromium } from 'playwright';
import { readdirSync, readFileSync } from 'node:fs';
const pat = process.argv[2] || '', out = process.argv[3] || 'sheet', cols = +(process.argv[4] || 5), w = +(process.argv[5] || 250);
const files = readdirSync('shots').filter((f) => f.endsWith('.png') && !f.startsWith('sheet') && new RegExp(pat).test(f)).sort();
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || undefined });
const p = await b.newPage({ viewport: { width: cols * (w + 6), height: 100 } });
await p.setContent(`<body style="margin:0;background:#333;display:flex;flex-wrap:wrap;gap:6px">${files.map((f) => `<div style="position:relative"><img width="${w}" src="data:image/png;base64,${readFileSync('shots/' + f).toString('base64')}"><span style="position:absolute;left:2px;top:2px;color:#0f0;font:11px monospace;background:#000">${f}</span></div>`).join('')}</body>`);
await p.screenshot({ path: `shots/${out}.png`, fullPage: true }); await b.close(); console.log(files.length);
