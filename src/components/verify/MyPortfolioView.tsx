"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MyPortfolio } from "@/lib/types";
import { ChevronLeft } from "@/components/ui/icons";
import { cx } from "@/components/ui";
import { SHARING_LABEL, useBrokerage, useSharing } from "./storage";

const SWATCH: Record<string, string> = { "bg-green-2": "🟩", "bg-orange": "🟧", "bg-purple": "🟪", "bg-gold": "🟨", "bg-line-3": "⬜" };

/** Artboard 08 — private view of the member's real portfolio + overlap insight. */
export function MyPortfolioView({ p, clubName, connected }: { p: MyPortfolio; clubName: string; connected?: boolean }) {
  const router = useRouter();
  const { brokerage, ready } = useBrokerage(connected);
  const [sharing] = useSharing(connected);
  const combined = p.overlap.realPct + p.overlap.modelPct;

  return (
    <div className="pt-[14px] pb-6">
      <div className="flex items-center justify-between">
        <button onClick={() => router.push("/profile")} aria-label="Back" className="text-ink-2"><ChevronLeft size={20} /></button>
        <span className="text-[15px] font-black text-ink">My Portfolio</span>
        <span className="bg-green-tint text-green rounded-[9px] px-[10px] py-1 text-[9.5px] font-black">🔒 ONLY YOU</span>
      </div>

      {!brokerage ? (
        <div className={cx("mt-6 rounded-card border border-line bg-card px-5 py-8 text-center", !ready && "opacity-0")}>
          <div className="text-[28px]" aria-hidden>📊</div>
          <div className="mt-2 text-[15px] font-black text-ink">Connect a brokerage to see your real portfolio here</div>
          <p className="mt-1 text-[13px] font-bold text-ink-3 leading-[1.5]">Everything else in FIC works without it. Read-only, private by default, disconnect anytime.</p>
          <Link href="/profile/brokerage" className="inline-flex mt-4 h-[40px] px-5 items-center rounded-[12px] bg-green-2 text-cream-text text-[13px] font-black shadow-[0_3px_0_#3A6B3E]">Verify your holdings</Link>
          <div className="mt-3 text-[11px] font-bold text-ink-4">Optional · Verified Owner ✓ · never required to join, pick or vote</div>
        </div>
      ) : (
        <>
          <div className="mt-3 bg-card border border-line rounded-[16px] px-4 py-[13px] flex items-center gap-[11px]">
            <span className="w-9 h-9 rounded-[11px] art-placeholder" aria-hidden />
            <div className="flex-1 min-w-0">
              <div className="text-[13.5px] font-extrabold text-ink">{brokerage.name} ····{brokerage.last4}</div>
              <div className="text-[10.5px] font-bold text-[#3A8C4A]">● synced 12 min ago · read-only</div>
            </div>
            <div className="text-right">
              <div className="text-[16px] font-black text-ink">${p.value.toLocaleString()}</div>
              <div className="text-[10.5px] font-extrabold text-[#3A8C4A]">+{p.ytdPct}% YTD</div>
            </div>
          </div>

          <div className="mt-[11px] text-[12.5px] font-black text-ink">Your allocation</div>
          <div className="mt-[7px] bg-card border border-line rounded-[16px] px-4 py-[13px]">
            <div className="flex h-4 rounded-[8px] overflow-hidden" role="img" aria-label={p.allocation.map((a) => `${a.label} ${a.pct}%`).join(", ")}>
              {p.allocation.map((a) => <span key={a.label} className={a.color} style={{ width: `${a.pct}%` }} />)}
            </div>
            <div className="flex flex-wrap gap-[10px] mt-[9px] text-[10.5px] font-extrabold text-ink-2">
              {p.allocation.map((a) => <span key={a.label}>{SWATCH[a.color] ?? "▪"} {a.label} {a.pct}%</span>)}
            </div>
          </div>

          <div className="mt-[10px] bg-orange-tint border border-orange-line rounded-[14px] px-[14px] py-3">
            <div className="text-[10.5px] font-black text-orange-2">PRIVATE INSIGHT</div>
            <p className="mt-[5px] text-[12.5px] font-bold text-[#4A4436] leading-[1.5]">
              {p.overlap.symbol} is {p.overlap.realPct}% of your real portfolio <b>and</b> {p.overlap.modelPct}% of the club model you voted for. Combined{combined >= 25 ? "" : ""}, you&apos;re leaning hard on one company.
            </p>
            <Link href={p.overlap.lessonHref} className="inline-block mt-2 bg-green-2 text-cream-text rounded-[10px] px-[13px] py-[7px] text-[11px] font-black">📚 {p.overlap.lessonLabel} · {p.overlap.minutes} min</Link>
          </div>

          <div className="mt-[10px] bg-card border border-line rounded-[16px] px-[15px] py-[2px]">
            <Link href="/profile/privacy" className="flex justify-between items-center py-[11px] border-b border-paper-2">
              <span className="text-[12.5px] font-extrabold text-ink">Sharing with {clubName}</span>
              <span className="text-[11px] font-extrabold text-green">{SHARING_LABEL[sharing.club]} ›</span>
            </Link>
            <Link href="/profile/privacy" className="flex justify-between items-center py-[11px]">
              <span className="text-[12.5px] font-extrabold text-ink">Public badge</span>
              <span className="text-[11px] font-extrabold text-green">{sharing.publicBadge ? "Verified Owner ✓ on" : "Off"} ›</span>
            </Link>
          </div>
          <p className="mt-[10px] text-center text-[10px] font-bold text-ink-4">Never shared without your say-so · disconnect removes verification instantly</p>

          <div className="mt-4 text-[12.5px] font-black text-ink">Holdings · {p.holdings.length}</div>
          <div className="mt-[7px] bg-card border border-line rounded-[16px] px-[15px] py-[2px]">
            {p.holdings.map((h, i) => (
              <Link key={h.symbol} href={`/discover/${h.symbol}`} className={cx("flex items-center gap-[10px] py-[9px]", i < p.holdings.length - 1 && "border-b border-paper-2")}>
                <span className="w-8 h-8 rounded-[10px] bg-green-tint text-green flex items-center justify-center text-[9.5px] font-black shrink-0">{h.symbol}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-extrabold text-ink truncate">{h.name}</div>
                  <div className="text-[10px] font-bold text-ink-3">{h.bucket} · {h.weightPct}% of portfolio</div>
                </div>
                <span className="bg-green-tint text-green rounded-[7px] px-2 py-[2px] text-[9px] font-black whitespace-nowrap">VERIFIED HOLDING ✓</span>
              </Link>
            ))}
          </div>
          <p className="mt-2 text-center text-[10px] font-bold text-ink-4">Weights only in this view — dollar amounts stay inside your brokerage line above.</p>
        </>
      )}
    </div>
  );
}
