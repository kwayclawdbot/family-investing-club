import { LEARN_XP, QUIZ_PASS_PCT } from "@/lib/learn/schema";
import { awardOnce } from "@/lib/learn/server";
import { bad, dbError, ok, readJson, requireSession } from "@/lib/live/route-utils";

type Answer = { question: string; selected: number | null; correct_index: number | null; is_correct: boolean };

/**
 * Graded result → quiz_attempts (FTA shape: score 0–100, passed, answers[]) + quiz XP once per quiz,
 * + a perfect-score bonus. The server re-grades against `quizzes.questions` when the client sends
 * raw selections, so a score can't be forged from the browser.
 */
export async function POST(req: Request) {
  const r = await requireSession();
  if (r.error) return r.error;
  const body = await readJson<{ quizId?: string; selections?: (number | null)[]; engine?: { score: number; correct: number; total: number } }>(req);
  if (!body.quizId) return bad("quizId required");
  const uid = r.session.user.id;
  try {
    const { data: quiz } = await r.supa.from("quizzes").select("id, questions, passing_score").eq("id", body.quizId).maybeSingle();
    if (!quiz) return bad("Quiz not found", 404);
    const q = quiz as { id: string; questions: { question: string; options: string[]; correctIndex: number }[] | null; passing_score: number | null };
    const passPct = q.passing_score ?? QUIZ_PASS_PCT;
    let score: number, answers: unknown[], correct: number, total: number;
    if (body.engine && typeof body.engine.total === "number") {
      // Stepped lessons: the engine's first-try tally (same intent as FTA's `recordQuizAttempt`).
      total = Math.max(0, Math.round(body.engine.total)); correct = Math.max(0, Math.min(total, Math.round(body.engine.correct)));
      score = total ? Math.round((correct / total) * 100) : 100;
      answers = [{ engine: true, score, correct, total }];
    } else {
      const qs = Array.isArray(q.questions) ? q.questions : [];
      if (!qs.length) return bad("Quiz has no questions");
      const sel = Array.isArray(body.selections) ? body.selections : [];
      const rows: Answer[] = qs.map((question, i) => { const s = typeof sel[i] === "number" ? sel[i] : null; return { question: question.question, selected: s, correct_index: question.correctIndex, is_correct: s === question.correctIndex }; });
      total = rows.length; correct = rows.filter((a) => a.is_correct).length; score = Math.round((correct / total) * 100); answers = rows;
    }
    const passed = score >= passPct;
    const { data: attempt, error } = await r.supa.from("quiz_attempts").insert({ user_id: uid, quiz_id: q.id, score, passed, answers }).select("id").single();
    if (error) return dbError(error);
    let xp = 0;
    if (passed) {
      xp += await awardOnce(r.supa, uid, "quiz", LEARN_XP.QUIZ_PASS, q.id);
      if (score >= 100) xp += await awardOnce(r.supa, uid, "bonus", LEARN_XP.QUIZ_PERFECT_BONUS, `${q.id}-perfect`);
    }
    return ok({ attemptId: (attempt as { id: string }).id, score, passed, correct, total, xp, answers });
  } catch (e) { return dbError(e); }
}
