import { awardXp, bad, dbError, ok, readJson, requireClub, xpFor } from "@/lib/live/route-utils";
export async function POST(req: Request) {
  const r = await requireClub(); if (r.error) return r.error;
  const b = await readJson<{ kind?: string; symbol?: string; companyName?: string; fromWeightPct?: number; toWeightPct?: number; rationale?: string; evidence?: { label: string; href: string }[]; windowDays?: number }>(req);
  if (!["add", "remove", "resize"].includes(b.kind ?? "")) return bad("Choose Add, Remove or Resize");
  const symbol = (b.symbol ?? "").toUpperCase().trim();
  if (!/^[A-Z.]{1,8}$/.test(symbol)) return bad("Pick a holding first");
  const from = Number(b.fromWeightPct ?? 0), to = Number(b.toWeightPct);
  const max = Number(r.ctx.club.rules?.maxWeightPct ?? 10);
  if (!(to >= 0 && to <= max)) return bad(`Weight must be 0–${max}% (club rule)`);
  if (b.kind !== "remove" && to === from) return bad("Change the weight first");
  const rationale = (b.rationale ?? "").trim();
  if (rationale.length < 10) return bad("Explain why (at least 10 characters)");
  const windowDays = [3, 7, 14].includes(Number(b.windowDays)) ? Number(b.windowDays) : 7;
  const evidence = Array.isArray(b.evidence) ? b.evidence.filter((e) => e && typeof e.label === "string" && typeof e.href === "string").slice(0, 6) : [];
  const { data, error } = await r.supa.from("fic_club_proposals").insert({
    club_id: r.ctx.club.id, author_id: r.session.user.id, kind: b.kind, symbol, company_name: b.companyName ?? null,
    from_weight_pct: from, to_weight_pct: b.kind === "remove" ? 0 : to, rationale, evidence, window_days: windowDays,
    closes_at: new Date(Date.now() + windowDays * 86400000).toISOString(),
  }).select("id").single();
  if (error) return dbError(error);
  await awardXp(r.session.user.id, "proposal", xpFor("proposal")!, (data as { id: string }).id);
  return ok({ id: (data as { id: string }).id });
}
