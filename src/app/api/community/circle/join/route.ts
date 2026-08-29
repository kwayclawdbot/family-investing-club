import { bad, ok, readJson, requireSession } from "@/lib/live/route-utils";
import { UUID, writeError } from "../../_lib/errors";

/** Join / leave a circle → FTA `club_circle_members` (own row; kids can't join — RLS 191). */
export async function POST(req: Request) {
  const r = await requireSession(); if (r.error) return r.error;
  const { circleId, join } = await readJson<{ circleId?: string; join?: boolean }>(req);
  if (!circleId || !UUID.test(circleId)) return bad("Missing circle");
  const me = r.session.user.id;
  if (join === false) {
    const { error } = await r.supa.from("club_circle_members").delete().eq("circle_id", circleId).eq("member_id", me);
    if (error) return writeError(error, "leave");
    return ok({ joined: false });
  }
  const { error } = await r.supa.from("club_circle_members").upsert({ circle_id: circleId, member_id: me }, { onConflict: "circle_id,member_id", ignoreDuplicates: true });
  if (error) return writeError(error, "join a circle");
  return ok({ joined: true });
}
