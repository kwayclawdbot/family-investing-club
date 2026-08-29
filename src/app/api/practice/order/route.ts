import { LEARN_XP } from "@/lib/learn/schema";
import { GUARDRAIL_MESSAGE, isRlsDenied } from "@/lib/learn/server";
import { awardXp, bad, dbError, ok, priceOf, readJson, requireSession } from "@/lib/live/route-utils";

const START_BALANCE = 100000;
const round2 = (n: number) => Math.round(n * 100) / 100;

type Port = { id: string; balance: number; total_pnl: number | null; total_trades: number | null; winning_trades: number | null };
type Pos = { id: string; symbol: string; side: string; quantity: number; entry_price: number; opened_at: string };

/**
 * Practice order at the live Polygon price → FTA simulator tables.
 *   buy  → sim_positions (side 'long') + balance debit
 *   sell → close the oldest open lots (FIFO) → sim_trades rows with exit_price/pnl + balance credit
 * RLS `family_writes_allowed()` gates INSERTs for kids under guardrails; a 42501 is surfaced as a friendly message.
 */
export async function POST(req: Request) {
  const r = await requireSession();
  if (r.error) return r.error;
  const body = await readJson<{ symbol?: string; side?: "buy" | "sell"; shares?: number; thesis?: string }>(req);
  const symbol = (body.symbol ?? "").toUpperCase().replace(/[^A-Z.\-]/g, "").slice(0, 10);
  const shares = Math.floor(Number(body.shares ?? 0));
  if (!symbol) return bad("symbol required");
  if (body.side !== "buy" && body.side !== "sell") return bad("side must be buy or sell");
  if (!Number.isFinite(shares) || shares < 1 || shares > 100000) return bad("shares must be a whole number ≥ 1");
  const uid = r.session.user.id;
  try {
    const price = await priceOf(symbol);
    if (!price || price <= 0) return bad(`No live price for ${symbol} right now — try again in a moment.`, 503);

    let port = (await r.supa.from("sim_portfolios").select("id, balance, total_pnl, total_trades, winning_trades").eq("user_id", uid).maybeSingle()).data as Port | null;
    if (!port) {
      const created = await r.supa.from("sim_portfolios").insert({ user_id: uid, balance: START_BALANCE, starting_balance: START_BALANCE, total_pnl: 0, total_trades: 0, winning_trades: 0 }).select("id, balance, total_pnl, total_trades, winning_trades").single();
      if (created.error) return isRlsDenied(created.error) ? bad(GUARDRAIL_MESSAGE, 403) : dbError(created.error);
      port = created.data as Port;
    }
    const balance = Number(port.balance);
    const total = round2(price * shares);

    if (body.side === "buy") {
      if (total > balance) return bad(`Not enough virtual cash: $${total.toLocaleString()} needed, $${round2(balance).toLocaleString()} available.`);
      const pos = await r.supa.from("sim_positions").insert({ portfolio_id: port.id, symbol, side: "long", quantity: shares, entry_price: price, opened_at: new Date().toISOString() }).select("id, opened_at").single();
      if (pos.error) return isRlsDenied(pos.error) ? bad(GUARDRAIL_MESSAGE, 403) : dbError(pos.error);
      const upd = await r.supa.from("sim_portfolios").update({ balance: round2(balance - total), updated_at: new Date().toISOString() }).eq("id", port.id);
      if (upd.error) return dbError(upd.error);
      const xp = await awardXp(uid, "game", LEARN_XP.PRACTICE_ORDER, `sim:${(pos.data as { id: string }).id}`);
      return ok({ order: { id: (pos.data as { id: string }).id, symbol, side: "buy", shares, price, at: (pos.data as { opened_at: string }).opened_at, thesis: body.thesis ?? undefined, status: "filled" }, cash: round2(balance - total), xp });
    }

    // sell — FIFO over open long lots
    const lots = ((await r.supa.from("sim_positions").select("id, symbol, side, quantity, entry_price, opened_at").eq("portfolio_id", port.id).eq("symbol", symbol).eq("side", "long").order("opened_at")).data ?? []) as Pos[];
    const held = lots.reduce((a, l) => a + l.quantity, 0);
    if (held < shares) return bad(held ? `You only hold ${held} ${held === 1 ? "share" : "shares"} of ${symbol}.` : `You don't hold any ${symbol} to sell.`);
    let left = shares, pnl = 0, wins = 0, closed = 0;
    const now = new Date().toISOString();
    for (const lot of lots) {
      if (left <= 0) break;
      const q = Math.min(lot.quantity, left);
      const lotPnl = round2((price - Number(lot.entry_price)) * q);
      const t = await r.supa.from("sim_trades").insert({ portfolio_id: port.id, symbol, side: "long", quantity: q, entry_price: lot.entry_price, exit_price: price, pnl: lotPnl, opened_at: lot.opened_at, closed_at: now });
      if (t.error) return isRlsDenied(t.error) ? bad(GUARDRAIL_MESSAGE, 403) : dbError(t.error);
      if (q === lot.quantity) await r.supa.from("sim_positions").delete().eq("id", lot.id);
      else await r.supa.from("sim_positions").update({ quantity: lot.quantity - q }).eq("id", lot.id);
      pnl += lotPnl; closed += 1; if (lotPnl > 0) wins += 1; left -= q;
    }
    const proceeds = round2(total);
    const upd = await r.supa.from("sim_portfolios").update({ balance: round2(balance + proceeds), total_pnl: round2(Number(port.total_pnl ?? 0) + pnl), total_trades: (port.total_trades ?? 0) + closed, winning_trades: (port.winning_trades ?? 0) + wins, updated_at: now }).eq("id", port.id);
    if (upd.error) return dbError(upd.error);
    const xp = await awardXp(uid, "game", LEARN_XP.PRACTICE_ORDER, `sim:sell:${symbol}:${now}`);
    return ok({ order: { id: `sell-${symbol}-${Date.now()}`, symbol, side: "sell", shares, price, at: now, thesis: body.thesis ?? undefined, status: "filled" }, cash: round2(balance + proceeds), pnl: round2(pnl), xp });
  } catch (e) { return isRlsDenied(e) ? bad(GUARDRAIL_MESSAGE, 403) : dbError(e); }
}
