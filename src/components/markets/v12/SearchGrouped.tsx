"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Company } from "@/lib/types";
import { money, pct } from "@/components/markets/format";
import { Ticker, Person, Eyebrow } from "./bits";

const Group = ({ title, children }: { title: string; children: React.ReactNode }) => <div className="mt-4"><Eyebrow className="mb-2">{title}</Eyebrow><div className="bg-card border border-line rounded-[14px] px-3 divide-y divide-paper-2">{children}</div></div>;

export type SearchCircle = { id: string; slug: string; name: string; emoji: string; line: string };
export type SearchPerson = { id: string; name: string; initial: string; color: string; belt: string; beltColor: string; line: string };
export type SearchContent = { title: string; line: string; emoji: string; href: string };

/** Search across the member's real world: live quotes, their club's open circles, their club-mates,
 *  and the published curriculum. Everything here is a row, not a fixture. */
export function SearchGrouped({ q, companies, owned, allCircles, allPeople, allContent }: {
  q: string; companies: Company[]; owned: string[];
  allCircles: SearchCircle[]; allPeople: SearchPerson[]; allContent: SearchContent[];
}) {
  const router = useRouter(); const [v, setV] = useState(q);
  const s = v.trim().toLowerCase();
  const hit = (...fields: (string | undefined)[]) => !!s && fields.some((f) => (f ?? "").toLowerCase().includes(s));
  const stocks = s ? companies.filter((c) => c.symbol.toLowerCase().includes(s) || c.name.toLowerCase().includes(s)).slice(0, 4) : [];
  const circles = allCircles.filter((c) => hit(c.name, c.line)).slice(0, 4);
  const people = allPeople.filter((p) => hit(p.name, p.line)).slice(0, 4);
  const content = allContent.filter((c) => hit(c.title, c.line)).slice(0, 5);
  return (
    <div className="pt-[14px] pb-6">
      <form onSubmit={(e) => { e.preventDefault(); router.replace(`/search?q=${encodeURIComponent(v)}`); }} className="flex items-center gap-2">
        <Link href="/discover" aria-label="Back" className="w-8 h-8 rounded-full bg-card border border-line flex items-center justify-center text-ink-2">‹</Link>
        <input autoFocus value={v} onChange={(e) => setV(e.target.value)} placeholder="Stocks, circles, people, content…" className="flex-1 h-[42px] rounded-[14px] bg-card border border-line px-3 text-[14px] font-bold text-ink outline-none focus:border-green" />
      </form>
      {!s && <p className="mt-6 text-center text-[12px] font-bold text-ink-3">Type a ticker, a name, a topic…</p>}
      {stocks.length > 0 && <Group title="STOCKS">{stocks.map((c) => <Link key={c.symbol} href={`/discover/${c.symbol}`} className="flex items-center gap-3 py-[10px]"><Ticker symbol={c.symbol} size={30} /><div className="flex-1 min-w-0"><div className="text-[13px] font-black text-ink">{c.name}</div><div className="text-[9.5px] font-bold text-ink-3">{money(c.price)}{owned.includes(c.symbol) ? " · your club owns it" : ""}</div></div><span className={`text-[11px] font-black ${c.changePct < 0 ? "text-red" : "text-[#3A8C4A]"}`}>{c.changePct >= 0 ? "▲" : "▼"}{Math.abs(c.changePct).toFixed(1)}%</span></Link>)}</Group>}
      {circles.length > 0 && <Group title="CIRCLES">{circles.map((c) => <div key={c.id} className="flex items-center gap-3 py-[10px]"><span className="w-[30px] h-[30px] rounded-[9px] bg-purple-tint flex items-center justify-center text-[13px]">{c.emoji}</span><div className="flex-1"><div className="text-[13px] font-black text-ink">{c.name}</div><div className="text-[9.5px] font-bold text-orange-2">{c.line}</div></div><Link href={`/circle/${c.slug}`} className="rounded-[9px] bg-green-2 text-cream-text px-3 py-[5px] text-[9.5px] font-black">Open</Link></div>)}</Group>}
      {people.length > 0 && <div className="mt-4"><Eyebrow className="mb-2">PEOPLE</Eyebrow><div className="flex flex-col gap-2">{people.map((p) => <Person key={p.id} {...p} action="View" href={`/club/members/${p.id}`} />)}</div></div>}
      {content.length > 0 && <Group title="CONTENT">{content.map((c) => <Link key={c.title} href={c.href} className="flex items-center gap-3 py-[10px]"><span className="text-[14px]">{c.emoji}</span><div><div className="text-[12.5px] font-bold text-ink">{c.title}</div><div className="text-[9.5px] font-bold text-ink-3">{c.line}</div></div></Link>)}</Group>}
      {s && !stocks.length && !circles.length && !people.length && !content.length && <p className="mt-6 text-center text-[12px] font-bold text-ink-3">Nothing for “{v}” yet.</p>}
      <p className="mt-6 text-center text-[10px] font-bold text-ink-4">Search = you know what you want · Discover = show me something new</p>
    </div>
  );
}
