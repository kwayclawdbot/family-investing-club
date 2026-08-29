import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/live/admin-crm";
import { bad, readJson } from "@/lib/live/route-utils";
import { parseViewAs, VIEW_AS_COOKIE, VIEW_AS_MAX_AGE } from "@/components/admin/view-as";

/**
 * POST /api/admin/view-as { view: 'parent'|'fta'|'teen'|'kid'|'free'|null } — set / clear the register preview cookie.
 * Write gate = requireAdmin(); the READ gate (`resolveViewAs`) is independent, so a forged cookie on a
 * member's browser does nothing. Touches no rows.
 */
export async function POST(req: Request) {
  const r = await requireAdmin(); if (r.error) return r.error;
  const { view } = await readJson<{ view?: unknown }>(req);
  const opts = { path: "/", httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production" };
  if (view === null || view === undefined || view === "" || view === "off") {
    const res = NextResponse.json({ ok: true, view: null });
    res.cookies.set(VIEW_AS_COOKIE, "", { ...opts, maxAge: 0 });
    return res;
  }
  const v = parseViewAs(view);
  if (!v) return bad("Unknown register");
  const res = NextResponse.json({ ok: true, view: v });
  res.cookies.set(VIEW_AS_COOKIE, v, { ...opts, maxAge: VIEW_AS_MAX_AGE });
  return res;
}
