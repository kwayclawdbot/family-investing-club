import { bad, dbError, ok, readJson, requireSession } from "@/lib/live/route-utils";
export async function POST(req: Request) {
  const r = await requireSession(); if (r.error) return r.error;
  const b = await readJson<{ provider?: string; accountLabel?: string; sharing?: string; publicBadge?: boolean }>(req);
  const provider = (b.provider ?? "").trim().toLowerCase();
  if (!/^[a-z0-9-]{2,30}$/.test(provider)) return bad("Choose a brokerage");
  const sharing = ["private", "positions", "allocation", "full"].includes(b.sharing ?? "") ? b.sharing : "private";
  const { error } = await r.supa.from("fic_brokerage_links").upsert({ user_id: r.session.user.id, provider, account_label: (b.accountLabel ?? "").slice(0, 40) || null, sharing, public_badge: !!b.publicBadge, synced_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) return dbError(error);
  return ok();
}
export async function DELETE() {
  const r = await requireSession(); if (r.error) return r.error;
  const { error } = await r.supa.from("fic_brokerage_links").delete().eq("user_id", r.session.user.id);
  if (error) return dbError(error);
  return ok();
}
