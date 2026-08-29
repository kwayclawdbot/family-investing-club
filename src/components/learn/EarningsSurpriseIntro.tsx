import Link from "next/link";
import { CashText, Logo } from "@/components/markets/v13/bits";
import { earningsSurprise as e } from "@/lib/content/earnings-scenario";

/** Prototype v3 `practice` → "Earnings surprise — react in real time": opens with the real report; honest until then. */
export function EarningsSurpriseIntro() {
  return (
    <div className="pt-[14px] pb-8">
      <div className="flex items-center gap-3">
        <Link href="/learn?tab=practice" aria-label="Back" className="w-9 h-9 rounded-full bg-card border border-line flex items-center justify-center text-ink-2">‹</Link>
        <span className="text-[10px] font-black text-purple-2">SCENARIO · EARNINGS SURPRISE</span>
      </div>
      <div className="mt-4 rounded-[18px] bg-card border border-line px-4 py-4 flex items-center gap-3">
        <Logo symbol={e.symbol} size={44} radius={13} />
        <div className="flex-1"><div className="text-[16px] font-black text-ink">{e.title}</div><div className="text-[10.5px] font-bold text-ink-3">{e.emoji} with Simbot · opens {e.when}</div></div>
      </div>
      <p className="mt-3 text-[13px] font-bold text-ink-2 leading-[1.5]"><CashText text={e.blurb} /></p>
      <div className="mt-3 rounded-[15px] bg-card border border-line px-4 py-1">
        {e.steps.map((s, i) => (
          <div key={s} className={`flex items-center gap-3 py-[10px] ${i < e.steps.length - 1 ? "border-b border-paper-2" : ""}`}>
            <span className="w-7 h-7 rounded-full bg-purple-tint text-purple-2 text-[11px] font-black flex items-center justify-center">{i + 1}</span>
            <span className="text-[12.5px] font-extrabold text-ink"><CashText text={s} /></span>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-[14px] bg-orange-tint border border-orange-line px-4 py-3 text-[12px] font-bold text-orange-2">⏳ Opens after Wednesday&apos;s report — we&apos;ll notify you the moment the numbers land.</div>
      <Link href="/discover/NVDA" className="mt-3 block w-full h-[46px] rounded-[14px] bg-card border border-line text-ink text-[13px] font-black text-center leading-[46px]">Read the $NVDA setup first ›</Link>
    </div>
  );
}
