import { awardXp, bad, ok, readJson, requireSession, xpFor } from "@/lib/live/route-utils";
import { UUID, writeError } from "../../_lib/errors";

/** Comment on a feed post → FTA `post_comments`. The notify_on_post_comment trigger fans out the reply notification. */
export async function POST(req: Request) {
  const r = await requireSession(); if (r.error) return r.error;
  const { postId, body } = await readJson<{ postId?: string; body?: string }>(req);
  const text = (body ?? "").trim();
  if (!postId || !UUID.test(postId)) return bad("Missing post id");
  if (text.length < 1 || text.length > 1000) return bad("Write a reply (up to 1000 characters)");
  const { data, error } = await r.supa.from("post_comments").insert({ post_id: postId, author_id: r.session.user.id, body: text }).select("id").single();
  if (error) return writeError(error, "reply");
  const xp = await awardXp(r.session.user.id, "reply", xpFor("reply")!, postId);
  return ok({ id: (data as { id: string }).id, xp });
}

/** Delete your own comment (RLS: own row or admin). */
export async function DELETE(req: Request) {
  const r = await requireSession(); if (r.error) return r.error;
  const { id } = await readJson<{ id?: string }>(req);
  if (!id || !UUID.test(id)) return bad("Missing comment id");
  const { data, error } = await r.supa.from("post_comments").delete().eq("id", id).eq("author_id", r.session.user.id).select("id");
  if (error) return writeError(error, "delete");
  if (!(data as unknown[])?.length) return bad("That comment isn't yours or is already gone", 404);
  return ok({ id });
}
