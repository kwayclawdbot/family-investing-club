"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { HomeIcon, LearnIcon, MarketsIcon, ClubIcon, ProfileIcon } from "@/components/ui/icons";

/**
 * Nav v2 (canvas v4): Home · Discover · CLUB (raised centre — the brand) · Learn · Profile.
 * Child accounts (Explorer / Builder) get Home · Learn · Practice · Family · Me — public community hidden.
 */
const ADULT = [
  { href: "/home", label: "Home", Icon: HomeIcon, also: [] as string[] },
  { href: "/discover", label: "Discover", Icon: MarketsIcon, also: ["/search"] },
  { href: "/club", label: "Club", Icon: ClubIcon, also: ["/community"], center: true },
  { href: "/learn", label: "Learn", Icon: LearnIcon, also: ["/live", "/practice"] },
  { href: "/profile", label: "Profile", Icon: ProfileIcon, also: ["/family"] },
];
const CHILD = [
  { href: "/home", label: "Home", Icon: HomeIcon, also: [] as string[] },
  { href: "/learn", label: "Learn", Icon: LearnIcon, also: ["/live"] },
  { href: "/practice", label: "Practice", Icon: MarketsIcon, also: ["/discover", "/search"], center: true },
  { href: "/family", label: "Family", Icon: ClubIcon, also: ["/club"] },
  { href: "/profile", label: "Me", Icon: ProfileIcon, also: [] as string[] },
];

function useIsChild() {
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
    <nav
      className="relative flex items-end bg-nav border-t border-line-2 px-[10px] pt-[8px] pb-[calc(26px+env(safe-area-inset-bottom))] sm:pb-[26px] shrink-0"
      aria-label="Primary"
    >
      {tabs.map(({ href, label, Icon, also, center }) => {
        const active = path === href || path.startsWith(href + "/") || also.some((a) => path === a || path.startsWith(a + "/"));
        if (center) {
          return (
            <Link key={href} href={href} aria-current={active ? "page" : undefined} className="flex-1 flex flex-col items-center gap-[3px] -mt-[22px]">
              <span className={`w-[54px] h-[54px] rounded-full flex items-center justify-center text-cream-text shadow-[0_8px_18px_rgba(58,107,62,0.35)] border-[3px] border-nav ${active ? "bg-green" : "bg-green-2"}`}>
                <Icon size={24} />
              </span>
              <span className={`text-[10px] font-extrabold ${active ? "text-green" : "text-ink-4"}`}>{label}</span>
            </Link>
          );
        }
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex-1 flex flex-col items-center gap-[3px] pt-[2px] ${active ? "text-green" : "text-ink-4"}`}>
            <Icon size={22} />
            <span className="text-[10px] font-extrabold">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
