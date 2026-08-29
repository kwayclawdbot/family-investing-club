import { bad, ok, readJson, requireClub } from "@/lib/live/route-utils";
import { chatFamilyId } from "@/lib/live/club";
import { writeError } from "../../community/_lib/errors";

/** Private club chat → FTA `family_circle_messages` (one club = one family). Kids may write; family
 *  guardrails (downtime / daily limit) refuse at the row and come back as a 403 message. */
export async function POST(req: Request) {
  const r = await requireClub(); if (r.error) return r.error;
  const { body } = await readJson<{ body?: string }>(req);
  const text = (body ?? "").trim();
  if (text.length < 1 || text.length > 2000) return bad("Write a message (up to 2000 characters)");
  const familyId = await chatFamilyId();
  if (!familyId) return bad("This club isn't linked to a household yet — chat lives with your family club", 409);
  const { data, error } = await r.supa.from("family_circle_messages").insert({ family_id: familyId, author_id: r.session.user.id, kind: "message", body: text }).select("id").single();
  if (error) return writeError(error, "chat");
  return ok({ id: (data as { id: string }).id });
}
