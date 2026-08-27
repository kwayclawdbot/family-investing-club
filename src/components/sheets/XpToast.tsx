"use client";
import { useXpToast } from "./bus";
export { showXp } from "./bus";

/** Small chip that rises from the ＋ for ~1.2s. Motion-safe; static when reduced motion is preferred. */
export function XpToastHost() {
  const t = useXpToast();
  if (!t) return null;
  return (
    <div key={t.id} aria-live="polite" className="pointer-events-none absolute right-[26px] bottom-[186px] z-[70] motion-safe:animate-[xpRise_1.2s_ease-out_forwards]">
      <span className="inline-flex items-center rounded-full bg-gold text-ink px-3 py-[5px] text-[12px] font-black shadow-[0_4px_12px_rgba(46,42,33,0.25)]">+{t.xp} XP</span>
      <style>{`@keyframes xpRise{0%{transform:translateY(8px);opacity:0}15%{transform:translateY(0);opacity:1}75%{opacity:1}100%{transform:translateY(-36px);opacity:0}}`}</style>
    </div>
  );
}
