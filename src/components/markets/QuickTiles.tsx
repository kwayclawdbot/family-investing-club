import Link from "next/link";

const TILES = [
  { href: "/markets/watchlist", emoji: "👀", label: "Watchlist" },
  { href: "/markets/news", emoji: "📰", label: "News" },
  { href: "/markets/discover", emoji: "🧭", label: "Discover" },
  { href: "/practice", emoji: "🪙", label: "Practice" },
];

export function QuickTiles() {
  return (
    <div className="grid grid-cols-4 gap-[8px] mt-3">
      {TILES.map((t) => (
        <Link key={t.href} href={t.href} className="flex flex-col items-center gap-[5px] rounded-[14px] border border-line bg-card py-[10px]">
          <span className="text-[20px]" aria-hidden>{t.emoji}</span>
          <span className="text-[11px] font-extrabold text-ink">{t.label}</span>
        </Link>
      ))}
    </div>
  );
}
