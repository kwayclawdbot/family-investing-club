import Link from "next/link";
import { Card } from "@/components/ui";
import { ChevronRight } from "@/components/ui/icons";

const TILES = [
  { href: "/learn/review", emoji: "🧠", label: "Review", sub: "Flashcards" },
  { href: "/learn/games", emoji: "🎮", label: "Games", sub: "Skill drills" },
  { href: "/learn/chart-practice", emoji: "📈", label: "Charts", sub: "Practice" },
  { href: "/learn/scenarios", emoji: "🎯", label: "Scenarios", sub: "Decisions" },
];

/** Entry points to the practice systems (spec §3.7–3.11) + Live. */
export function LearnHub({ liveNow }: { liveNow?: { id: string; title: string; watching?: number } }) {
  return (
    <div className="mt-3">
      <div className="grid grid-cols-4 gap-2">
        {TILES.map((t) => (
          <Link key={t.href} href={t.href} className="rounded-[14px] border border-line bg-card py-[10px] px-1 flex flex-col items-center gap-[3px] active:scale-[0.98] transition">
            <span className="text-[20px] leading-none" aria-hidden>{t.emoji}</span>
            <span className="text-[11.5px] font-black text-ink mt-1">{t.label}</span>
            <span className="text-[9.5px] font-bold text-ink-3">{t.sub}</span>
          </Link>
        ))}
      </div>
      <Link href="/live" className="block mt-2">
        <Card className="flex items-center gap-3 px-4 py-[10px]">
          <span className="w-8 h-8 rounded-[10px] bg-green-tint flex items-center justify-center text-[15px]" aria-hidden>🎥</span>
          <span className="flex-1 min-w-0">
            <span className="block text-[13px] font-black text-ink">Live classes &amp; recordings</span>
            <span className="block text-[11px] font-bold text-ink-3 truncate">
              {liveNow ? `● Live now: ${liveNow.title}${liveNow.watching ? ` · ${liveNow.watching} watching` : ""}` : "Coaches, replays, family sessions"}
            </span>
          </span>
          <ChevronRight className="text-ink-4" />
        </Card>
      </Link>
    </div>
  );
}
