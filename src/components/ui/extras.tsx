"use client";
import Link from "next/link";
import { useEffect, useId, useState, type ReactNode } from "react";
import { cx } from "./index";
import { ChevronRight, CloseIcon } from "./icons";

/* ── Empty state (honest, never fake data) ────────────────────────── */
export function EmptyState({ emoji = "🌱", title, body, action, href }: { emoji?: string; title: string; body?: string; action?: string; href?: string }) {
  return (
    <div className="rounded-card border border-line bg-card px-5 py-8 text-center">
      <div className="text-[28px]" aria-hidden>{emoji}</div>
      <div className="mt-2 text-[15px] font-black text-ink">{title}</div>
      {body && <p className="mt-1 text-[13px] font-bold text-ink-3 leading-[1.5]">{body}</p>}
      {action && href && (
        <Link href={href} className="inline-flex mt-4 h-[36px] px-4 items-center rounded-[12px] bg-green text-cream-text text-[13px] font-black">{action}</Link>
      )}
    </div>
  );
}

/* ── Toggle (role=switch) ─────────────────────────────────────────── */
export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label?: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx("relative w-[46px] h-[28px] rounded-full transition shrink-0", checked ? "bg-green-2" : "bg-line-3", disabled && "opacity-40")}
    >
      <span className={cx("absolute top-[3px] w-[22px] h-[22px] rounded-full bg-white shadow transition-all", checked ? "left-[21px]" : "left-[3px]")} />
    </button>
  );
}

/* ── Link row (settings-style list item) ──────────────────────────── */
export function LinkRow({ href, icon, title, value, sub, last, onClick, danger }: { href?: string; icon?: ReactNode; title: string; value?: string; sub?: string; last?: boolean; onClick?: () => void; danger?: boolean }) {
  const inner = (
    <>
      {icon && <span className="w-8 h-8 rounded-[10px] bg-paper-2 flex items-center justify-center text-[15px] shrink-0">{icon}</span>}
      <span className="flex-1 min-w-0">
        <span className={cx("block text-[13.5px] font-extrabold truncate", danger ? "text-red" : "text-ink")}>{title}</span>
        {sub && <span className="block text-[11.5px] font-bold text-ink-3 truncate">{sub}</span>}
      </span>
      {value && <span className="text-[12.5px] font-extrabold text-ink-3">{value}</span>}
      {!danger && <ChevronRight className="text-ink-4" />}
    </>
  );
  const cls = cx("flex items-center gap-3 py-3 w-full text-left", !last && "border-b border-paper-2");
  return href ? <Link href={href} className={cls}>{inner}</Link> : <button type="button" onClick={onClick} className={cls}>{inner}</button>;
}

/* ── Bottom sheet ─────────────────────────────────────────────────── */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title?: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-[#2E2A21]/40" />
      <div className="relative bg-card rounded-t-[24px] px-[18px] pt-3 pb-[calc(24px+env(safe-area-inset-bottom))] max-h-[85%] overflow-y-auto no-scrollbar motion-safe:animate-[sheetUp_.22s_ease-out]">
        <div className="mx-auto w-10 h-[5px] rounded-full bg-line-3" />
        <div className="flex items-center justify-between mt-3 mb-2">
          {title ? <div className="text-[16px] font-black text-ink">{title}</div> : <span />}
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full bg-paper-2 flex items-center justify-center text-ink-2"><CloseIcon size={14} /></button>
        </div>
        {children}
      </div>
      <style>{`@keyframes sheetUp{from{transform:translateY(24px);opacity:.6}to{transform:none;opacity:1}}`}</style>
    </div>
  );
}

/* ── Concept chip with tap-to-learn definition ────────────────────── */
export function ConceptChip({ label, definition, lessonHref, tone = "green" }: { label: string; definition: string; lessonHref?: string; tone?: "green" | "purple" | "orange" }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const t = { green: "bg-green-tint text-green", purple: "bg-purple-tint text-purple-2", orange: "bg-orange-tint text-orange-2" }[tone];
  return (
    <>
      <button type="button" aria-describedby={id} onClick={() => setOpen(true)} className={cx("inline-flex items-center rounded-[6px] px-2 py-[3px] text-[10px] font-extrabold tracking-[0.3px] uppercase", t)}>
        {label}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={label}>
        <p id={id} className="text-[14px] font-bold text-ink-2 leading-[1.55]">{definition}</p>
        {lessonHref && (
          <Link href={lessonHref} className="inline-flex mt-4 h-[40px] px-4 items-center rounded-[12px] bg-green text-cream-text text-[13px] font-black">Learn this concept →</Link>
        )}
      </Sheet>
    </>
  );
}

/* ── Stat tile ────────────────────────────────────────────────────── */
export function StatTile({ value, label, tone }: { value: ReactNode; label: string; tone?: "green" | "orange" | "purple" }) {
  const c = tone === "green" ? "text-green" : tone === "orange" ? "text-orange-3" : tone === "purple" ? "text-purple-2" : "text-ink";
  return (
    <div className="flex-1 rounded-[14px] border border-line bg-card px-2 py-3 text-center">
      <div className={cx("text-[18px] font-black", c)}>{value}</div>
      <div className="text-[10px] font-extrabold text-ink-3 tracking-[0.3px] uppercase mt-[2px]">{label}</div>
    </div>
  );
}
