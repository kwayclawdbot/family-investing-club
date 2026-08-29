import { awardXp, bad, dbError, ok, readJson, requireSession } from "@/lib/live/route-utils";
import { LEARN_XP } from "@/lib/learn/schema";

/** Pass mark for a game session — FTA's `GAME_PASS_RATIO`. */
const PASS = 0.7;
const GAMES = new Set(["trend-or-trap", "candle-battle"]);

/**
 * Finish one game session: record the score, and pay XP only on a pass.
 * The client never awards its own XP — same rule as lessons and quizzes.
 */
export async function POST(req: Request) {
  const r = await requireSession(); if (r.error) return r.error;
  const { game, score, rounds } = await readJson<{ game?: string; score?: number; rounds?: number }>(req);
  if (!game || !GAMES.has(game)) return bad("Unknown game");
  const total = Number(rounds), got = Number(score);
  if (!Number.isFinite(total) || total < 1 || total > 50) return bad("Bad round count");
  if (!Number.isFinite(got) || got < 0 || got > total) return bad("Bad score");

  const { error } = await r.supa.from("game_scores").insert({ user_id: r.session.user.id, game, score: got, rounds: total });
  if (error) return dbError(error);

  const passed = got / total >= PASS;
  const xp = passed ? await awardXp(r.session.user.id, "game", LEARN_XP.PRACTICE_ORDER, `${game}-${Date.now()}`) : 0;
  return ok({ passed, xp });
}
