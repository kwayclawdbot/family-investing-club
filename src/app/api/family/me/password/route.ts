import { bad, ok, readJson, requireSession } from "@/lib/live/route-utils";

/** POST /api/family/me/password — change the signed-in member's password (Supabase Auth, cookie session). Body: { password }. */
export async function POST(req: Request) {
  const r = await requireSession(); if (r.error) return r.error;
  const b = await readJson<{ password?: string }>(req);
  const pw = String(b.password ?? "");
  if (pw.length < 8) return bad("Password needs at least 8 characters");
  if (pw.length > 72) return bad("Password is too long");
  const { error } = await r.supa.auth.updateUser({ password: pw });
  if (error) return bad(/reauthent|recent/i.test(error.message) ? "For safety, sign in again before changing your password" : error.message, 400);
  return ok();
}
