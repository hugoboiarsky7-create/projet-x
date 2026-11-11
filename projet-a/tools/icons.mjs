import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || undefined });
for (const s of [180, 192, 512]) {
  const p = await b.newPage({ viewport: { width: s, height: s } });
  await p.setContent(`<body style="margin:0"><svg width="${s}" height="${s}" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6c78aa"/><stop offset=".62" stop-color="#e2aaaa"/><stop offset="1" stop-color="#ffd6aa"/></linearGradient></defs><rect width="100" height="100" fill="url(#g)"/><rect y="62" width="100" height="38" fill="#3a3c60"/><circle cx="50" cy="54.5" r="7.5" fill="#fff"/></svg></body>`);
  await p.screenshot({ path: `public/icon-${s}.png` }); await p.close();
}
await b.close();
