import { provisionMembership, requireAdmin } from "@/lib/live/admin-crm";
import { bad, ok, readJson } from "@/lib/live/route-utils";

/**
 * POST /api/admin/invite { email, program: 'fic'|'fta', door: 'club'|'family' } — service-role membership
 * provisioning (port of FTA /api/admin/invite). Email delivery: Resend when RESEND_API_KEY is set,
 * otherwise Supabase's own invite mail; the response `mode` says which.
 */
export async function POST(req: Request) {
  const r = await requireAdmin(); if (r.error) return r.error;
  const b = await readJson<{ email?: string; program?: string; door?: string }>(req);
  const email = (b.email ?? "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return bad("Enter a valid email");
  const res = await provisionMembership({ email, program: b.program === "fta" ? "fta" : "fic", door: b.door === "club" ? "club" : "family", invitedBy: r.session.user.id });
  if (!res.ok) return bad(res.error, 500);
  return ok({ mode: res.mode, note: res.note ?? null });
}
