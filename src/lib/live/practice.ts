import "server-only";
import type { Order, Portfolio } from "@/lib/types";
import { portfolio as fxPortfolio } from "@/lib/fixtures";
import { getSession } from "./session";
import { quotesSafe } from "./market-bridge";
import { must, safe, userClient } from "./supa";

type Port = { id: string; balance: number; starting_balance: number; total_pnl: number | null };
type Pos = { symbol: string; side: string; quantity: number; entry_price: number; opened_at: string };
type Trade = { id: string; symbol: string; side: string; quantity: number; entry_price: number; exit_price: number | null; pnl: number | null; opened_at: string; closed_at: string | null };

export async function getPortfolio(): Promise<Portfolio | null> {
  const s = await getSession();
  if (!s) return null;
  return safe("practice.getPortfolio", async () => {
    const supa = await userClient();
    const port = must(await supa.from("sim_portfolios").select("id, balance, starting_balance, total_pnl").eq("user_id", s.user.id).maybeSingle()) as Port | null;
    if (!port) return null;
    const positions = must(await supa.from("sim_positions").select("symbol, side, quantity, entry_price, opened_at").eq("portfolio_id", port.id)) as Pos[];
    const quotes = await quotesSafe(positions.map((p) => p.symbol));
    const holdings = positions.map((p) => {
      const price = quotes[p.symbol]?.price ?? Number(p.entry_price);
      return { symbol: p.symbol, name: p.symbol, shares: p.quantity, value: +(price * p.quantity).toFixed(2), changePct: +(((price - Number(p.entry_price)) / Number(p.entry_price)) * 100).toFixed(2) };
    });
    const invested = holdings.reduce((a, h) => a + h.value, 0);
    const totalValue = +(Number(port.balance) + invested).toFixed(2);
    const start = Number(port.starting_balance) || totalValue;
    const top = holdings.sort((a, b) => b.value - a.value)[0];
    const concentration = top && totalValue > 0 ? Math.round((top.value / totalValue) * 100) : 0;
    return {
      cash: Number(port.balance), totalValue,
      dayChange: +(totalValue - start).toFixed(2), dayChangePct: start ? +(((totalValue - start) / start) * 100).toFixed(2) : 0,
      holdings, series: fxPortfolio.series,
      insight: concentration >= 30 ? { text: `${concentration}% of your portfolio is one stock.`, lessonTitle: "Diversification", lessonMinutes: 6, lessonHref: "/learn/path/build-a-portfolio" } : fxPortfolio.insight,
    };
  });
}

export async function getOrders(): Promise<Order[] | null> {
  const s = await getSession();
  if (!s) return null;
  return safe("practice.getOrders", async () => {
    const supa = await userClient();
    const port = must(await supa.from("sim_portfolios").select("id").eq("user_id", s.user.id).maybeSingle()) as { id: string } | null;
    if (!port) return null;
    const trades = must(await supa.from("sim_trades").select("*").eq("portfolio_id", port.id).order("opened_at", { ascending: false }).limit(50)) as Trade[];
    return trades.map((t) => ({ id: t.id, symbol: t.symbol, side: (t.side ?? "buy").toLowerCase().startsWith("s") ? "sell" : "buy", shares: t.quantity, price: Number(t.entry_price), at: t.opened_at, status: "filled" as const }));
  });
}
