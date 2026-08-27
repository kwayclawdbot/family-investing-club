"use client";
import { useEffect, type ReactNode } from "react";
import { CloseIcon } from "@/components/ui/icons";

/**
 * Tall bottom sheet used by the ＋ actions (Pick, Ask, Vote, Invite, Kai).
 * Sits above the nav (z-50); Escape and backdrop close it; motion-safe slide-up.
 */
export function SheetFrame({ title, onClose, children, height = "tall" }: { title?: ReactNode; onClose: () => void; children: ReactNode; height?: "tall" | "auto" }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true" aria-label={typeof title === "string" ? title : undefined}>
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-[#2E2A21]/45" />
      <section className={`relative bg-paper rounded-t-[28px] shadow-[0_-8px_30px_rgba(46,42,33,0.25)] flex flex-col px-5 pt-[14px] motion-safe:animate-[sheetRise_.22s_ease-out] ${height === "tall" ? "h-[calc(100%-96px)]" : "max-h-[85%]"}`}>
        <div className="w-10 h-[5px] rounded-[3px] bg-[#D9CDB2] mx-auto shrink-0" />
        {title && (
          <div className="flex items-center justify-between mt-[14px] shrink-0">
            <div className="text-[18px] font-black text-ink">{title}</div>
            <button aria-label="Close" onClick={onClose} className="text-ink-4"><CloseIcon size={18} /></button>
          </div>
        )}
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar flex flex-col">{children}</div>
      </section>
      <style>{`@keyframes sheetRise{from{transform:translateY(32px);opacity:.5}to{transform:none;opacity:1}}`}</style>
    </div>
  );
}
