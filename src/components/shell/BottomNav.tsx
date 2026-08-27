"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { HomeIcon, LearnIcon, MarketsIcon, ClubIcon, ProfileIcon } from "@/components/ui/icons";

/**
 * Nav v3 (canvas v9): Home · Club · Discover · Learn · Community — flat, five equal tabs.
 * Profile lives behind the header avatar. Small actions are sheets via the universal ＋ (PlusFab).
 * Child accounts (Explorer / Builder): Home · Learn · Practice · Family · Me — public community hidden.
 */
/** Nav v4 (canvas v12): Home · Discover · Learn · Practice · Me. Private clubs live inside Home's Main | Private
 *  switch; club pages, circles and community are drill-ins from Home. Kai is embedded (@Kai), not a destination. */
const ADULT = [
  { href: "/home", label: "Home", Icon: HomeIcon, also: ["/club", "/community", "/circle"] },
  { href: "/discover", label: "Discover", Icon: MarketsIcon, also: ["/search"] },
  { href: "/learn", label: "Learn", Icon: LearnIcon, also: ["/live", "/lesson"] },
  { href: "/practice", label: "Practice", Icon: PracticeIcon, also: [] as string[] },
  { href: "/profile", label: "Me", Icon: ProfileIcon, also: [] as string[] },
];
const CHILD = [
  { href: "/home", label: "Home", Icon: HomeIcon, also: [] as string[] },
  { href: "/learn", label: "Learn", Icon: LearnIcon, also: ["/live", "/lesson"] },
  { href: "/practice", label: "Practice", Icon: MarketsIcon, also: ["/discover", "/search"] },
  { href: "/family", label: "Family", Icon: ClubIcon, also: ["/club"] },
  { href: "/profile", label: "Me", Icon: ProfileIcon, also: [] as string[] },
];

function PracticeIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" />
    </svg>
  );
}
function CommunityIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M3.5 12h17M12 3a14 14 0 010 18M12 3a14 14 0 000 18" />
    </svg>
  );
}

export function useIsChild() {
  const [child, setChild] = useState(false);
  useEffect(() => {
    try {
      const l = localStorage.getItem("fic.level");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount
      setChild(l === "Explorer" || l === "Builder");
    } catch { /* storage unavailable */ }
  }, []);
  return child;
}

export function BottomNav() {
  const path = usePathname();
  const child = useIsChild();
  const tabs = child ? CHILD : ADULT;
  return (
    <nav className="flex items-end bg-nav border-t border-line-2 px-[10px] pt-[10px] pb-[calc(30px+env(safe-area-inset-bottom))] sm:pb-[30px] shrink-0" aria-label="Primary">
      {tabs.map(({ href, label, Icon, also }) => {
        const active = path === href || path.startsWith(href + "/") || also.some((a) => path === a || path.startsWith(a + "/"));
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex-1 flex flex-col items-center gap-[3px] ${active ? "text-green" : "text-ink-4"}`}>
            <Icon size={22} />
            <span className="text-[10px] font-extrabold">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
