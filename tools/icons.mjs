import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: process.env.PW_CHROME || undefined }); 
for (const s of [180, 192, 512]) {
  const p = await b.newPage({ viewport: { width: s, height: s } });
  await p.setContent(`<body style="margin:0;background:#000"><svg width="${s}" height="${s}" viewBox="0 0 100 100"><defs><radialGradient id="d" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="#26282d"/><stop offset="1" stop-color="#040405"/></radialGradient><radialGradient id="l"><stop offset="0" stop-color="#ffe7a3" stop-opacity=".55"/><stop offset="1" stop-color="#ffe7a3" stop-opacity="0"/></radialGradient><linearGradient id="m" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9aa1a9"/><stop offset=".5" stop-color="#2b2e33"/><stop offset="1" stop-color="#6d737a"/></linearGradient></defs><rect width="100" height="100" fill="#000"/><circle cx="50" cy="50" r="34" fill="url(#m)"/><circle cx="50" cy="50" r="31" fill="url(#d)"/>${Array.from({length:12},(_,i)=>`<rect x="49.3" y="22" width="1.4" height="${i%3?3.5:5.5}" fill="#8b9098" transform="rotate(${i*30} 50 50)"/>`).join("")}<circle cx="50" cy="24" r="13" fill="url(#l)"/><circle cx="50" cy="24" r="3.6" fill="#fff4c2"/></svg></body>`);
  await p.screenshot({ path: `public/icon-${s}.png` }); await p.close();
}
await b.close();
