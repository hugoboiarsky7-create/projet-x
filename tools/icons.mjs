import { chromium } from 'playwright';
const b = await chromium.launch(); 
for (const s of [180, 192, 512]) {
  const p = await b.newPage({ viewport: { width: s, height: s } });
  await p.setContent(`<body style="margin:0;background:#000"><svg width="${s}" height="${s}" viewBox="0 0 100 100"><rect width="100" height="100" fill="#000"/><circle cx="50" cy="50" r="30" fill="none" stroke="#3a3a3a" stroke-width="1.2"/><circle cx="50" cy="20" r="9" fill="#ffe7a3" opacity=".18"/><circle cx="50" cy="20" r="4.2" fill="#fff4c2"/></svg></body>`);
  await p.screenshot({ path: `public/icon-${s}.png` }); await p.close();
}
await b.close();
