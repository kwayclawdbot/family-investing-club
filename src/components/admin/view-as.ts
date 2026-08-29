/**
 * "View as" — an admin previews the member shell as another register WITHOUT touching a row.
 * The cookie is never the authority: `resolveViewAs()` in `src/lib/live/admin-crm.ts` only reads it
 * once the REAL profile is an admin (port of FTA `src/lib/view-as.ts`). It reshapes the shell (child
 * tab bar, tier gating), never RLS — a kid preview still reads the admin's own data.
 */
export type ViewAs = "parent" | "fta" | "teen" | "kid" | "free";
export const VIEW_AS_COOKIE = "fic_view_as";
export const VIEW_AS_MAX_AGE = 8 * 60 * 60;
export const VIEW_AS_ORDER: readonly ViewAs[] = ["parent", "fta", "teen", "kid", "free"] as const;

export type ViewAsPersona = { id: ViewAs; label: string; blurb: string; role: string; age_group: string; tier: "fta" | "fic" | "free" };
export const VIEW_AS_PERSONAS: Record<ViewAs, ViewAsPersona> = {
  parent: { id: "parent", label: "Parent", blurb: "Parent in a household — FIC tier", role: "parent", age_group: "adults", tier: "fic" },
  fta: { id: "fta", label: "FTA", blurb: "Parent with the Academy unlocked", role: "parent", age_group: "adults", tier: "fta" },
  teen: { id: "teen", label: "Teen", blurb: "Teen learner — child shell, teen gates", role: "child", age_group: "teens", tier: "fic" },
  kid: { id: "kid", label: "Kid", blurb: "Young learner — child shell, kid walls on", role: "child", age_group: "kids", tier: "fic" },
  free: { id: "free", label: "Free", blurb: "Lapsed / free family — paywalls visible", role: "parent", age_group: "adults", tier: "free" },
};

export function parseViewAs(v: unknown): ViewAs | null {
  return typeof v === "string" && (VIEW_AS_ORDER as readonly string[]).includes(v) ? (v as ViewAs) : null;
}
