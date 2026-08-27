import { bad, dbError, ok, readJson, requireSession } from "@/lib/live/route-utils";
export async function POST(req: Request) {
  const r = await requireSession(); if (r.error) return r.error;
  const b = await readJson<{ name?: string; kind?: string; privacy?: string }>(req);
  const name = (b.name ?? "").trim();
  if (name.length < 2 || name.length > 80) return bad("Name must be 2–80 characters");
  const kind = ["family", "friends", "mixed"].includes(b.kind ?? "") ? b.kind : "family";
  const privacy = b.privacy === "public" ? "public" : "private";
  const { data, error } = await r.supa.rpc("fic_create_club", { p_name: name, p_kind: kind, p_privacy: privacy });
  if (error) return dbError(error);
  const c = data as { id: string; invite_code: string };
  return ok({ id: c.id, inviteCode: c.invite_code });
}
