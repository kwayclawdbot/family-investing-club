"use client";
import Link from "next/link";
import { writeJSON, PROMPTED_KEY } from "./storage";

/**
 * Artboard 01 — contextual connect. Triggered once, after the first shared Pick.
 * Never in onboarding. "Not now" is honoured: the pick stands on its own.
 */
export function ConnectPromptSheet({ symbol, onNotNow }: { symbol: string; onNotNow: () => void }) {
  const lines = ["Read-only — we can never move money", "You choose what your club sees", "Disconnect anytime"];
  function dismiss() {
    writeJSON(PROMPTED_KEY, 1);
    onNotNow();
  }
  return (
    <div className="absolute inset-0 z-[60] flex flex-col bg-[#B9AF97]" role="dialog" aria-modal="true" aria-label="Connect your brokerage">
      <div className="h-[250px] shrink-0 px-5 pt-[66px] opacity-45" aria-hidden>
        <div className="text-[21px] font-black text-ink">Club</div>
        <div className="mt-3 h-[38px] rounded-[13px] bg-[#EFE7D6]" />
        <div className="mt-3 h-[80px] rounded-[16px] bg-[#FFFDF7]" />
      </div>
      <div className="flex-1 bg-paper rounded-t-[28px] shadow-[0_-8px_30px_rgba(46,42,33,0.3)] flex flex-col px-[22px] pt-[14px]">
        <div className="w-10 h-[5px] rounded-[3px] bg-[#D9CDB2] mx-auto" />
        <div className="mt-4 text-center">
          <span className="bg-green-tint text-green rounded-[20px] px-[14px] py-[5px] text-[11px] font-black">PICK SHARED WITH THE CLUB 🎉</span>
        </div>
        <h2 className="mt-4 text-[23px] font-black text-ink text-center leading-[1.3]">Do you actually<br />own {symbol}?</h2>
        <p className="mt-[9px] text-[13.5px] font-semibold text-ink-3 text-center leading-[1.5]">
          Connect your brokerage — read-only — and your picks can carry{" "}
          <span className="bg-green-tint text-green rounded-[7px] px-2 py-[2px] text-[11px] font-black whitespace-nowrap">VERIFIED OWNER ✓</span>
        </p>
        <ul className="flex flex-col gap-[9px] mt-[18px]">
          {lines.map((l) => (
            <li key={l} className="flex items-center gap-[11px] bg-card border border-line rounded-[13px] px-[15px] py-3">
              <span className="w-6 h-6 rounded-full bg-green-2 text-white flex items-center justify-center text-[12px] font-black shrink-0" aria-hidden>✓</span>
              <span className="text-[13.5px] font-extrabold text-ink">{l}</span>
            </li>
          ))}
        </ul>
        <div className="mt-auto pb-[calc(44px+env(safe-area-inset-bottom))] sm:pb-[44px]">
          <Link href="/profile/brokerage?from=pick" onClick={() => writeJSON(PROMPTED_KEY, 1)} className="block bg-green-2 rounded-[16px] py-4 text-center text-[15.5px] font-black text-cream-text shadow-[0_3px_0_#3A6B3E] active:translate-y-[2px] active:shadow-none transition">
            Connect brokerage
          </Link>
          <button type="button" onClick={dismiss} className="mt-[11px] w-full text-center text-[13.5px] font-extrabold text-ink-3">
            Not now — my pick stands on its own
          </button>
        </div>
      </div>
    </div>
  );
}
