import { NextResponse } from "next/server";
import { searchCompanies } from "@/lib/data";

/** GET /api/market/search?q=apple → companies (universe + Polygon symbol search, with quotes). */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim().slice(0, 40);
  const results = await searchCompanies(q);
  return NextResponse.json({ q, results: results.map((c) => ({ symbol: c.symbol, name: c.name, price: c.price, change: c.change, changePct: c.changePct, freshness: c.freshness ?? "sample" })) }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
}
