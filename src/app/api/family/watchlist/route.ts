import { bad, dbError, ok, readJson, requireSession } from "@/lib/live/route-utils";

const SYMBOL = /^[A-Z][A-Z0-9.\-]{0,9}$/;

/**
 * Family research list on FTA `family_watchlist` (RLS: any household member reads/adds/updates/deletes).
 *   POST   { symbol, companyName?, why?, howTheyMakeMoney?, whatTheySell?, strength?, risk? } — add or update the family's card
 *   DELETE { id }
 * Status stays 'watch' | 'study' here; the favorite/avoid verdicts need the full research card (DB check).
 */
export async function POST(req: Request) {
  const r = await requireSession(); if (r.error) return r.error;
  const fam = r.session.profile?.family_id;
  if (!fam) return bad("Create your family first", 409);
  const b = await readJson<{ symbol?: string; companyName?: string; why?: string; howTheyMakeMoney?: string; whatTheySell?: string; strength?: string; risk?: string; status?: string }>(req);
  const symbol = (b.symbol ?? "").trim().toUpperCase();
  if (!SYMBOL.test(symbol)) return bad("Enter a ticker like AAPL");
  const text = (v: unknown, max = 400) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);
  const status = b.status === "study" ? "study" : "watch";

  const { data: existing } = await r.supa.from("family_watchlist").select("id, champion_id").eq("family_id", fam).eq("ticker", symbol).maybeSingle();
  const patch: Record<string, unknown> = { status, wl_active: true, updated_at: new Date().toISOString() };
  if (text(b.companyName, 120)) patch.company_name = text(b.companyName, 120);
  if (b.why !== undefined) patch.why_we_picked = text(b.why);
  if (b.howTheyMakeMoney !== undefined) patch.how_they_make_money = text(b.howTheyMakeMoney);
  if (b.whatTheySell !== undefined) patch.what_they_sell = text(b.whatTheySell);
  if (b.strength !== undefined) patch.strength = text(b.strength);
  if (b.risk !== undefined) patch.risk = text(b.risk);

  if (existing) {
    const { error } = await r.supa.from("family_watchlist").update(patch).eq("id", existing.id);
    if (error) return dbError(error);
    return ok({ id: existing.id, updated: true });
  }
  const { data, error } = await r.supa.from("family_watchlist").insert({ family_id: fam, ticker: symbol, company_name: text(b.companyName, 120) ?? symbol, champion_id: r.session.user.id, ...patch }).select("id").single();
  if (error) return dbError(error);
  return ok({ id: data.id, updated: false });
}

export async function DELETE(req: Request) {
  const r = await requireSession(); if (r.error) return r.error;
  const fam = r.session.profile?.family_id;
  if (!fam) return bad("Create your family first", 409);
  const b = await readJson<{ id?: string }>(req);
  if (!b.id) return bad("Which company?");
  // Kids may add; only a parent or the member who added it may remove.
  const { data: row } = await r.supa.from("family_watchlist").select("id, champion_id").eq("id", b.id).eq("family_id", fam).maybeSingle();
  if (!row) return bad("Not on the list", 404);
  const isParent = r.session.profile?.role === "parent" || r.session.profile?.role === "admin";
  if (!isParent && row.champion_id !== r.session.user.id) return bad("Only a parent can remove someone else's company", 403);
  const { error } = await r.supa.from("family_watchlist").delete().eq("id", b.id);
  if (error) return dbError(error);
  return ok();
}
