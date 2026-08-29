import { bad, dbError, ok, readJson, requireSession } from "@/lib/live/route-utils";
import { yearWeek } from "@/lib/live/family";

/**
 * POST /api/family/note — a parent's note on a learner's week (FTA `report_notes`, unique child/week).
 * Body: { childId, note, week? }. The table's write policies are open to any authenticated user, so
 * household ownership is checked here (the same way FTA's /api/report-card did).
 */
export async function POST(req: Request) {
  const r = await requireSession(); if (r.error) return r.error;
  const p = r.session.profile;
  if (!p?.family_id) return bad("Create your family first", 409);
  if (p.role !== "parent" && p.role !== "admin") return bad("Only a parent can write a report note", 403);
  const b = await readJson<{ childId?: string; note?: string; week?: number }>(req);
  const note = (b.note ?? "").trim();
  if (!b.childId) return bad("Which learner?");
  if (note.length < 2 || note.length > 1000) return bad("Notes are 2–1000 characters");
  const week = Number.isInteger(b.week) && (b.week as number) > 0 ? (b.week as number) : yearWeek();
  const { data: child } = await r.supa.from("profiles").select("id, family_id").eq("id", b.childId).maybeSingle();
  if (!child || child.family_id !== p.family_id) return bad("That learner isn't in your household", 404);
  const { error } = await r.supa.from("report_notes").upsert({ child_id: b.childId, week, note }, { onConflict: "child_id,week" });
  if (error) return dbError(error);
  return ok({ week });
}
