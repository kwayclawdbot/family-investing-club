"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cx } from "@/components/ui";
import { ViewAsBar } from "./ViewAsBar";
import type { ViewAs } from "./view-as";

const NAV: { label: string | null; items: { label: string; href: string; exact?: boolean }[] }[] = [
  { label: null, items: [{ label: "Overview", href: "/admin", exact: true }] },
  { label: "People", items: [
    { label: "Members", href: "/admin/members" },
    { label: "Families", href: "/admin/families" },
    { label: "Support", href: "/admin/support" },
  ] },
  { label: "Marketing", items: [
    { label: "Leads", href: "/admin/leads" },
    { label: "Pipeline", href: "/admin/pipeline" },
    { label: "Campaigns", href: "/admin/campaigns" },
    { label: "Welcome drip", href: "/admin/drips" },
    { label: "Funnel", href: "/admin/funnel" },
    { label: "Challenge cohort", href: "/admin/challenge" },
  ] },
  { label: "Content", items: [
    { label: "Courses", href: "/admin/courses" },
    { label: "Lesson drafts", href: "/admin/courses/drafts" },
    { label: "Live sessions", href: "/admin/live-sessions" },
  ] },
  { label: "Comms", items: [{ label: "Announcements", href: "/admin/announcements" }] },
];

/** Desktop admin frame: fixed-width left nav, content column max ~1200px. Deliberately NOT the phone shell. */
export function AdminShell({ children, adminName, viewAs }: { children: ReactNode; adminName: string; viewAs: ViewAs | null }) {
  const path = usePathname();
  const active = (href: string, exact?: boolean) => (exact ? path === href : path === href || path.startsWith(href + "/"));
  return (
    <div className="min-h-dvh bg-canvas text-ink flex">
      <aside className="w-[232px] shrink-0 bg-nav border-r border-line-2 flex flex-col sticky top-0 h-dvh">
        <div className="px-5 pt-5 pb-4 border-b border-line-2">
          <Link href="/admin" className="block text-[15px] font-black text-ink leading-tight">Family Investing Club</Link>
          <div className="text-[10.5px] font-black uppercase tracking-[0.14em] text-green mt-1">Admin</div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="Admin">
          {NAV.map((g, gi) => (
            <div key={gi} className="mb-3">
              {g.label && <div className="px-2 mb-1 text-[10px] font-black uppercase tracking-[0.14em] text-ink-4">{g.label}</div>}
              {g.items.map((it) => {
                const on = active(it.href, it.exact) && !(it.href === "/admin/courses" && path.startsWith("/admin/courses/drafts"));
                return (
                  <Link key={it.href} href={it.href} aria-current={on ? "page" : undefined} className={cx("block rounded-[10px] px-3 py-[7px] text-[13px] font-extrabold transition", on ? "bg-green-tint text-green" : "text-ink-2 hover:bg-paper-2 hover:text-ink")}>
                    {it.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="px-4 py-3 border-t border-line-2 text-[12px] font-bold text-ink-3">
          <div className="truncate text-ink">{adminName}</div>
          <Link href="/home" className="text-green font-extrabold hover:underline">← Back to the app</Link>
        </div>
      </aside>
      <div className="flex-1 min-w-0 flex flex-col">
        <ViewAsBar current={viewAs} />
        <main className="flex-1 min-w-0 px-8 py-7">
          <div className="max-w-[1200px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
