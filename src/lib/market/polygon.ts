/**
 * Thin Polygon.io client — server only. Never throws to callers: every function resolves to `null`
 * when the key is missing, the tier lacks the endpoint, or the request fails, so `src/lib/data.ts`
 * can fall back to fixtures. All results are labelled `freshness: "delayed"` (this tier has no
 * real-time snapshot; intraday bars lag ~15 minutes).
 */
import { etDate, etNow, lastCompletedSession, ymd, addDays, previousWeekday } from "./session";

export type Range = "1D" | "1W" | "1M" | "3M" | "YTD" | "1Y" | "5Y" | "ALL";
export type Freshness = "delayed" | "eod" | "sample";
export type Meta = { source: "polygon"; asOf: string; freshness: Freshness };

export type Bar = { t: number; o: number; h: number; l: number; c: number; v: number };
export type Aggregates = Meta & { symbol: string; range: Range; bars: Bar[]; closes: number[]; timestamps: number[] };
export type PrevClose = Meta & { symbol: string; close: number; open: number; high: number; low: number; volume: number; t: number };
export type TickerDetails = Meta & {
  symbol: string; name: string; description: string | null; marketCap: number | null; logoUrl: string | null; iconUrl: string | null;
  exchange: string | null; type: string | null; sic: string | null; employees: number | null; homepage: string | null;
};
export type Financials = Meta & { symbol: string; epsTtm: number | null; epsBasis: "ttm-quarterly" | "annual" | null; revenueTtm: number | null; netIncomeTtm: number | null; fiscalPeriod: string | null };
export type Dividends = Meta & { symbol: string; trailingCash: number; frequency: number | null; lastExDate: string | null };
export type NewsArticle = { id: string; title: string; publisher: string; publishedUtc: string; url: string; tickers: string[]; description: string; imageUrl: string | null };
export type NewsResult = Meta & { articles: NewsArticle[] };
export type SearchHit = { symbol: string; name: string; exchange: string | null; type: string | null };
export type SearchResult = Meta & { hits: SearchHit[] };

const BASE = "https://api.polygon.io";
const DAY = 24 * 3_600_000;
const TTL = { quote: 60_000, aggs: 6 * 3_600_000, grouped: DAY, details: 7 * DAY, financials: 7 * DAY, news: 30 * 60_000, search: 6 * 3_600_000 } as const;

/* ── cache + 5-requests/minute budget ───────────────────────────────────── */
/**
 * This key is on Polygon's free tier: 5 requests per minute, end-of-day data. So:
 *   - a token bucket guards every call; when the bucket is empty we serve a stale cached value if we
 *     have one, otherwise wait at most `maxWait` ms for a slot (default 8s), otherwise return null;
 *   - a 429 from Polygon (the key is shared with the FTA dashboard) empties the bucket for 60s;
 *   - grouped-daily bars (one call = every ticker's close) power all quotes, cached 24h.
 */
type Entry = { at: number; ttl: number; value: unknown };
const cache = new Map<string, Entry>();
const inflight = new Map<string, Promise<unknown>>();
const LIMIT = Number(process.env.POLYGON_RPM ?? 5);
const WINDOW = 60_000;
const stamps: number[] = [];
let blockedUntil = 0;

function prune() { const cut = Date.now() - WINDOW; while (stamps.length && stamps[0] < cut) stamps.shift(); }
function tryAcquire(): boolean {
  prune();
  if (Date.now() < blockedUntil || stamps.length >= LIMIT) return false;
  stamps.push(Date.now());
  return true;
}
async function acquire(maxWait: number): Promise<boolean> {
  const deadline = Date.now() + maxWait;
  for (;;) {
    if (tryAcquire()) return true;
    prune();
    const next = Math.max(blockedUntil, stamps.length ? stamps[0] + WINDOW : 0) - Date.now();
    if (next <= 0) continue;
    if (Date.now() + next > deadline) return false;
    await new Promise((r) => setTimeout(r, Math.min(next + 25, 2_000)));
  }
}
/** Remaining calls in the current minute — lets callers skip optional work when we're low. */
export function budgetLeft(): number { prune(); return Date.now() < blockedUntil ? 0 : Math.max(0, LIMIT - stamps.length); }

function apiKey(): string | null {
  const k = process.env.POLYGON_API_KEY?.trim().replace(/^["']|["']$/g, "");
  return k && k.length > 8 ? k : null;
}
export const hasPolygon = () => apiKey() !== null;

export type GetOpts = { maxWait?: number; allowStale?: boolean; /** never spend budget: fresh or stale cache only */ cacheOnly?: boolean };
async function get<T>(path: string, ttl: number, params: Record<string, string | number | undefined> = {}, opts: GetOpts = {}): Promise<T | null> {
  const key = apiKey();
  if (!key) return null;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") qs.set(k, String(v));
  const cacheKey = `${path}?${qs.toString()}`;
  const hit = cache.get(cacheKey);
  const now = Date.now();
  if (hit && now - hit.at < hit.ttl) return hit.value as T;
  const pending = inflight.get(cacheKey);
  if (pending) return pending as Promise<T | null>;
  const stale = opts.allowStale !== false && hit ? (hit.value as T) : null;
  if (opts.cacheOnly) return stale;
  const run = (async () => {
    const ok = stale ? tryAcquire() : await acquire(opts.maxWait ?? 8_000);
    if (!ok) return stale; // budget exhausted → stale or null (caller falls back)
    const url = `${BASE}${path}?${qs.toString()}${qs.size ? "&" : ""}apiKey=${key}`;
    try {
      const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(12_000) });
      if (res.status === 429) { blockedUntil = Date.now() + WINDOW; return stale; }
      if (!res.ok) return stale; // 403 (tier), 404 (unknown symbol)
      const json = (await res.json()) as T;
      cache.set(cacheKey, { at: Date.now(), ttl, value: json });
      return json;
    } catch {
      return stale;
    }
  })();
  inflight.set(cacheKey, run);
  try {
    return (await run) as T | null;
  } finally {
    inflight.delete(cacheKey);
  }
}

const meta = (asOf: string | number, freshness: Freshness = "eod"): Meta => ({ source: "polygon", asOf: typeof asOf === "number" ? new Date(asOf).toISOString() : asOf, freshness });
const sym = (s: string) => s.trim().toUpperCase();

/* ── endpoints ──────────────────────────────────────────────────────────── */
type AggsJson = { results?: Bar[]; resultsCount?: number };

export async function prevClose(symbol: string): Promise<PrevClose | null> {
  const j = await get<AggsJson>(`/v2/aggs/ticker/${sym(symbol)}/prev`, TTL.quote, { adjusted: "true" });
  const b = j?.results?.[0];
  if (!b) return null;
  return { ...meta(b.t), symbol: sym(symbol), close: b.c, open: b.o, high: b.h, low: b.l, volume: b.v, t: b.t };
}

/** Window + bar size per range. 1D = 5-minute bars of the last trading day; 5Y/ALL = weekly. */
function rangeSpec(range: Range): { mult: number; span: "minute" | "day" | "week"; from: string; to: string } {
  const now = etNow();
  const today = ymd(now);
  switch (range) {
    case "1D": {
      const d = lastCompletedSession(now); // free tier is end-of-day: the last full session's minute bars
      return { mult: 5, span: "minute", from: d, to: d };
    }
    case "1W": return { mult: 1, span: "day", from: ymd(addDays(now, -9)), to: today };
    case "1M": return { mult: 1, span: "day", from: ymd(addDays(now, -32)), to: today };
    case "3M": return { mult: 1, span: "day", from: ymd(addDays(now, -93)), to: today };
    case "YTD": return { mult: 1, span: "day", from: `${etDate(now).y}-01-01`, to: today };
    case "1Y": return { mult: 1, span: "day", from: ymd(addDays(now, -366)), to: today };
    case "5Y": return { mult: 1, span: "week", from: ymd(addDays(now, -5 * 366)), to: today };
    case "ALL": return { mult: 1, span: "week", from: "2000-01-01", to: today };
  }
}

export async function aggregates(symbol: string, range: Range, opts: GetOpts = {}): Promise<Aggregates | null> {
  const spec = rangeSpec(range);
  const j = await get<AggsJson>(`/v2/aggs/ticker/${sym(symbol)}/range/${spec.mult}/${spec.span}/${spec.from}/${spec.to}`, TTL.aggs, { adjusted: "true", sort: "asc", limit: 50000 }, opts);
  const bars = j?.results ?? [];
  if (!bars.length) return null;
  let trimmed = bars;
  if (range === "1W") trimmed = bars.slice(-5);
  return { ...meta(bars[bars.length - 1].t), symbol: sym(symbol), range, bars: trimmed, closes: trimmed.map((b) => b.c), timestamps: trimmed.map((b) => b.t) };
}

type GroupedJson = { resultsCount?: number; results?: { T: string; o: number; h: number; l: number; c: number; v: number; t: number }[] };
export type GroupedDay = { date: string; closes: Map<string, Bar> };
/**
 * Every US stock's daily bar for one session in ONE request (cached 24h). If the date had no session
 * (holiday), steps back a weekday (each step is a request, so at most 3).
 */
export async function groupedDaily(date: string, opts: GetOpts = {}): Promise<GroupedDay | null> {
  let d = date;
  for (let i = 0; i < 3; i++) {
    const j = await get<GroupedJson>(`/v2/aggs/grouped/locale/us/market/stocks/${d}`, TTL.grouped, { adjusted: "true" }, opts);
    if (!j) return null;
    if (j.results?.length) {
      const closes = new Map<string, Bar>();
      for (const r of j.results) closes.set(r.T, { t: r.t, o: r.o, h: r.h, l: r.l, c: r.c, v: r.v });
      return { date: d, closes };
    }
    d = previousWeekday(d);
  }
  return null;
}
/** The last two completed sessions' grouped bars: [latest, previous]. Two requests per day, total. */
export async function lastTwoSessions(opts: GetOpts = {}): Promise<[GroupedDay, GroupedDay | null] | null> {
  const latest = await groupedDaily(lastCompletedSession(), opts);
  if (!latest) return null;
  const prev = await groupedDaily(previousWeekday(latest.date), { ...opts, maxWait: Math.min(opts.maxWait ?? 8_000, 4_000) });
  return [latest, prev];
}

/** Raw daily bars for the last `days` calendar days (used by the quote logic). */
export async function dailyBars(symbol: string, days = 12): Promise<Bar[] | null> {
  const now = etNow();
  const j = await get<AggsJson>(`/v2/aggs/ticker/${sym(symbol)}/range/1/day/${ymd(addDays(now, -days))}/${ymd(now)}`, TTL.quote, { adjusted: "true", sort: "asc", limit: 100 });
  return j?.results?.length ? j.results : null;
}

/** 5-minute bars for a given ET date (YYYY-MM-DD). */
export async function intradayBars(symbol: string, date: string): Promise<Bar[] | null> {
  const j = await get<AggsJson>(`/v2/aggs/ticker/${sym(symbol)}/range/5/minute/${date}/${date}`, TTL.quote, { adjusted: "true", sort: "asc", limit: 500 });
  return j?.results?.length ? j.results : null;
}

type DetailsJson = {
  results?: {
    ticker: string; name: string; description?: string; market_cap?: number; primary_exchange?: string; type?: string; sic_description?: string;
    total_employees?: number; homepage_url?: string; branding?: { logo_url?: string; icon_url?: string };
  };
};
export async function tickerDetails(symbol: string, opts: GetOpts = {}): Promise<TickerDetails | null> {
  const j = await get<DetailsJson>(`/v3/reference/tickers/${sym(symbol)}`, TTL.details, {}, opts);
  const r = j?.results;
  if (!r) return null;
  const key = apiKey();
  const withKey = (u?: string) => (u ? `${u}${u.includes("?") ? "&" : "?"}apiKey=${key}` : null);
  return {
    ...meta(new Date().toISOString()), symbol: sym(symbol), name: r.name, description: r.description ?? null, marketCap: r.market_cap ?? null,
    logoUrl: withKey(r.branding?.logo_url), iconUrl: withKey(r.branding?.icon_url), exchange: r.primary_exchange ?? null, type: r.type ?? null,
    sic: r.sic_description ?? null, employees: r.total_employees ?? null, homepage: r.homepage_url ?? null,
  };
}

type FinJson = {
  results?: { fiscal_period?: string; fiscal_year?: string; timeframe?: string; financials?: { income_statement?: { diluted_earnings_per_share?: { value?: number }; basic_earnings_per_share?: { value?: number }; revenues?: { value?: number }; net_income_loss?: { value?: number } } } }[];
};
/** TTM diluted EPS from the last 4 quarterlies (falls back to the latest annual). */
export async function financials(symbol: string, opts: GetOpts = {}): Promise<Financials | null> {
  const q = await get<FinJson>(`/vX/reference/financials`, TTL.financials, { ticker: sym(symbol), timeframe: "quarterly", limit: 4, order: "desc", sort: "period_of_report_date" }, opts);
  const rows = q?.results ?? [];
  const eps = (r: NonNullable<FinJson["results"]>[number]) => r.financials?.income_statement?.diluted_earnings_per_share?.value ?? r.financials?.income_statement?.basic_earnings_per_share?.value;
  if (rows.length === 4 && rows.every((r) => typeof eps(r) === "number")) {
    const sum = (k: "revenues" | "net_income_loss") => rows.reduce((a, r) => a + (r.financials?.income_statement?.[k]?.value ?? 0), 0);
    return { ...meta(new Date().toISOString()), symbol: sym(symbol), epsTtm: +rows.reduce((a, r) => a + (eps(r) as number), 0).toFixed(3), epsBasis: "ttm-quarterly", revenueTtm: sum("revenues") || null, netIncomeTtm: sum("net_income_loss") || null, fiscalPeriod: `${rows[0].fiscal_period} ${rows[0].fiscal_year}` };
  }
  const a = await get<FinJson>(`/vX/reference/financials`, TTL.financials, { ticker: sym(symbol), timeframe: "annual", limit: 1 }, opts);
  const r = a?.results?.[0];
  const e = r ? eps(r) : undefined;
  if (typeof e !== "number") return null;
  return { ...meta(new Date().toISOString()), symbol: sym(symbol), epsTtm: e, epsBasis: "annual", revenueTtm: r?.financials?.income_statement?.revenues?.value ?? null, netIncomeTtm: r?.financials?.income_statement?.net_income_loss?.value ?? null, fiscalPeriod: r ? `FY ${r.fiscal_year}` : null };
}

type DivJson = { results?: { cash_amount: number; frequency?: number; ex_dividend_date?: string }[] };
/** Trailing 12-month cash dividends (sum of the last `frequency` payments). */
export async function dividends(symbol: string, opts: GetOpts = {}): Promise<Dividends | null> {
  const j = await get<DivJson>(`/v3/reference/dividends`, TTL.financials, { ticker: sym(symbol), limit: 12, order: "desc", sort: "ex_dividend_date" }, opts);
  const rows = j?.results ?? [];
  if (!rows.length) return { ...meta(new Date().toISOString()), symbol: sym(symbol), trailingCash: 0, frequency: null, lastExDate: null };
  const freq = rows[0].frequency ?? 4;
  const trailing = rows.slice(0, Math.max(1, Math.min(freq, 12))).reduce((a, r) => a + (r.cash_amount ?? 0), 0);
  return { ...meta(new Date().toISOString()), symbol: sym(symbol), trailingCash: +trailing.toFixed(4), frequency: freq, lastExDate: rows[0].ex_dividend_date ?? null };
}

type NewsJson = { results?: { id: string; title: string; publisher?: { name?: string }; published_utc: string; article_url: string; tickers?: string[]; description?: string; image_url?: string }[] };
export async function news(symbol: string | null, limit = 10, opts: GetOpts = {}): Promise<NewsResult | null> {
  const j = await get<NewsJson>(`/v2/reference/news`, TTL.news, { ticker: symbol ? sym(symbol) : undefined, limit, order: "desc", sort: "published_utc" }, opts);
  const rows = j?.results;
  if (!rows) return null;
  return {
    ...meta(new Date().toISOString()),
    articles: rows.map((r) => ({ id: r.id, title: r.title, publisher: r.publisher?.name ?? "News", publishedUtc: r.published_utc, url: r.article_url, tickers: r.tickers ?? [], description: r.description ?? "", imageUrl: r.image_url ?? null })),
  };
}

type SearchJson = { results?: { ticker: string; name: string; primary_exchange?: string; type?: string }[] };
export async function search(q: string, limit = 10, opts: GetOpts = {}): Promise<SearchResult | null> {
  const s = q.trim();
  if (!s) return { ...meta(new Date().toISOString()), hits: [] };
  const j = await get<SearchJson>(`/v3/reference/tickers`, TTL.search, { search: s, active: "true", market: "stocks", limit, sort: "ticker" }, opts);
  const rows = j?.results;
  if (!rows) return null;
  return { ...meta(new Date().toISOString()), hits: rows.map((r) => ({ symbol: r.ticker, name: r.name, exchange: r.primary_exchange ?? null, type: r.type ?? null })) };
}
