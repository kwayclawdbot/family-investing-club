import { bad, ok, readJson, requireSession } from "@/lib/live/route-utils";
import { UUID, writeError } from "../_lib/errors";

/** Send into a community room → FTA `chat_messages`. RLS: general rooms only; kids are confined to the
 *  Main Circle (207); guardrails (192) and the profanity trigger refuse at the row — surfaced as messages. */
export async function POST(req: Request) {
  const r = await requireSession(); if (r.error) return r.error;
  const { roomId, content, replyToId } = await readJson<{ roomId?: string; content?: string; replyToId?: string }>(req);
  const text = (content ?? "").trim();
  if (!roomId || !UUID.test(roomId)) return bad("Missing room");
  if (text.length < 1 || text.length > 2000) return bad("Write a message (up to 2000 characters)");
  const { data, error } = await r.supa.from("chat_messages").insert({ room_id: roomId, user_id: r.session.user.id, content: text, reply_to_id: replyToId && UUID.test(replyToId) ? replyToId : null }).select("id").single();
  if (error) return writeError(error, "chat");
  return ok({ id: (data as { id: string }).id });
}
