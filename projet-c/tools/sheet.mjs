// Planche de toutes les tuiles (pour relecture, et pour l'accrocher dans une cuisine).
import { chromium } from 'playwright';
import { build } from 'vite';
import { writeFileSync, mkdirSync } from 'node:fs';
mkdirSync('shots', { recursive: true });
const r = await build({ configFile: false, logLevel: 'silent', build: { write: false, lib: { entry: 'src/sheet.ts', formats: ['es'], fileName: 'sheet' } } });
const code = r[0].output[0].code; writeFileSync('shots/sheet.mjs', code); const m = await import(new URL('../shots/sheet.mjs', import.meta.url).href + '?' + Date.now());
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || undefined }); const p = await b.newPage({ viewport: { width: 1180, height: 900 }, deviceScaleFactor: 1 });
await p.setContent(m.sheetHTML()); await p.screenshot({ path: 'shots/planche.png', fullPage: true }); await b.close(); console.log('ok');
