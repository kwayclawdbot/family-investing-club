import { bad, dbError, ok, readJson, requireSession } from "@/lib/live/route-utils";
export async function POST(req: Request) {
  const r = await requireSession(); if (r.error) return r.error;
  const { code } = await readJson<{ code?: string }>(req);
  if (!code || !/^[A-Za-z0-9-]{4,20}$/.test(code)) return bad("Enter a valid invite code");
  const { data, error } = await r.supa.rpc("fic_join_club", { p_code: code.toUpperCase() });
  if (error) return error.message.includes("INVALID_CODE") ? bad("That code didn't match a club", 404) : dbError(error);
  return ok({ id: (data as { id: string }).id });
}
