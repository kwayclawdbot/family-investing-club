"use client";
import { useState } from "react";

export function InviteRow({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  async function share() {
    const text = `Join our family on Family Investing Club — code ${code}`;
    try {
      if (navigator.share) { await navigator.share({ text }); return; }
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* user cancelled or clipboard blocked */ }
  }
  return (
    <div className="mt-3 bg-card border border-line rounded-card px-4 py-[13px] flex items-center gap-3">
      <span className="text-[22px]">✉️</span>
      <div className="flex-1">
        <div className="text-[13px] font-black text-ink">Invite your family</div>
        <div className="text-[12px] font-bold text-ink-3">
          Code: <span className="font-black text-green tracking-[0.5px]">{code}</span>
        </div>
      </div>
      <button onClick={share} className="bg-green-2 text-cream-text rounded-[11px] px-[14px] py-[7px] text-[12px] font-black active:scale-95 transition">
        {copied ? "Copied!" : "Share"}
      </button>
    </div>
  );
}
