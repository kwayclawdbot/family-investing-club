import { bad, ok, readJson, requireSession } from "@/lib/live/route-utils";
import { TICKER, UUID, writeError } from "../_lib/errors";

/** Community post → FTA `feed_posts` (kind='post'), shared with the FTA dashboard until cutover.
 *  Kid wall / guardrails are RLS (161, 192, 214): a refusal comes back as a 403 message. No XP for posting. */
export async function POST(req: Request) {
  const r = await requireSession(); if (r.error) return r.error;
  const b = await readJson<{ text?: string; title?: string; tickers?: string[]; position?: string; poll?: string[]; artifact?: string }>(req);
  const text = (b.text ?? "").trim();
  if (text.length < 1 || text.length > 2000) return bad("Write something (up to 2000 characters)");
  const tickers = [...new Set((Array.isArray(b.tickers) ? b.tickers : []).map((t) => String(t).toUpperCase().replace(/^\$/, "").trim()).filter((t) => TICKER.test(t)))].slice(0, 6);
  const position = ["bull", "neutral", "bear"].includes(b.position ?? "") ? b.position : null;
  const poll = Array.isArray(b.poll) ? b.poll.map((o) => String(o).trim().slice(0, 60)).filter(Boolean).slice(0, 4) : [];
  if (poll.length === 1) return bad("A poll needs at least two options");
  const artifact = (b.artifact ?? "").trim().slice(0, 120) || null;
  const payload = poll.length || artifact ? { type: "fic_post", ...(poll.length ? { poll } : {}), ...(artifact ? { artifact } : {}) } : null;
  const { data, error } = await r.supa.from("feed_posts").insert({
    author_id: r.session.user.id, family_id: r.session.profile?.family_id ?? null, kind: "post", body: text,
    title: (b.title ?? "").trim().slice(0, 120) || null, ticker_tags: tickers, position, activity_payload: payload,
  }).select("id").single();
  if (error) return writeError(error, "post");
  return ok({ id: (data as { id: string }).id });
}

/** Delete your own post (RLS: own row or admin). */
export async function DELETE(req: Request) {
  const r = await requireSession(); if (r.error) return r.error;
  const { id } = await readJson<{ id?: string }>(req);
  if (!id || !UUID.test(id)) return bad("Missing post id");
  const { data, error } = await r.supa.from("feed_posts").delete().eq("id", id).eq("author_id", r.session.user.id).select("id");
  if (error) return writeError(error, "delete");
  if (!(data as unknown[])?.length) return bad("That post isn't yours or is already gone", 404);
  return ok({ id });
}
