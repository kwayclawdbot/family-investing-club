/**
 * Market façade used by `src/lib/data.ts`. Everything here returns `null` when Polygon is unavailable
 * so the data seam can fall back to fixtures. Server only.
 */
import type { Company, Metric, NewsItem } from "@/lib/types";
import * as pg from "./polygon";
import { getQuote, getQuotes, type Quote } from "./quote";
import { UNIVERSE, universeEntry, defaultUnderstand } from "./universe";
import { etNow, ymd, addDays } from "./session";

export { hasPolygon, budgetLeft } from "./polygon";
export { getQuote, getQuotes, type Quote } from "./quote";
export type { Range } from "./polygon";
export { UNIVERSE } from "./universe";


/** Closes for one range (chart series). */
export async function series(symbol: string, range: pg.Range): Promise<number[] | null> {
  const a = await pg.aggregates(symbol, range);
  return a?.closes ?? null;
}
export async function seriesWithTimestamps(symbol: string, range: pg.Range) {
  const a = await pg.aggregates(symbol, range);
  return a ? { closes: a.closes, timestamps: a.timestamps, asOf: a.asOf, freshness: a.freshness } : null;
}

/** Full company (quote + every chart range + about/logo). 3 aggregate calls + details, all cached. */
export async function company(symbol: string): Promise<Company | null> {
  const s = symbol.toUpperCase();
  // Budget order on a 5/min key: quote (grouped, usually cached) → 1Y closes → details → 1D → 5Y (the last two skip when low).
  const q = await getQuote(s, { maxWait: 12_000 });
  if (!q) return null;
  const oneYear = await pg.aggregates(s, "1Y", { maxWait: 10_000 });
  const details = await pg.tickerDetails(s, { maxWait: 4_000 });
  const [oneDay, fiveYear] = await Promise.all([
    pg.budgetLeft() > 0 ? pg.aggregates(s, "1D", { maxWait: 1_000 }) : Promise.resolve(null),
    pg.budgetLeft() > 1 ? pg.aggregates(s, "5Y", { maxWait: 1_000 }) : Promise.resolve(null),
  ]);
  const u = universeEntry(s);
  const name = u?.name ?? details?.name ?? s;
  const year = oneYear?.bars ?? [];
  const now = etNow();
  const since = (days: number) => { const from = addDays(now, -days).getTime(); return year.filter((b) => b.t >= from).map((b) => b.c); };
  const ytdFrom = Date.UTC(now.getUTCFullYear(), 0, 1);
  const seriesMap: Record<string, number[]> = {
    "1D": oneDay?.closes ?? [],
    "1W": since(9).slice(-5),
    "1M": since(32),
    "3M": since(93),
    "YTD": year.filter((b) => b.t >= ytdFrom).map((b) => b.c),
    "1Y": year.map((b) => b.c),
    "5Y": fiveYear?.closes ?? [],
  };
  for (const k of Object.keys(seriesMap)) if (seriesMap[k].length < 2) seriesMap[k] = [q.prevClose, q.price];
  return {
    symbol: s, name, price: q.price, change: q.change, changePct: q.changePct, series: seriesMap,
    understand: u?.understand ?? defaultUnderstand(name),
    about: details?.description ?? undefined, logoUrl: details?.iconUrl ?? details?.logoUrl ?? undefined, marketCap: details?.marketCap ?? undefined,
    asOf: q.asOf, freshness: q.freshness,
  };
}

/** Quote-only companies for lists: ONE grouped-daily pair covers every symbol; sparkline = [prev close, close]
 *  plus any 1Y closes already cached for that symbol (never spends budget on sparklines). */
export async function companies(symbols: string[] = UNIVERSE.map((u) => u.symbol)): Promise<Company[] | null> {
  const quotes = await getQuotes(symbols, { maxWait: 12_000 });
  if (Object.values(quotes).every((q) => q === null)) return null;
  const out: Company[] = [];
  for (const s of symbols) {
    const q = quotes[s.toUpperCase()];
    if (!q) continue;
    const u = universeEntry(s);
    const cached = await pg.aggregates(s, "1Y", { cacheOnly: true });
    const closes = cached?.closes.slice(-22) ?? [q.prevClose, q.price];
    out.push({ symbol: s.toUpperCase(), name: u?.name ?? s.toUpperCase(), price: q.price, change: q.change, changePct: q.changePct, series: { "1M": closes.length > 1 ? closes : [q.prevClose, q.price], "1D": [q.prevClose, q.price] }, understand: u?.understand ?? defaultUnderstand(u?.name ?? s), asOf: q.asOf, freshness: q.freshness });
  }
  return out;
}

export async function searchSymbols(q: string): Promise<{ symbol: string; name: string }[] | null> {
  const r = await pg.search(q, 10, { maxWait: 6_000 });
  return r ? r.hits.map((h) => ({ symbol: h.symbol, name: h.name })) : null;
}

const fmtCap = (n: number) => (n >= 1e12 ? `$${(n / 1e12).toFixed(1)}T` : n >= 1e9 ? `$${(n / 1e9).toFixed(0)}B` : n >= 1e6 ? `$${(n / 1e6).toFixed(0)}M` : `$${n.toFixed(0)}`);
const fmtVol = (n: number) => (n >= 1e9 ? `${(n / 1e9).toFixed(1)}B` : n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(0)}K` : `${n.toFixed(0)}`);

/** Live key metrics with the same plain-language definitions/lesson links as the fixture. */
export async function metrics(symbol: string, definitions: Metric[]): Promise<Metric[] | null> {
  const s = symbol.toUpperCase();
  const q = await getQuote(s, { maxWait: 12_000 });
  if (!q) return null;
  // Budget-aware: each of these is cached for a week once it lands; when the minute is spent they return null → "—".
  const year = await pg.aggregates(s, "1Y", { maxWait: 6_000 });
  const details = await pg.tickerDetails(s, { maxWait: 4_000 });
  const fin = pg.budgetLeft() > 0 ? await pg.financials(s, { maxWait: 2_000 }) : null;
  const div = pg.budgetLeft() > 0 ? await pg.dividends(s, { maxWait: 2_000 }) : null;
  const def = (key: string) => definitions.find((m) => m.key === key);
  const lows = year?.bars.map((b) => b.l) ?? []; const highs = year?.bars.map((b) => b.h) ?? [];
  const money0 = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  const isEtf = universeEntry(s)?.kind === "etf" || details?.type === "ETF";
  const rows: Metric[] = [];
  const push = (key: string, label: string, value: string | null, fallbackDef: string, lesson: string) => {
    const d = def(key);
    rows.push({ key, label, value: value ?? "—", definition: d?.definition ?? fallbackDef, lessonHref: d?.lessonHref ?? lesson });
  };
  push("mcap", isEtf ? "Fund size" : "Market cap", details?.marketCap ? fmtCap(details.marketCap) : null, "What the whole company is worth at today's price: share price × number of shares.", "/learn/path/stock-market-101");
  const pe = fin?.epsTtm && fin.epsTtm > 0 ? (q.price / fin.epsTtm).toFixed(1) : isEtf ? "n/a (fund)" : fin ? "n/a (loss)" : null;
  push("pe", "P/E ratio", pe, "Price divided by earnings per share — how many years of profit you're paying for.", "/learn/path/company-analysis");
  const dy = div ? `${((div.trailingCash / q.price) * 100).toFixed(1)}%` : null;
  push("div", "Dividend yield", dy, "Yearly dividend as a percent of the price — the 'cash rent' the stock pays you.", "/learn/path/investing-foundations");
  push("range", "52-week range", lows.length ? `${money0(Math.min(...lows))} – ${money0(Math.max(...highs))}` : null, "The lowest and highest price in the last year — a feel for how much it swings.", "/learn/path/stock-market-101");
  push("vol", "Volume", q.volume ? fmtVol(q.volume) : null, "How many shares changed hands today. High volume = lots of interest.", "/learn/path/stock-market-101");
  return rows;
}

/* ── news ─────────────────────────────────────────────────────────────── */
const b64u = (s: string) => (typeof Buffer !== "undefined" ? Buffer.from(s, "utf8").toString("base64") : btoa(unescape(encodeURIComponent(s)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64u = (s: string) => { const b = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4); return typeof Buffer !== "undefined" ? Buffer.from(b, "base64").toString("utf8") : decodeURIComponent(escape(atob(b))); };
export const newsId = (url: string) => b64u(url);
export const newsUrl = (id: string) => { try { return unb64u(id); } catch { return null; } };
export function ago(iso: string): string {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "1d ago" : `${d}d ago`;
}
/** Honest one-line framing keyed by the tickers in the story — a template, not fake analysis. */
export function whyTemplate(tickers: string[]): string {
  const names = tickers.slice(0, 2).map((t) => universeEntry(t)?.name ?? t);
  const who = names.length ? names.join(" and ") : "the companies here";
  return `News moves prices when it changes what investors expect a company to earn. Ask: does this change how ${who} make money, or just today's mood?`;
}
const newsCache = new Map<string, NewsItem>();
export async function newsFor(symbols: string[], perSymbol = 4): Promise<NewsItem[] | null> {
  // One request per symbol, sequential and budget-aware (news is cached 30 min).
  const results: (pg.NewsResult | null)[] = [];
  for (const s of [...new Set(symbols.map((x) => x.toUpperCase()))]) results.push(await pg.news(s, perSymbol, { maxWait: results.length ? 1_500 : 8_000 }));
  if (results.every((r) => r === null)) return null;
  const seen = new Set<string>();
  const items: NewsItem[] = [];
  for (const r of results) for (const a of r?.articles ?? []) {
    if (seen.has(a.url)) continue;
    seen.add(a.url);
    const item: NewsItem = { id: newsId(a.url), headline: a.title, source: a.publisher, ago: ago(a.publishedUtc), symbols: a.tickers.slice(0, 4), whyItMatters: whyTemplate(a.tickers), concepts: ["Expectations"], body: a.description || "Open the full story at the source for details.", url: a.url, publishedAt: a.publishedUtc, imageUrl: a.imageUrl ?? undefined };
    newsCache.set(item.id, item);
    items.push(item);
  }
  items.sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
  return items;
}
export async function newsItem(id: string): Promise<NewsItem | null> {
  const hit = newsCache.get(id);
  if (hit) return hit;
  const url = newsUrl(id);
  if (!url) return null;
  const r = await pg.news(null, 50, { maxWait: 8_000 });
  const a = r?.articles.find((x) => x.url === url);
  if (!a) return null;
  const item: NewsItem = { id, headline: a.title, source: a.publisher, ago: ago(a.publishedUtc), symbols: a.tickers.slice(0, 4), whyItMatters: whyTemplate(a.tickers), concepts: ["Expectations"], body: a.description || "Open the full story at the source for details.", url: a.url, publishedAt: a.publishedUtc, imageUrl: a.imageUrl ?? undefined };
  newsCache.set(id, item);
  return item;
}

export async function logo(symbol: string): Promise<string | null> {
  const d = await pg.tickerDetails(symbol);
  return d?.iconUrl ?? d?.logoUrl ?? null;
}

/** % return from a pick's price to the live price. */
export async function sincePick(symbol: string, priceAtPick: number): Promise<{ pct: number; price: number; asOf: string } | null> {
  const q = await getQuote(symbol, { maxWait: 6_000 });
  if (!q || !priceAtPick) return null;
  return { pct: +(((q.price - priceAtPick) / priceAtPick) * 100).toFixed(2), price: q.price, asOf: q.asOf };
}

export const todayYmd = () => ymd(etNow());
export type { Quote as LiveQuote };
