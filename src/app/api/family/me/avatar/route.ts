import { bad, dbError, ok, requireSession } from "@/lib/live/route-utils";

const BUCKET = "community-media";
const MAX_BYTES = 2 * 1024 * 1024;
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };

/**
 * POST /api/family/me/avatar — multipart { file }. Uploads to the public `community-media` bucket under the
 * member's OWN prefix (storage policy `community_media_own_prefix_insert`: first folder = auth.uid()), then
 * writes `profiles.avatar_url`. The previous avatar is deleted when it lived under the same prefix.
 */
export async function POST(req: Request) {
  const r = await requireSession(); if (r.error) return r.error;
  let form: FormData;
  try { form = await req.formData(); } catch { return bad("Send the image as multipart form data"); }
  const file = form.get("file");
  if (!(file instanceof File)) return bad("Choose an image");
  const ext = TYPES[file.type];
  if (!ext) return bad("Use a JPG, PNG, WEBP or GIF");
  if (file.size > MAX_BYTES) return bad("Images must be under 2 MB");
  const uid = r.session.user.id;
  const path = `${uid}/avatar-${Date.now()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const up = await r.supa.storage.from(BUCKET).upload(path, bytes, { contentType: file.type, upsert: false, cacheControl: "3600" });
  if (up.error) return bad(`Upload failed: ${up.error.message}`, 500);
  const url = r.supa.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

  const { data: cur } = await r.supa.from("profiles").select("avatar_url").eq("id", uid).maybeSingle();
  const { error } = await r.supa.from("profiles").update({ avatar_url: url }).eq("id", uid);
  if (error) return dbError(error);
  const prev = cur?.avatar_url as string | null | undefined;
  const marker = `/${BUCKET}/${uid}/`;
  if (prev && prev.includes(marker) && !prev.endsWith(path)) {
    const old = prev.slice(prev.indexOf(marker) + `/${BUCKET}/`.length);
    await r.supa.storage.from(BUCKET).remove([old]).catch(() => null);
  }
  return ok({ avatarUrl: url });
}
