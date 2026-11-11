// Bougies récentes : source principale, puis replis. Hors ligne : on garde ce qu'on a.
import type { Extra } from './world';
type Row = [number, number]; // [ms d'ouverture, clôture]
async function j(url: string, init?: RequestInit) { const c = new AbortController(); const t = setTimeout(() => c.abort(), 9000); try { const r = await fetch(url, { ...init, signal: c.signal }); if (!r.ok) throw new Error('' + r.status); return await r.json(); } finally { clearTimeout(t); } }
async function candles(iv: '1d' | '1h', from: number): Promise<Row[]> {
  const now = Date.now(); const srcs: (() => Promise<Row[]>)[] = [
    async () => (await j('https://api.hyperliquid.xyz/info', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'candleSnapshot', req: { coin: 'BTC', interval: iv, startTime: from, endTime: now } }) })).map((k: { t: number; c: string }) => [k.t, +k.c] as Row),
    async () => { const out: Row[] = []; let s = from; for (let n = 0; n < 6 && s < now; n++) { const a = await j(`https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${iv}&startTime=${s}&limit=1000`); if (!a.length) break; for (const k of a) out.push([k[0], +k[4]]); s = a[a.length - 1][0] + 1; if (a.length < 1000) break; } return out; },
    async () => { const g = iv === '1d' ? 86400 : 3600, out: Row[] = []; let s = from; for (let n = 0; n < 12 && s < now; n++) { const e = Math.min(now, s + g * 1000 * 290); const a = await j(`https://api.exchange.coinbase.com/products/BTC-USD/candles?granularity=${g}&start=${new Date(s).toISOString()}&end=${new Date(e).toISOString()}`); for (const k of a.reverse()) out.push([k[0] * 1000, +k[4]]); s = e + 1; } return out; },
  ];
  for (const s of srcs) { try { const r = (await s()).filter((x) => x[1] > 0 && isFinite(x[1])).sort((a, b) => a[0] - b[0]); if (r.length) return r; } catch { /* suivante */ } }
  return [];
}
const today = () => Math.floor(Date.now() / 864e5);
// clôtures quotidiennes complètes à partir du jour (époque) donné, sans trou
export async function daily(fromDay: number, lastClose: number): Promise<number[]> {
  if (fromDay >= today()) return [];
  const rows = await candles('1d', fromDay * 864e5); const m = new Map<number, number>(); for (const [t, c] of rows) m.set(Math.floor(t / 864e5), c);
  const out: number[] = []; let last = lastClose; if (!m.size) return [];
  for (let d = fromDay; d < today(); d++) { const c = m.get(d); if (c) last = c; out.push(+last.toPrecision(5)); }
  return out;
}
export async function hourly(fromDay: number): Promise<Extra[]> {
  if (fromDay >= today()) return [];
  const rows = await candles('1h', fromDay * 864e5); const by = new Map<number, number[]>();
  for (const [t, c] of rows) { const d = Math.floor(t / 864e5); if (d < fromDay || d >= today()) continue; (by.get(d) || by.set(d, []).get(d)!).push(+c.toPrecision(5)); }
  return [...by.entries()].filter(([, c]) => c.length >= 20).sort((a, b) => a[0] - b[0]).map(([day, c]) => ({ day, c }));
}
