import { bad, dbError, ok, readJson, requireSession } from "@/lib/live/route-utils";

/** Per-interaction skill mastery bump — FTA RPC `bump_skill_mastery(p_skill_id, p_correct)` (deterministic, unknown skills ignored). */
export async function POST(req: Request) {
  const r = await requireSession();
  if (r.error) return r.error;
  const { skillId, correct } = await readJson<{ skillId?: string; correct?: boolean }>(req);
  if (!skillId || typeof skillId !== "string") return bad("skillId required");
  try {
    const { error } = await r.supa.rpc("bump_skill_mastery", { p_skill_id: skillId, p_correct: correct === true });
    if (error) return dbError(error);
    return ok({ skillId, correct: correct === true });
  } catch (e) { return dbError(e); }
}
