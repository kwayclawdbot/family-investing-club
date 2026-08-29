import { NextResponse } from "next/server";
import * as pg from "@/lib/market/polygon";

export const runtime = "nodejs";

/**
 * Company logo proxy.
 *
 * Polygon's branding URLs only resolve with the API key appended, so they can never be handed to a
 * browser. This route resolves the (week-cached) ticker details server-side, streams the image back,
 * and lets the CDN keep it for a day. A miss returns 404 on purpose: the caller's brand-coloured
 * ticker square shows through, which is the designed fallback.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await ctx.params;
  if (!/^[A-Za-z.\-]{1,8}$/.test(symbol)) return new NextResponse(null, { status: 400 });
  const d = await pg.tickerDetails(symbol.toUpperCase(), { maxWait: 1_500 });
  const src = d?.iconUrl ?? d?.logoUrl;
  if (!src) return new NextResponse(null, { status: 404 });
  const r = await fetch(src, { cache: "no-store" }).catch(() => null);
  if (!r?.ok) return new NextResponse(null, { status: 404 });
  const type = r.headers.get("content-type") ?? "image/png";
  if (!type.startsWith("image/")) return new NextResponse(null, { status: 404 });
  return new NextResponse(r.body, {
    headers: { "content-type": type, "cache-control": "public, max-age=86400, stale-while-revalidate=604800" },
  });
}
