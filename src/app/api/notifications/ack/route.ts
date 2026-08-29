import { bad, dbError, ok, readJson, requireSession } from "@/lib/live/route-utils";

/** Mark one (`{id}`) or every (`{all:true}`) notification read. FTA grants members UPDATE on read_at only (028). */
export async function POST(req: Request) {
  const r = await requireSession(); if (r.error) return r.error;
  const { id, all } = await readJson<{ id?: string; all?: boolean }>(req);
  if (!all && (!id || !/^[0-9a-f-]{36}$/i.test(id))) return bad("Missing notification id");
  let q = r.supa.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", r.session.user.id).is("read_at", null);
  if (!all) q = q.eq("id", id!);
  const { data, error } = await q.select("id");
  if (error) return dbError(error);
  return ok({ acked: (data as unknown[])?.length ?? 0 });
}
