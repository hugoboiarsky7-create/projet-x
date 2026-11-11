import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const src = readFileSync('src/data/ingredients.ts', 'utf8'); void src;
const m = await import('../shots/sheet.mjs');
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || undefined });
for (const s of [180, 192, 512]) { const p = await b.newPage({ viewport: { width: s, height: s } }); await p.setContent(m.iconHTML(s)); await p.screenshot({ path: `public/icon-${s}.png` }); await p.close(); }
await b.close();
