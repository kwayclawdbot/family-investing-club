"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { RealHolding, SharingLevel } from "@/lib/types";
import { Sheet, Toggle } from "@/components/ui/extras";
import { ChevronLeft } from "@/components/ui/icons";
import { cx } from "@/components/ui";
import { disconnectBrokerage, useBrokerage, useSharing } from "./storage";

const LEVELS: { id: SharingLevel; title: string; sub: React.ReactNode }[] = [
  { id: "private", title: "Private", sub: "Only you. Powers your personal insights, nothing shared." },
  { id: "positions", title: "Positions only", sub: <>They see <b>which</b> companies you own — never values.</> },
  { id: "allocation", title: "Allocation only", sub: "Percentages of your portfolio, no dollar amounts." },
  { id: "full", title: "Full transparency", sub: "Holdings and values. For clubs that share everything." },
];

/** Artboard 05 — granular consent + a live preview of what a club member sees. */
export function PrivacySharing({ clubName, previewMember, holdings, portfolioValue, connected, first }: { clubName: string; previewMember: string; holdings: RealHolding[]; portfolioValue: number; connected?: boolean; first?: boolean }) {
  const router = useRouter();
  const { brokerage, setBrokerage } = useBrokerage(connected);
  const [sharing, setSharing] = useSharing(connected);
  const [disc, setDisc] = useState(false);
  const top = holdings.slice(0, 3).map((h) => h.symbol).join(", ");
  const rest = Math.max(0, holdings.length - 3);

  function disconnect() {
    disconnectBrokerage();
    setBrokerage(null);
    setSharing({ ...sharing, publicBadge: false });
    setDisc(false);
    router.push("/profile/brokerage");
  }

  return (
    <div className="flex flex-col min-h-full pt-[14px] px-[2px]">
      <div className="flex items-center gap-[14px]">
        <button onClick={() => router.push("/profile")} aria-label="Back" className="text-ink-2"><ChevronLeft size={20} /></button>
        <span className="text-[16px] font-black text-ink">Privacy &amp; sharing</span>
      </div>

      {first && brokerage && (
        <div className="mt-3 bg-green-tint border border-green-line rounded-[13px] px-[14px] py-[10px] text-[12px] font-extrabold text-green">Brokerage Connected ✓ — now choose what {clubName} sees. Nothing is shared until you say so.</div>
      )}

      {brokerage ? (
        <div className="mt-3 bg-card border border-line rounded-[14px] px-[14px] py-[11px] flex items-center gap-[11px]">
          <span className="w-9 h-9 rounded-[11px] art-placeholder" aria-hidden />
          <div className="flex-1">
            <div className="text-[13.5px] font-extrabold text-ink">{brokerage.name} ····{brokerage.last4}</div>
            <div className="text-[10.5px] font-bold text-[#3A8C4A]">● Connected · synced 12 min ago · read-only</div>
          </div>
          <button onClick={() => setDisc(true)} className="text-[11px] font-extrabold text-red">Disconnect</button>
        </div>
      ) : (
        <div className="mt-3 bg-card border border-line rounded-[14px] px-[14px] py-[11px] flex items-center gap-[11px]">
          <span className="w-9 h-9 rounded-[11px] bg-paper-2" aria-hidden />
          <div className="flex-1">
            <div className="text-[13.5px] font-extrabold text-ink">No brokerage connected</div>
            <div className="text-[10.5px] font-bold text-ink-3">Nothing is shared. Settings below apply once you connect.</div>
          </div>
          <a href="/profile/brokerage" className="text-[11px] font-extrabold text-green">Connect</a>
        </div>
      )}

      <div className="mt-[14px] text-[11px] font-black text-ink-3">WHAT {clubName.toUpperCase()} SEES</div>
      <div className="flex flex-col gap-2 mt-2" role="radiogroup" aria-label="Club sharing level">
        {LEVELS.map((l) => {
          const on = sharing.club === l.id;
          return (
            <button key={l.id} role="radio" aria-checked={on} onClick={() => setSharing({ ...sharing, club: l.id })} className={cx("bg-card rounded-[14px] px-[14px] py-[11px] flex items-center gap-[11px] text-left transition", on ? "border-2 border-green-2" : "border-[1.5px] border-line")}>
              <div className="flex-1">
                <div className="text-[13px] font-extrabold text-ink">{l.title}</div>
                <div className="text-[11px] font-bold text-ink-3">{l.sub}</div>
              </div>
              <span className={cx("w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-white text-[11px] font-black", on ? "bg-green-2" : "border-2 border-line-3")} aria-hidden>{on ? "✓" : ""}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-3 text-[11px] font-black text-ink-3">PUBLIC COMMUNITY</div>
      <div className="mt-2 bg-card border border-line rounded-[14px] px-[14px] py-[11px] flex items-center justify-between gap-3">
        <div>
          <div className="text-[13px] font-extrabold text-ink">Verified Owner badge only</div>
          <div className="text-[11px] font-bold text-ink-3">Public sees <span className="bg-green-tint text-green rounded-[7px] px-2 py-[2px] text-[9.5px] font-black">VERIFIED OWNER ✓</span> on your Picks — never positions</div>
        </div>
        <Toggle checked={sharing.publicBadge} onChange={(v) => setSharing({ ...sharing, publicBadge: v })} label="Verified Owner badge on public Picks" />
      </div>

      <div className="mt-3 bg-paper border border-line rounded-[13px] px-[14px] py-[11px]">
        <div className="text-[10.5px] font-black text-ink-3">PREVIEW — WHAT {previewMember.toUpperCase()} SEES</div>
        {!brokerage || sharing.club === "private" ? (
          <div className="mt-[7px] text-[12px] font-bold text-[#4A4436]">{previewMember} sees nothing from your brokerage.</div>
        ) : (
          <>
            <div className="mt-[7px] flex items-center gap-[9px]">
              <span className="w-[26px] h-[26px] rounded-full bg-green-2 text-white flex items-center justify-center text-[10px] font-black border-2 border-[#FFFDF7]" aria-hidden>K</span>
              <span className="text-[12px] font-bold text-[#4A4436]">
                {sharing.club === "positions" && <>Kway owns <b>{top}</b>{rest > 0 && <> + {rest} more</>}</>}
                {sharing.club === "allocation" && <>Kway&apos;s allocation: {holdings.slice(0, 4).map((h) => `${h.symbol} ${h.weightPct}%`).join(" · ")}{holdings.length > 4 && " · …"}</>}
                {sharing.club === "full" && <>Kway holds {holdings.slice(0, 3).map((h) => `${h.symbol} ≈ $${Math.round((portfolioValue * h.weightPct) / 100).toLocaleString()}`).join(" · ")}{rest > 0 && <> + {rest} more</>}</>}
              </span>
            </div>
            <div className="mt-1 text-[10.5px] font-bold text-ink-4">
              {sharing.club === "positions" && "No values. No account numbers. Ever."}
              {sharing.club === "allocation" && "Percentages only. No dollar amounts, no account numbers."}
              {sharing.club === "full" && "Dollar values visible to your club. Account numbers are never shared."}
            </div>
          </>
        )}
      </div>

      <p className="mt-auto pt-5 pb-[calc(24px+env(safe-area-inset-bottom))] sm:pb-6 text-center text-[10.5px] font-bold text-ink-4">Changes are logged · consent can be revoked anytime · defaults are always the most private</p>

      <Sheet open={disc} onClose={() => setDisc(false)} title="Disconnect brokerage?">
        <p className="text-[13.5px] font-bold text-ink-2 leading-[1.55]">Your Verified Owner ✓ badge comes off your Picks immediately and {clubName} stops seeing anything from this account. Everything else in FIC keeps working.</p>
        <button onClick={disconnect} className="mt-4 w-full bg-red rounded-[14px] py-[13px] text-center text-[14px] font-black text-cream-text">Disconnect</button>
      </Sheet>
    </div>
  );
}
