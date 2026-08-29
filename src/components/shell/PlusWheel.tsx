"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { openSheet } from "@/components/sheets/bus";

/** Prototype v2 `wheel`: quarter-wheel spun from the ＋ — MAKE A PICK · RESEARCH · ASK THE CLUB · PROPOSAL · ASK KAI (SVG verbatim). */
const ROUTES: Record<string, string> = { clubdec: "/club?tab=decisions", clubchat: "/home?feed=private", clubperf: "/club?tab=performance", propose: "/club/propose" };

export function PlusWheel({ onClose, title }: { onClose: () => void; title?: string }) {
  const label = title || "Your club";
  const router = useRouter();
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  function act(go: string) {
    onClose();
    if (go === "pick") openSheet("pick", { symbol: "NVDA" });
    else if (go === "ask" || go === "kai") openSheet("kai", { context: "NVDA" });
    else router.push(ROUTES[go] ?? "/club");
  }
  return (
    <div className="absolute inset-0 z-[44]" role="dialog" aria-label="What do you want to do?">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0" style={{ background: "radial-gradient(circle 300px at 356px 728px, rgba(46,42,33,0.45) 0%, rgba(46,42,33,0.3) 65%, rgba(46,42,33,0.1) 100%)", backdropFilter: "blur(1.5px)" }} />
      <div className="absolute right-5 bottom-[400px] text-right pointer-events-none">
        <div className="text-[14px] font-black text-cream-text" style={{ textShadow: "0 1px 8px rgba(46,42,33,0.6)" }}>{label} · What do you want to do?</div>
        <div className="text-[10px] font-extrabold text-cream-text/75" style={{ textShadow: "0 1px 6px rgba(46,42,33,0.6)" }}>tap a compartment · tap ＋ to close</div>
      </div>
      <svg width="330" height="540" viewBox="0 0 330 540" className="absolute right-[46px] bottom-[-64px] z-[45] overflow-visible motion-safe:animate-[wheelSpin_.22s_ease-out]" style={{ filter: "drop-shadow(0 -4px 22px rgba(46,42,33,0.3))", transformOrigin: "330px 330px" }}>
<path className="cursor-pointer" onClick={() => act("pick")} d="M135 393.3 A205 205 0 0 0 185 475 L289 371 A58 58 0 0 1 274.8 347.9 Z" fill="#EAF2E3" stroke="#FFFDF7" strokeWidth="4">
</path>
<text className="cursor-pointer" onClick={() => act("pick")} x="179.9" y="422" textAnchor="middle" dominantBaseline="central" fontSize="22">▲</text>
<text className="cursor-pointer" onClick={() => act("pick")} x="227.7" y="392.7" textAnchor="middle" dominantBaseline="central" transform="rotate(-31.5 227.7 392.7)" fontFamily="Nunito,sans-serif" fontSize="10" fontWeight="900" letterSpacing="0.5" fill="#3A6B3E">MAKE A PICK</text>
<path className="cursor-pointer" onClick={() => act("clubdec")} d="M127.5 297.9 A205 205 0 0 0 135 393.3 L274.8 347.9 A58 58 0 0 1 272.7 320.9 Z" fill="#FBEDD9" stroke="#FFFDF7" strokeWidth="4">
</path>
<text className="cursor-pointer" onClick={() => act("clubdec")} x="154.5" y="343.8" textAnchor="middle" dominantBaseline="central" fontSize="22">🔍</text>
<text className="cursor-pointer" onClick={() => act("clubdec")} x="210.4" y="339.4" textAnchor="middle" dominantBaseline="central" transform="rotate(-4.5 210.4 339.4)" fontFamily="Nunito,sans-serif" fontSize="10" fontWeight="900" letterSpacing="0.5" fill="#B07235">RESEARCH</text>
<path className="cursor-pointer" onClick={() => act("clubchat")} d="M164.2 209.5 A205 205 0 0 0 127.5 297.9 L272.7 320.9 A58 58 0 0 1 283.1 295.9 Z" fill="#EFEBF8" stroke="#FFFDF7" strokeWidth="4">
</path>
<text className="cursor-pointer" onClick={() => act("clubchat")} x="167.4" y="262.6" textAnchor="middle" dominantBaseline="central" fontSize="22">💬</text>
<text className="cursor-pointer" onClick={() => act("clubchat")} x="219.1" y="284.1" textAnchor="middle" dominantBaseline="central" transform="rotate(22.5 219.1 284.1)" fontFamily="Nunito,sans-serif" fontSize="10" fontWeight="900" letterSpacing="0.5" fill="#6B5CA8">ASK THE CLUB</text>
<path className="cursor-pointer" onClick={() => act("clubdec")} d="M236.9 147.3 A205 205 0 0 0 164.2 209.5 L283.1 295.9 A58 58 0 0 1 303.7 278.3 Z" fill="#F5EEE0" stroke="#FFFDF7" strokeWidth="4">
</path>
<text className="cursor-pointer" onClick={() => act("clubdec")} x="215.7" y="196.2" textAnchor="middle" dominantBaseline="central" fontSize="22">🗳</text>
<text className="cursor-pointer" onClick={() => act("clubdec")} x="252.1" y="238.8" textAnchor="middle" dominantBaseline="central" transform="rotate(49.5 252.1 238.8)" fontFamily="Nunito,sans-serif" fontSize="10" fontWeight="900" letterSpacing="0.5" fill="#8A6F3C">PROPOSAL</text>
<path className="cursor-pointer" onClick={() => act("ask")} d="M330 125 A205 205 0 0 0 236.9 147.3 L303.7 278.3 A58 58 0 0 1 330 272 Z" fill="#FFFDF4" stroke="#FFFDF7" strokeWidth="4">
</path>
<text className="cursor-pointer" onClick={() => act("ask")} x="288.9" y="158.9" textAnchor="middle" dominantBaseline="central" fontSize="22">✦</text>
<text className="cursor-pointer" onClick={() => act("ask")} x="302" y="213.3" textAnchor="middle" dominantBaseline="central" transform="rotate(76.5 302 213.3)" fontFamily="Nunito,sans-serif" fontSize="10" fontWeight="900" letterSpacing="0.5" fill="#BC9227">ASK KAI</text>
<circle cx="330" cy="330" r="58" fill="none" stroke="#FFFDF7" strokeWidth="4">
</circle>
      </svg>
      <style>{`@keyframes wheelSpin{from{transform:rotate(-24deg) scale(.85);opacity:0}to{transform:none;opacity:1}}`}</style>
    </div>
  );
}
