"use client";
import Link from "next/link";
import { tradeIdeas, performanceCenter } from "@/lib/fixtures/v13-club";
import { openSheet } from "@/components/sheets/bus";
import { cx } from "@/components/ui";

/** $TICKER mentions tap through to the company page (prototype v2). */
export function Tickerized({ text, link = true }: { text: string; link?: boolean }) {
  const parts = text.split(/(\$[A-Z]{1,5})/g);
  return <>{parts.map((p, i) => /^\$[A-Z]{1,5}$/.test(p) ? (link ? <Link key={i} href={`/discover/${p.slice(1)}`} className="text-green font-black">{p}</Link> : <span key={i} className="text-green font-black">{p}</span>) : <span key={i}>{p}</span>)}</>;
}

/** Prototype v2 `home`: MY PERFORMANCE CENTER row + ACTIVE TRADE IDEAS from your club & Kai. */
export function HomeExtras() {
  return (
    <>
      <Link href="/profile/performance" className="mt-[12px] flex items-center gap-3 bg-card border border-line rounded-[14px] px-[14px] py-[10px]">
        <span className="flex-1 min-w-0">
          <span className="block text-[9.5px] font-black tracking-[0.5px] text-ink-3">MY PERFORMANCE CENTER</span>
          <span className="block text-[13px] font-black text-ink">{performanceCenter.picksYtd} <span className="text-[10.5px] font-extrabold text-ink-3">picks YTD · {performanceCenter.accuracy} accuracy</span></span>
        </span>
        <span className="text-[11px] font-black text-green">View ›</span>
      </Link>
      <div className="mt-[14px] flex items-baseline justify-between">
        <span className="text-[9.5px] font-black tracking-[0.5px] text-ink-3">ACTIVE TRADE IDEAS</span>
        <span className="text-[9.5px] font-extrabold text-ink-4">from your club &amp; Kai</span>
      </div>
      <div className="mt-[7px] grid grid-cols-2 gap-2">
        {tradeIdeas.map((t) => {
          const inner = (
            <>
              <span className={cx("inline-block rounded-[6px] px-[6px] py-[2px] text-[8.5px] font-black tracking-[0.3px]", t.tagTone === "club" ? "bg-purple-tint text-purple-2" : "bg-[#EFEBF8] text-purple-2")}>{t.tag}</span>
              <span className="block mt-[6px] text-[12.5px] font-black text-ink leading-tight"><Tickerized text={t.title} link={!t.href} /></span>
              <span className="block text-[9.5px] font-extrabold text-ink-3 mt-[2px]">{t.sub}</span>
              <span className="block text-[10px] font-black text-[#3A8C4A] mt-[5px]">{t.meta}</span>
            </>
          );
          const cls = "text-left bg-card border border-line rounded-[14px] px-3 py-[10px]";
          return t.href ? <Link key={t.id} href={t.href} className={cls}>{inner}</Link> : <button key={t.id} onClick={() => openSheet("kai", { context: t.kaiContext })} className={cls}>{inner}</button>;
        })}
      </div>
    </>
  );
}
