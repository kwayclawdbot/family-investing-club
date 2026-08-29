import { bad, dbError, ok, readJson, requireSession } from "@/lib/live/route-utils";

const LEVELS = ["beginner", "developing", "proficient"] as const;
const USERNAME = /^[a-z0-9][a-z0-9-]{2,39}$/;

/**
 * PATCH /api/family/me — the member's own profile (FTA `profiles`, RLS "Users can update own profile";
 * the privileged-columns trigger keeps role/family/age_group out of reach).
 * Body: { displayName?, username?, comprehensionLevel?, notificationPrefs? (merged), avatarUrl? }
 * `username` is normalised by the `ensure_username` trigger; unique (case-insensitive).
 */
export async function PATCH(req: Request) {
  const r = await requireSession(); if (r.error) return r.error;
  const b = await readJson<{ displayName?: string; username?: string; comprehensionLevel?: string | null; notificationPrefs?: Record<string, unknown>; avatarUrl?: string | null }>(req);
  const patch: Record<string, unknown> = {};
  if (b.displayName !== undefined) {
    const n = String(b.displayName).trim();
    if (n.length < 1 || n.length > 60) return bad("Display name must be 1–60 characters");
    patch.display_name = n;
  }
  if (b.username !== undefined) {
    const u = String(b.username).trim().toLowerCase();
    if (!USERNAME.test(u)) return bad("Usernames are 3–40 letters, numbers or dashes");
    patch.username = u;
  }
  if (b.comprehensionLevel !== undefined) {
    if (b.comprehensionLevel !== null && !LEVELS.includes(b.comprehensionLevel as (typeof LEVELS)[number])) return bad("Unknown explanation level");
    patch.comprehension_level = b.comprehensionLevel;
  }
  if (b.avatarUrl !== undefined) {
    if (b.avatarUrl !== null && !/^https?:\/\//.test(String(b.avatarUrl))) return bad("Avatar must be a URL");
    patch.avatar_url = b.avatarUrl;
  }
  if (b.notificationPrefs && typeof b.notificationPrefs === "object") {
    const { data: cur } = await r.supa.from("profiles").select("notification_prefs").eq("id", r.session.user.id).maybeSingle();
    const next = { ...((cur?.notification_prefs as Record<string, unknown> | null) ?? {}) };
    for (const [k, v] of Object.entries(b.notificationPrefs)) {
      if (!/^[a-z_]{2,40}$/.test(k)) continue;
      if (typeof v === "boolean" || typeof v === "number" || typeof v === "string" || v === null) next[k] = v;
    }
    patch.notification_prefs = next;
  }
  if (!Object.keys(patch).length) return bad("Nothing to change");
  const { error } = await r.supa.from("profiles").update(patch).eq("id", r.session.user.id);
  if (error) {
    if (error.code === "23505") return bad("That username is taken", 409);
    return dbError(error);
  }
  if (patch.display_name) await r.supa.auth.updateUser({ data: { display_name: patch.display_name } }).catch(() => null);
  return ok(patch);
}
