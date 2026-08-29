import { LEARN_XP } from "@/lib/learn/schema";
import { awardOnce } from "@/lib/learn/server";
import { bad, dbError, ok, readJson, requireSession } from "@/lib/live/route-utils";

type Grade = "again" | "hard" | "good" | "easy";
const GRADES: Grade[] = ["again", "hard", "good", "easy"];

/** Spaced repetition on `flashcard_reviews` (FTA columns: due_at date, interval_days, streak, last_result again|got_it). */
function schedule(prev: { interval_days: number | null; streak: number | null } | null, grade: Grade) {
  const interval = prev?.interval_days ?? 1;
  const streak = prev?.streak ?? 0;
  if (grade === "again") return { interval_days: 1, streak: 0, last_result: "again" };
  if (grade === "hard") return { interval_days: Math.max(1, Math.round(interval * 1.2)), streak: streak + 1, last_result: "got_it" };
  if (grade === "good") return { interval_days: Math.min(60, Math.max(2, interval * 2)), streak: streak + 1, last_result: "got_it" };
  return { interval_days: Math.min(90, Math.max(4, interval * 3)), streak: streak + 1, last_result: "got_it" };
}

/**
 * POST { cardId, grade } → upsert one review.
 * POST { finish: true, known, total } → close the session: XP once per day (kind 'flashcards', ref `fc:YYYY-MM-DD`).
 */
export async function POST(req: Request) {
  const r = await requireSession();
  if (r.error) return r.error;
  const body = await readJson<{ cardId?: string; grade?: Grade; finish?: boolean; known?: number; total?: number }>(req);
  const uid = r.session.user.id;
  try {
    if (body.finish) {
      const day = new Date().toISOString().slice(0, 10);
      const known = Math.max(0, Math.round(Number(body.known ?? 0)));
      const xp = known > 0 ? await awardOnce(r.supa, uid, "flashcards", LEARN_XP.FLASHCARDS, `fc:${day}`) : 0;
      return ok({ xp, day });
    }
    if (!body.cardId || !body.grade || !GRADES.includes(body.grade)) return bad("cardId and grade (again|hard|good|easy) required");
    const { data: prev } = await r.supa.from("flashcard_reviews").select("interval_days, streak").eq("user_id", uid).eq("card_id", body.cardId).maybeSingle();
    const next = schedule(prev as { interval_days: number | null; streak: number | null } | null, body.grade);
    const due = new Date(Date.now() + next.interval_days * 86400000).toISOString().slice(0, 10);
    const { error } = await r.supa.from("flashcard_reviews").upsert({ user_id: uid, card_id: body.cardId, due_at: due, interval_days: next.interval_days, streak: next.streak, last_result: next.last_result, updated_at: new Date().toISOString() }, { onConflict: "user_id,card_id" });
    if (error) return dbError(error);
    return ok({ cardId: body.cardId, dueAt: due, intervalDays: next.interval_days, streak: next.streak });
  } catch (e) { return dbError(e); }
}
