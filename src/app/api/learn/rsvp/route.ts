import { LEARN_XP } from "@/lib/learn/schema";
import { awardOnce } from "@/lib/learn/server";
import { bad, dbError, ok, readJson, requireSession } from "@/lib/live/route-utils";

/** RSVP to a live session (FTA `session_rsvps`, unique (session_id, user_id)); first RSVP per session earns XP once. */
export async function POST(req: Request) {
  const r = await requireSession();
  if (r.error) return r.error;
  const { sessionId, on } = await readJson<{ sessionId?: string; on?: boolean }>(req);
  if (!sessionId) return bad("sessionId required");
  const uid = r.session.user.id;
  try {
    if (on === false) {
      const { error } = await r.supa.from("session_rsvps").delete().eq("session_id", sessionId).eq("user_id", uid);
      if (error) return dbError(error);
      return ok({ rsvped: false, xp: 0 });
    }
    const { error } = await r.supa.from("session_rsvps").insert({ session_id: sessionId, user_id: uid, family_id: r.session.profile?.family_id ?? null });
    if (error && error.code !== "23505") return dbError(error);
    const xp = await awardOnce(r.supa, uid, "rsvp", LEARN_XP.RSVP, sessionId);
    return ok({ rsvped: true, xp });
  } catch (e) { return dbError(e); }
}
