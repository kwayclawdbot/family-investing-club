"use client";
/** The games' streak ember. Self-contained — FIC doesn't carry FTA's art layer. */
export default function StreakFlame({ streak, showZero = false, size = 16, className = "" }: { streak: number; showZero?: boolean; size?: number; className?: string }) {
  if (!streak && !showZero) return null;
  const lit = streak > 0;
  return (
    <span className={`inline-flex items-center gap-1 leading-none ${className}`} title={lit ? `${streak} in a row` : "No streak yet"}>
      <span aria-hidden style={{ fontSize: size, filter: lit ? "none" : "grayscale(1)", opacity: lit ? 1 : 0.45 }}>🔥</span>
      <span className={`text-[12px] font-black ${lit ? "text-orange-2" : "text-ink-4"}`}>{streak}</span>
    </span>
  );
}
