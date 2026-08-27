"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { openSheet } from "@/components/sheets/bus";

/**
 * Artboard 06 — the universal ＋ quarter-wheel: five wedge compartments spun out of the bottom-right ＋.
 * MAKE A PICK ▲ · RESEARCH 🔍 · ASK THE CLUB 💬 · PROPOSAL 🗳 · SHARE IDEA 💡
 * Small actions open as sheets; destinations route. Escape / backdrop / ＋ close it.
 */
type Wedge = { id: string; label: string; emoji: string; fill: string; ink: string; path: string; emojiAt: [number, number]; labelAt: [number, number]; rot: number; run: (r: ReturnType<typeof useRouter>) => void };

const WEDGES: Wedge[] = [
  { id: "pick", label: "MAKE A PICK", emoji: "▲", fill: "#EAF2E3", ink: "#3A6B3E", path: "M135 393.3 A205 205 0 0 0 185 475 L289 371 A58 58 0 0 1 274.8 347.9 Z", emojiAt: [179.9, 422], labelAt: [227.7, 392.7], rot: -31.5, run: () => openSheet("pick") },
  { id: "research", label: "RESEARCH", emoji: "🔍", fill: "#FBEDD9", ink: "#B07235", path: "M127.5 297.9 A205 205 0 0 0 135 393.3 L274.8 347.9 A58 58 0 0 1 272.7 320.9 Z", emojiAt: [154.5, 343.8], labelAt: [210.4, 339.4], rot: -4.5, run: (r) => r.push("/club/research") },
  { id: "ask", label: "ASK THE CLUB", emoji: "💬", fill: "#EFEBF8", ink: "#6B5CA8", path: "M164.2 209.5 A205 205 0 0 0 127.5 297.9 L272.7 320.9 A58 58 0 0 1 283.1 295.9 Z", emojiAt: [167.4, 262.6], labelAt: [219.1, 284.1], rot: 22.5, run: () => openSheet("ask") },
  { id: "proposal", label: "PROPOSAL", emoji: "🗳", fill: "#F5EEE0", ink: "#8A6F3C", path: "M236.9 147.3 A205 205 0 0 0 164.2 209.5 L283.1 295.9 A58 58 0 0 1 303.7 278.3 Z", emojiAt: [215.7, 196.2], labelAt: [252.1, 238.8], rot: 49.5, run: (r) => r.push("/club/propose") },
  { id: "idea", label: "SHARE IDEA", emoji: "💡", fill: "#FFFDF4", ink: "#BC9227", path: "M330 125 A205 205 0 0 0 236.9 147.3 L303.7 278.3 A58 58 0 0 1 330 272 Z", emojiAt: [288.9, 158.9], labelAt: [302, 213.3], rot: 76.5, run: (r) => r.push("/club/new") },
];

export function PlusWheel({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const firstRef = useRef<SVGGElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    firstRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function choose(w: Wedge) {
    onClose();
    w.run(router);
  }

  return (
    <div className="absolute inset-0 z-[44]" role="dialog" aria-modal="true" aria-label="What do you want to do?">
      {/* dimmed + blurred page, radial from the ＋ */}
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 backdrop-blur-[1.5px] backdrop-saturate-[.9]"
        style={{ background: "radial-gradient(circle 300px at calc(100% - 46px) calc(100% - 146px), rgba(46,42,33,0.45) 0%, rgba(46,42,33,0.3) 65%, rgba(46,42,33,0.1) 100%)" }}
      />
      <div className="absolute right-5 bottom-[400px] z-[46] text-right pointer-events-none">
        <div className="text-[14px] font-black text-cream-text [text-shadow:0_1px_8px_rgba(46,42,33,0.6)]">What do you want to do?</div>
        <div className="text-[10px] font-extrabold text-cream-text/75 [text-shadow:0_1px_6px_rgba(46,42,33,0.6)]">tap a compartment · tap ＋ to close</div>
      </div>
      <svg
        width="330" height="540" viewBox="0 0 330 540"
        className="absolute right-[46px] bottom-[-64px] z-[45] overflow-visible motion-safe:animate-[wheelSpin_.22s_ease-out] [filter:drop-shadow(0_-4px_22px_rgba(46,42,33,0.3))]"
        style={{ transformOrigin: "330px 330px" }}
      >
        {WEDGES.map((w, i) => (
          <g
            key={w.id}
            ref={i === 0 ? firstRef : undefined}
            role="button"
            tabIndex={0}
            aria-label={w.label.charAt(0) + w.label.slice(1).toLowerCase()}
            className="cursor-pointer outline-none focus-visible:[filter:brightness(.95)]"
            onClick={() => choose(w)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(w); } }}
          >
            <path d={w.path} fill={w.fill} stroke="#FFFDF7" strokeWidth={4} />
            <text x={w.emojiAt[0]} y={w.emojiAt[1]} textAnchor="middle" dominantBaseline="central" fontSize={22}>{w.emoji}</text>
            <text x={w.labelAt[0]} y={w.labelAt[1]} textAnchor="middle" dominantBaseline="central" transform={`rotate(${w.rot} ${w.labelAt[0]} ${w.labelAt[1]})`} fontFamily="Nunito, sans-serif" fontSize={10} fontWeight={900} letterSpacing={0.5} fill={w.ink}>{w.label}</text>
          </g>
        ))}
        <circle cx={330} cy={330} r={58} fill="none" stroke="#FFFDF7" strokeWidth={4} />
        <path d="M179.4 480.6 A213 213 0 0 1 330 117" fill="none" stroke="rgba(255,253,247,0.65)" strokeWidth={2} strokeDasharray="2 7" />
      </svg>
      <style>{`@keyframes wheelSpin{from{transform:rotate(38deg) scale(.82);opacity:0}to{transform:none;opacity:1}}`}</style>
    </div>
  );
}
