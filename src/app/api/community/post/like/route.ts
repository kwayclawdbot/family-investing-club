import { bad, ok, readJson, requireSession } from "@/lib/live/route-utils";
import { UUID, writeError } from "../../_lib/errors";

/** Toggle a like on a feed post → FTA `post_likes` (unique post_id,user_id). */
export async function POST(req: Request) {
  const r = await requireSession(); if (r.error) return r.error;
  const { postId } = await readJson<{ postId?: string }>(req);
  if (!postId || !UUID.test(postId)) return bad("Missing post id");
  const me = r.session.user.id;
  const { data: existing } = await r.supa.from("post_likes").select("id").eq("post_id", postId).eq("user_id", me).maybeSingle();
  if (existing) {
    const { error } = await r.supa.from("post_likes").delete().eq("post_id", postId).eq("user_id", me);
    if (error) return writeError(error, "react");
    return ok({ liked: false });
  }
  const { error } = await r.supa.from("post_likes").insert({ post_id: postId, user_id: me });
  if (error) return writeError(error, "react");
  return ok({ liked: true });
}
