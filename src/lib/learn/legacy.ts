/**
 * Legacy (non-stepped) lesson helpers — shared by the server reader and the client player.
 *
 * The 41 `video_provider = 'html'` lessons point at static bundles that live in FTA's `public/lessons/…`
 * (113 MB, not copied into this repo). Until those files move, relative ids are resolved against the
 * legacy asset origin so the iframe keeps working after the host cutover (`legacy.familyinvestingclub.com`).
 */
export const LEGACY_LESSON_ORIGIN = (process.env.NEXT_PUBLIC_LEGACY_LESSON_ORIGIN ?? "https://app.familyinvestingclub.com").replace(/\/$/, "");

export function resolveLegacyVideoId(provider: string | null, id: string | null): string | null {
  if (!id) return null;
  if (provider === "html" && id.startsWith("/")) return `${LEGACY_LESSON_ORIGIN}${id}`;
  return id;
}

/** Origins allowed to drive the iframe → platform bridge (FTA `lesson-bridge.ts`). */
export function isAllowedLessonOrigin(origin: string): boolean {
  if (!origin || origin === "null") return false;
  if (typeof window !== "undefined" && origin === window.location.origin) return true;
  if (origin === LEGACY_LESSON_ORIGIN || origin === "https://fta-university.vercel.app") return true;
  try {
    const u = new URL(origin);
    if (u.protocol !== "https:") return false;
    return u.hostname === "here.now" || u.hostname.endsWith(".here.now");
  } catch { return false; }
}

export type BridgeEvent = "ready" | "section" | "quiz_answer" | "complete";
export type BridgeMessage = { type: "fta"; v?: number; event: BridgeEvent; payload?: Record<string, unknown> };
export function isBridgeMessage(d: unknown): d is BridgeMessage {
  const m = d as BridgeMessage | null;
  return !!m && typeof m === "object" && m.type === "fta" && typeof m.event === "string" && ["ready", "section", "quiz_answer", "complete"].includes(m.event);
}
