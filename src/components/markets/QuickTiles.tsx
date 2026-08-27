import Link from "next/link";

const TILES = [
  { href: "/discover/watchlist", emoji: "🔍", label: "Research lists" },
  { href: "/discover/news", emoji: "📰", label: "News" },
  { href: "/practice", emoji: "🪙", label: "Practice" },
  { href: "/community", emoji: "💡", label: "Ideas" },
];

export function QuickTiles() {
  return (
    <div className="grid grid-cols-4 gap-[8px] mt-3">
      {TILES.map((t) => (
        <Link key={t.href} href={t.href} className="flex flex-col items-center gap-[5px] rounded-[14px] border border-line bg-card py-[10px]">
          <span className="text-[20px]" aria-hidden>{t.emoji}</span>
          <span className="text-[11px] font-extrabold text-ink text-center leading-[1.1]">{t.label}</span>
        </Link>
      ))}
    </div>
  );
}
