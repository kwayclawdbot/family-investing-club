import { requireAdmin } from "@/lib/live/admin-crm";
import { bad, dbError, ok, readJson } from "@/lib/live/route-utils";

const AUD = new Set(["all", "fic", "fta", "free"]);

/** POST /api/admin/announce { title, body, audience, link? } — FTA `admin_post_announcement` (feed_posts kind=announcement + notifications). */
export async function POST(req: Request) {
  const r = await requireAdmin(); if (r.error) return r.error;
  const b = await readJson<{ title?: string; body?: string; audience?: string; link?: string }>(req);
  const title = (b.title ?? "").trim();
  if (!title) return bad("Give your announcement a title");
  const { data, error } = await r.supa.rpc("admin_post_announcement", { p_title: title.slice(0, 140), p_body: (b.body ?? "").trim(), p_audience: AUD.has(b.audience ?? "") ? b.audience : "all", p_link: b.link?.trim() || null });
  if (error) return dbError(error);
  return ok(data as Record<string, unknown>);
}
