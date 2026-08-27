"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/ui/extras";
import { ChevronLeft } from "@/components/ui/icons";
import { cx } from "@/components/ui";
import { connectSample, disconnectBrokerage, useBrokerage } from "./storage";

const BENEFITS = [
  { icon: "✓", title: "Verified Owner badge", sub: "Your Picks can show you actually own it — never the amount" },
  { icon: "📊", title: "Private portfolio insights", sub: "Allocation, overlap with your club model — visible only to you" },
  { icon: "👪", title: "Club exposure (if you opt in)", sub: "“What do we collectively own?” — percentages, never dollars, unless you say so" },
];

/** Artboard 04 — optional, read-only, "Not now" honoured. */
export function BrokerageConnect({ brokerages, connected, from }: { brokerages: { id: string; name: string }[]; connected?: boolean; from?: string }) {
  const router = useRouter();
  const { brokerage, setBrokerage } = useBrokerage(connected);
  const [choice, setChoice] = useState("fidelity");
  const [confirm, setConfirm] = useState(false);
  const [disc, setDisc] = useState(false);
  const backHref = from === "pick" ? "/club" : "/profile";

  function connect() {
    connectSample();
    setConfirm(false);
    router.push("/profile/privacy?first=1");
  }
  function disconnect() {
    disconnectBrokerage();
    setBrokerage(null);
    setDisc(false);
  }

  return (
    <div className="flex flex-col min-h-full pt-[14px] px-[2px]">
      <div className="flex items-center gap-[14px]">
        <button onClick={() => router.push(backHref)} aria-label="Back" className="text-ink-2"><ChevronLeft size={20} /></button>
        <span className="text-[16px] font-black text-ink">Verify your holdings</span>
        <span className="ml-auto bg-paper border border-line text-ink-3 rounded-[9px] px-[10px] py-1 text-[10px] font-black">OPTIONAL</span>
      </div>

      {brokerage ? (
        <>
          <div className="mt-[14px] bg-card border border-line rounded-[14px] px-[14px] py-[11px] flex items-center gap-[11px]">
            <span className="w-9 h-9 rounded-[11px] art-placeholder" aria-hidden />
            <div className="flex-1">
              <div className="text-[13.5px] font-extrabold text-ink">{brokerage.name} ····{brokerage.last4}</div>
              <div className="text-[10.5px] font-bold text-[#3A8C4A]">● Brokerage Connected ✓ · read-only</div>
            </div>
            <button onClick={() => setDisc(true)} className="text-[11px] font-extrabold text-red">Disconnect</button>
          </div>
          <p className="mt-3 text-[13.5px] font-semibold text-ink-2 leading-[1.55]">You&apos;re verified. Choose what your club sees and whether your public Picks carry the badge.</p>
          <a href="/profile/privacy" className="mt-3 block bg-green-2 rounded-[16px] py-[15px] text-center text-[15px] font-black text-cream-text shadow-[0_3px_0_#3A6B3E]">Privacy &amp; sharing</a>
          <a href="/profile/portfolio" className="mt-[10px] block text-center text-[13.5px] font-extrabold text-green">My Portfolio · 🔒 only you</a>
        </>
      ) : (
        <>
          <p className="mt-[14px] text-[13.5px] font-semibold text-ink-2 leading-[1.55]">
            Everything in FIC works without this. Connecting a brokerage — <b className="text-ink">read-only</b> — adds a trust layer you control.
          </p>
          <ul className="flex flex-col gap-[9px] mt-[14px]">
            {BENEFITS.map((b) => (
              <li key={b.title} className="bg-card border border-line rounded-[14px] px-[15px] py-3 flex gap-[11px] items-center">
                <span className="text-[18px] w-6 text-center" aria-hidden>{b.icon}</span>
                <div>
                  <div className="text-[13.5px] font-extrabold text-ink">{b.title}</div>
                  <div className="text-[11.5px] font-bold text-ink-3">{b.sub}</div>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-[14px] text-[11px] font-black text-ink-3">CHOOSE YOUR BROKERAGE</div>
          <div className="flex gap-[9px] mt-2" role="radiogroup" aria-label="Brokerage">
            {brokerages.map((b) => (
              <button key={b.id} role="radio" aria-checked={choice === b.id} onClick={() => setChoice(b.id)} className={cx("flex-1 rounded-[14px] py-[14px] px-[6px] text-center transition", choice === b.id ? "bg-card border-2 border-green-2" : "bg-card border-[1.5px] border-line")}>
                <span className="block w-[34px] h-[34px] rounded-[10px] mx-auto art-placeholder" aria-hidden />
                <span className={cx("block text-[10.5px] font-extrabold mt-[6px]", choice === b.id ? "text-green" : "text-ink-2")}>{b.name}</span>
              </button>
            ))}
          </div>
          <div className="mt-3 bg-green-tint border border-green-line rounded-[13px] px-[14px] py-[11px] text-[11.5px] font-bold text-green leading-[1.5]">
            🔒 Read-only. We never see your password, never move money, and you can disconnect anytime. Private by default.
          </div>
          <div className="mt-auto pt-5 pb-[calc(24px+env(safe-area-inset-bottom))] sm:pb-6">
            <button onClick={() => setConfirm(true)} className="w-full bg-green-2 rounded-[16px] py-[15px] text-center text-[15px] font-black text-cream-text shadow-[0_3px_0_#3A6B3E] active:translate-y-[2px] active:shadow-none transition">Connect securely</button>
            <button onClick={() => router.push(backHref)} className="mt-[10px] w-full text-center text-[13.5px] font-extrabold text-ink-3">Not now — everything still works</button>
          </div>
        </>
      )}

      <Sheet open={confirm} onClose={() => setConfirm(false)} title="Connect securely">
        <p className="text-[13.5px] font-bold text-ink-2 leading-[1.55]">
          Brokerage linking runs through a licensed aggregator — in this preview, connecting creates a <b className="text-ink">sample read-only link</b> ({brokerages.find((b) => b.id === choice)?.name ?? "Fidelity"} ····8214). No credentials are collected here.
        </p>
        <ul className="mt-3 text-[12px] font-bold text-ink-3 leading-[1.6] list-disc pl-4">
          <li>Read-only — FIC can never move money</li>
          <li>Defaults to <b>Private</b>; you pick what the club sees next</li>
          <li>Disconnect removes verification instantly</li>
        </ul>
        <button onClick={connect} className="mt-4 w-full bg-green-2 rounded-[14px] py-[13px] text-center text-[14px] font-black text-cream-text">Create sample link</button>
      </Sheet>

      <Sheet open={disc} onClose={() => setDisc(false)} title="Disconnect brokerage?">
        <p className="text-[13.5px] font-bold text-ink-2 leading-[1.55]">Your Verified Owner ✓ badge comes off your Picks immediately and your club stops seeing anything from this account. Everything else in FIC keeps working.</p>
        <button onClick={disconnect} className="mt-4 w-full bg-red rounded-[14px] py-[13px] text-center text-[14px] font-black text-cream-text">Disconnect</button>
      </Sheet>
    </div>
  );
}
