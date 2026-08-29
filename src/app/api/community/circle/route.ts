import { bad, ok, readJson, requireSession } from "@/lib/live/route-utils";
import { TICKER, writeError } from "../_lib/errors";

const DAYS = 30;
function slugFor(title: string) {
  const base = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "circle";
  return `${base}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Open a circle → FTA `club_circles` (+ the opener joins). 30-day hard clock; kids can't open (RLS 191). */
export async function POST(req: Request) {
  const r = await requireSession(); if (r.error) return r.error;
  const b = await readJson<{ title?: string; topic?: string; premise?: string; ticker?: string; days?: number }>(req);
  const title = (b.title ?? "").trim();
  const topic = (b.topic ?? "").trim() || "Theme";
  const premise = (b.premise ?? "").trim();
  if (title.length < 3 || title.length > 80) return bad("Name the circle (3–80 characters)");
  if (topic.length < 2 || topic.length > 24) return bad("Topic is 2–24 characters");
  if (premise.length < 10 || premise.length > 280) return bad("Say what the circle is about (10–280 characters)");
  const ticker = (b.ticker ?? "").toUpperCase().replace(/^\$/, "").trim() || null;
  if (ticker && !TICKER.test(ticker)) return bad("Invalid ticker");
  const days = Math.min(DAYS, Math.max(1, Math.round(Number(b.days ?? DAYS)) || DAYS));
  const slug = slugFor(title);
  const { data, error } = await r.supa.from("club_circles").insert({ slug, title, topic, premise, ticker, created_by: r.session.user.id, expires_at: new Date(Date.now() + days * 86400000).toISOString() }).select("id").single();
  if (error) return writeError(error, "open a circle");
  const id = (data as { id: string }).id;
  await r.supa.from("club_circle_members").insert({ circle_id: id, member_id: r.session.user.id });
  return ok({ id, slug });
}
