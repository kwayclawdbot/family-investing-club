"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, LearnIcon, MarketsIcon, ClubIcon, ProfileIcon } from "@/components/ui/icons";

const TABS = [
  { href: "/home", label: "Home", Icon: HomeIcon },
  { href: "/learn", label: "Learn", Icon: LearnIcon },
  { href: "/markets", label: "Markets", Icon: MarketsIcon },
  { href: "/club", label: "Club", Icon: ClubIcon },
  { href: "/profile", label: "Profile", Icon: ProfileIcon },
] as const;

export function BottomNav() {
  const path = usePathname();
  return (
    <nav
      className="flex bg-nav border-t border-line-2 px-[10px] pt-[10px] pb-[calc(30px+env(safe-area-inset-bottom))] sm:pb-[30px] shrink-0"
      aria-label="Primary"
    >
      {TABS.map(({ href, label, Icon }) => {
        const active =
          path === href ||
          path.startsWith(href + "/") ||
          (href === "/markets" && (path.startsWith("/practice") || path.startsWith("/search"))) ||
          (href === "/learn" && path.startsWith("/live")) ||
          (href === "/profile" && path.startsWith("/family"));
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex-1 flex flex-col items-center gap-[3px] ${active ? "text-green" : "text-ink-4"}`}
          >
            <Icon size={22} />
            <span className="text-[10px] font-extrabold">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
