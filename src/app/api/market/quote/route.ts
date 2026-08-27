import { NextResponse } from "next/server";
import { getQuotes, hasPolygon } from "@/lib/market";

/** GET /api/market/quote?symbols=AAPL,VOO → delayed quotes (key stays server-side). */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbols = (searchParams.get("symbols") ?? "").split(",").map((s) => s.trim().toUpperCase()).filter((s) => /^[A-Z.\-]{1,10}$/.test(s)).slice(0, 25);
  if (!symbols.length) return NextResponse.json({ error: "symbols required" }, { status: 400 });
  if (!hasPolygon()) return NextResponse.json({ quotes: {}, source: "none", freshness: "sample" }, { headers: { "Cache-Control": "no-store" } });
  const quotes = await getQuotes(symbols);
  return NextResponse.json({ quotes, source: "polygon", freshness: "eod" }, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } });
}
