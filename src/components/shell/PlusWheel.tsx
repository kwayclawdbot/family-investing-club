"use client";
import Link from "next/link";
/** Placeholder until the SHELL lane builds the quarter-wheel from artboard 06. */
const ITEMS = [
  { label: "Make a Pick", href: "/club/pick/new" },
  { label: "Research", href: "/club/research" },
  { label: "Ask the Club", href: "/club" },
  { label: "Proposal", href: "/club/propose" },
  { label: "Share Idea", href: "/club/new" },
];
export function PlusWheel({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-[44]" role="dialog" aria-label="What do you want to do?">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-[#2E2A21]/40" />
      <div className="absolute right-[18px] bottom-[190px] flex flex-col gap-2 items-end">
        {ITEMS.map((it) => (
          <Link key={it.href} href={it.href} onClick={onClose} className="rounded-[12px] bg-card border border-line px-4 h-10 flex items-center text-[12px] font-black text-ink">{it.label}</Link>
        ))}
      </div>
    </div>
  );
}
