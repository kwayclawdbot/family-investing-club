/**
 * End-of-day quote from Polygon's grouped-daily bars: price = last completed session's close, change vs
 * the session before. Two cached requests per day cover every symbol — essential on a 5-requests/minute key.
 * `freshness: "eod"` (this tier has no intraday for the current session).
 */
import { lastTwoSessions, type Freshness, type GetOpts } from "./polygon";
import { sessionState } from "./session";

export type Quote = { symbol: string; price: number; change: number; changePct: number; asOf: string; freshness: Freshness; prevClose: number; volume: number | null; session: "pre" | "open" | "post" | "closed-weekend" };

export async function getQuotes(symbols: string[], opts: GetOpts = {}): Promise<Record<string, Quote | null>> {
  const out: Record<string, Quote | null> = {};
  const list = [...new Set(symbols.map((x) => x.trim().toUpperCase()))];
  const sessions = await lastTwoSessions(opts);
  for (const s of list) {
    if (!sessions) { out[s] = null; continue; }
    const [latest, prev] = sessions;
    const bar = latest.closes.get(s);
    if (!bar) { out[s] = null; continue; }
    const prevClose = prev?.closes.get(s)?.c ?? bar.o;
    const change = +(bar.c - prevClose).toFixed(2);
    out[s] = { symbol: s, price: +bar.c.toFixed(2), change, changePct: prevClose ? +((change / prevClose) * 100).toFixed(2) : 0, asOf: `${latest.date}T21:00:00Z`, freshness: "eod", prevClose, volume: bar.v, session: sessionState() };
  }
  return out;
}
export async function getQuote(symbol: string, opts: GetOpts = {}): Promise<Quote | null> {
  return (await getQuotes([symbol], opts))[symbol.trim().toUpperCase()] ?? null;
}
