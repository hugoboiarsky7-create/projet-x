import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || undefined });
for (const s of [180, 192, 512]) { const p = await b.newPage({ viewport: { width: s, height: s } });
  await p.setContent(`<body style="margin:0;background:#000"><svg width="${s}" height="${s}" viewBox="0 0 100 100"><defs><filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5"/></filter></defs><rect width="100" height="100" fill="#000"/><path d="M30 64L70 36" stroke="#ff3ea5" stroke-width="9" stroke-linecap="round" filter="url(#b)" opacity=".9"/><path d="M30 64L70 36" stroke="#ff3ea5" stroke-width="6" stroke-linecap="round"/><path d="M30 64L70 36" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg></body>`);
  await p.screenshot({ path: `public/icon-${s}.png` }); await p.close(); }
await b.close();
