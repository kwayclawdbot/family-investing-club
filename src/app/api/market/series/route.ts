import { NextResponse } from "next/server";
import { getSeries } from "@/lib/data";
import type { Range } from "@/lib/market";

const RANGES = new Set(["1D", "1W", "1M", "3M", "YTD", "1Y", "5Y", "ALL"]);

/** GET /api/market/series?symbol=AAPL&range=1M → { closes, freshness } (fixture series when offline). */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = (searchParams.get("symbol") ?? "").trim().toUpperCase();
  const range = (searchParams.get("range") ?? "1M").toUpperCase();
  if (!/^[A-Z.\-]{1,10}$/.test(symbol)) return NextResponse.json({ error: "symbol required" }, { status: 400 });
  if (!RANGES.has(range)) return NextResponse.json({ error: "bad range" }, { status: 400 });
  const data = await getSeries(symbol, range as Range);
  return NextResponse.json({ symbol, range, ...data }, { headers: { "Cache-Control": data.freshness !== "sample" ? "public, s-maxage=600, stale-while-revalidate=3600" : "no-store" } });
}
