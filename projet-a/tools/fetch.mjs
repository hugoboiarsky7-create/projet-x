// Récupère les séries quotidiennes et les embarque (JSON compact). Plusieurs sources, dans l'ordre.
import { writeFileSync, existsSync, readFileSync } from 'node:fs';
const OUT = new URL('../src/data/', import.meta.url).pathname;
const SETS = [['m', 'btc', 'bitcoin'], ['e', 'eth', 'ethereum'], ['d', 'doge', 'dogecoin'], ['x', 'xrp', 'ripple']];
const day = (s) => Math.floor(Date.parse(s + 'T00:00:00Z') / 864e5);
async function get(u) { const r = await fetch(u, { signal: AbortSignal.timeout(90000) }); if (!r.ok) throw new Error(r.status + ' ' + u); return r; }
const sources = [
  async (sym) => { // jeu de données public (CSV)
    const local = process.env.CSV_DIR && `${process.env.CSV_DIR}/${sym}.csv`;
    const txt = local && existsSync(local) ? readFileSync(local, 'utf8') : await (await get(`https://raw.githubusercontent.com/coinmetrics/data/master/csv/${sym}.csv`)).text();
    const L = txt.split('\n'); const h = L[0].split(','); const iT = h.indexOf('time'), iP = h.indexOf('PriceUSD'); const o = [];
    for (let i = 1; i < L.length; i++) { const c = L[i].split(','); if (c[iP]) o.push([day(c[iT]), +c[iP]]); }
    return o;
  },
  async (sym, id) => { const j = await (await get(`https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=max&interval=daily`)).json(); return j.prices.map(([t, p]) => [Math.floor(t / 864e5), p]); },
  async (sym) => { const j = await (await get(`https://min-api.cryptocompare.com/data/v2/histoday?fsym=${sym.toUpperCase()}&tsym=USD&allData=true`)).json(); return j.Data.Data.filter((x) => x.close > 0).map((x) => [Math.floor(x.time / 86400), x.close]); },
];
for (const [key, sym, id] of SETS) {
  let rows = null;
  for (const s of sources) { try { rows = await s(sym, id); if (rows.length > 1000) break; } catch (e) { console.log('source indisponible', String(e).slice(0, 80)); } }
  if (!rows) throw new Error('aucune source pour ' + key);
  // jours contigus : comble les trous éventuels
  const p = []; let d = rows[0][0], last = rows[0][1];
  for (const [dd, v] of rows) { while (d < dd) { p.push(last); d++; } if (dd === d) { p.push(v); last = v; d++; } }
  writeFileSync(OUT + key + '.json', JSON.stringify({ d0: rows[0][0], p: p.map((v) => +v.toPrecision(4)) }));
  console.log(key, p.length, new Date(rows[0][0] * 864e5).toISOString().slice(0, 10), '→', new Date((rows[0][0] + p.length - 1) * 864e5).toISOString().slice(0, 10));
}
