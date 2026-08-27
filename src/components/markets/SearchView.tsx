"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Company, Flashcard, Idea, LearningPath } from "@/lib/types";
import { Card } from "@/components/ui";
import { KaiSpark, ChevronRight, SearchIcon, LockIcon } from "@/components/ui/icons";
import { SymbolTile } from "./SymbolTile";
import { money, pct } from "./format";
import { readRecent, pushRecent } from "./store";

const H = ({ children }: { children: React.ReactNode }) => (
  <h2 className="mt-4 mb-2 text-[13px] font-extrabold text-ink-3 uppercase tracking-[0.3px]">{children}</h2>
);

type Props = { initialQ: string; companies: Company[]; paths: LearningPath[]; flashcards: Flashcard[]; ideas: Idea[] };

export function SearchView({ initialQ, companies, paths, flashcards, ideas }: Props) {
  const router = useRouter();
  const [q, setQ] = useState(initialQ);
  const [recent, setRecent] = useState<string[]>([]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount
    setRecent(initialQ ? pushRecent(initialQ) : readRecent());
  }, [initialQ]);

  const s = q.trim().toLowerCase();
  const r = useMemo(() => {
    if (!s) return null;
    const has = (t: string) => t.toLowerCase().includes(s);
    return {
      companies: companies.filter((c) => has(c.symbol) || has(c.name)),
      paths: paths.filter((p) => has(p.title) || p.units.some((u) => has(u.title)) || (p.lessonList ?? []).some((l) => has(l.title))),
      concepts: flashcards.filter((f) => has(f.term) || has(f.concept)),
      ideas: ideas.filter((i) => has(i.title) || i.companies.some((c) => has(c.symbol) || has(c.name))),
    };
  }, [s, companies, paths, flashcards, ideas]);
  const total = r ? r.companies.length + r.paths.length + r.concepts.length + r.ideas.length : 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = q.trim();
    if (!t) return;
    setRecent(pushRecent(t));
    router.replace(`/search?q=${encodeURIComponent(t)}`);
  }

  return (
    <>
      <form onSubmit={submit} className="flex items-center gap-[10px]">
        <label className="flex-1 flex items-center gap-[9px] bg-card border border-line rounded-[14px] px-[14px] py-[10px]">
          <SearchIcon size={15} className="text-ink-4 shrink-0" />
          <input
            type="search"
            autoFocus
            enterKeyHint="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Companies, lessons, concepts, ideas…"
            aria-label="Search"
            className="flex-1 min-w-0 bg-transparent outline-none text-[13px] font-bold text-ink placeholder:text-ink-4"
          />
        </label>
        <Link href="/markets" className="text-[13px] font-extrabold text-green">Cancel</Link>
      </form>

      {s && (
        <Link href={`/kai?q=${encodeURIComponent(q.trim())}`} className="mt-3 flex items-center gap-[10px] bg-purple-tint border border-purple-line rounded-[14px] px-[14px] py-3">
          <span className="w-7 h-7 rounded-[10px] bg-purple text-white flex items-center justify-center shrink-0"><KaiSpark size={14} /></span>
          <span className="flex-1 text-[13px] font-extrabold text-purple-2 truncate">Ask Kai: “{q.trim()}”</span>
          <ChevronRight className="text-purple-2" />
        </Link>
      )}

      {!s && (
        <>
          <H>Recent</H>
          {recent.length === 0 ? (
            <p className="text-[12.5px] font-bold text-ink-4">Try “Apple”, “dividend” or “stock market”.</p>
          ) : (
            <div className="flex flex-wrap gap-[6px]">
              {recent.map((t) => (
                <button key={t} type="button" onClick={() => setQ(t)} className="h-[30px] px-3 rounded-[10px] bg-card border border-line text-[12px] font-extrabold text-ink-2">{t}</button>
              ))}
            </div>
          )}
          <H>Browse</H>
          <div className="grid grid-cols-2 gap-[8px]">
            {[["🧭", "Discover companies", "/markets/discover"], ["📚", "Course library", "/learn/library"], ["💡", "Club ideas", "/club"], ["🃏", "Review concepts", "/learn/review"]].map(([e, t, h]) => (
              <Link key={h} href={h} className="rounded-[14px] border border-line bg-card px-3 py-3 flex items-center gap-2">
                <span className="text-[18px]" aria-hidden>{e}</span>
                <span className="text-[12.5px] font-extrabold text-ink">{t}</span>
              </Link>
            ))}
          </div>
        </>
      )}

      {r && total === 0 && (
        <div className="mt-6 text-center">
          <div className="text-[26px]" aria-hidden>🔎</div>
          <div className="mt-1 text-[14px] font-black text-ink">Nothing matches “{q.trim()}”</div>
          <p className="mt-1 text-[12.5px] font-bold text-ink-3">Try a ticker like AAPL, or ask Kai above.</p>
        </div>
      )}

      {r && r.companies.length > 0 && (
        <>
          <H>Companies</H>
          <Card className="!py-1 !px-4">
            {r.companies.map((c, i) => (
              <Link key={c.symbol} href={`/markets/${c.symbol}`} className={`flex items-center gap-[11px] py-[10px] ${i < r.companies.length - 1 ? "border-b border-paper-2" : ""}`}>
                <SymbolTile symbol={c.symbol} size={32} />
                <span className="flex-1 min-w-0">
                  <span className="block text-[13px] font-extrabold text-ink truncate">{c.name}</span>
                  <span className="block text-[11px] font-bold text-ink-4">{c.symbol}</span>
                </span>
                <span className="text-right">
                  <span className="block text-[13px] font-black text-ink">${money(c.price)}</span>
                  <span className={`block text-[11px] font-extrabold ${c.changePct >= 0 ? "text-[#3A8C4A]" : "text-red"}`}>{pct(c.changePct, 2)}</span>
                </span>
              </Link>
            ))}
          </Card>
        </>
      )}
      {r && r.paths.length > 0 && (
        <>
          <H>Lessons & paths</H>
          <Card className="!py-1 !px-4">
            {r.paths.map((p, i) => (
              <Link key={p.slug} href={`/learn/path/${p.slug}`} className={`flex items-center gap-[11px] py-[10px] ${i < r.paths.length - 1 ? "border-b border-paper-2" : ""}`}>
                <span className="w-8 h-8 rounded-[10px] bg-green-tint text-green flex items-center justify-center shrink-0">{p.status === "locked" ? <LockIcon size={14} /> : "📖"}</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[13px] font-extrabold text-ink truncate">{p.title}</span>
                  <span className="block text-[11px] font-bold text-ink-4">{p.lessons} lessons · {p.progress}% done</span>
                </span>
                <ChevronRight className="text-ink-4" />
              </Link>
            ))}
          </Card>
        </>
      )}
      {r && r.concepts.length > 0 && (
        <>
          <H>Concepts</H>
          <Card className="!py-1 !px-4">
            {r.concepts.map((f, i) => (
              <Link key={f.id} href={`/learn/path/${f.pathSlug}`} className={`block py-[10px] ${i < r.concepts.length - 1 ? "border-b border-paper-2" : ""}`}>
                <span className="block text-[13px] font-extrabold text-ink">{f.term}</span>
                <span className="block text-[11.5px] font-bold text-ink-3 leading-[1.4]">{f.definition}</span>
              </Link>
            ))}
          </Card>
        </>
      )}
      {r && r.ideas.length > 0 && (
        <>
          <H>Club ideas</H>
          <Card className="!py-1 !px-4">
            {r.ideas.map((it, i) => (
              <Link key={it.id} href={`/club/idea/${it.id}`} className={`flex items-center gap-[11px] py-[10px] ${i < r.ideas.length - 1 ? "border-b border-paper-2" : ""}`}>
                <span className="w-8 h-8 rounded-[10px] bg-purple-tint text-purple-2 flex items-center justify-center shrink-0">💡</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[13px] font-extrabold text-ink truncate">{it.title}</span>
                  <span className="block text-[11px] font-bold text-ink-4">{it.author} · {it.status}</span>
                </span>
                <ChevronRight className="text-ink-4" />
              </Link>
            ))}
          </Card>
        </>
      )}
    </>
  );
}
