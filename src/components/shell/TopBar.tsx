"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { ChevronLeft } from "@/components/ui/icons";

/** Header with back control — used on detail screens. */
export function TopBar({
  title,
  right,
  backHref,
  transparent,
}: { title?: ReactNode; right?: ReactNode; backHref?: string; transparent?: boolean }) {
  const router = useRouter();
  const back = (
    <span className="w-9 h-9 rounded-full bg-card border border-line flex items-center justify-center text-ink-2">
      <ChevronLeft />
    </span>
  );
  return (
    <header className={`flex items-center justify-between px-[18px] pt-[calc(14px+env(safe-area-inset-top))] pb-2 ${transparent ? "" : "bg-paper"}`}>
      {backHref ? (
        <Link href={backHref} aria-label="Back">{back}</Link>
      ) : (
        <button onClick={() => router.back()} aria-label="Back">{back}</button>
      )}
      {title ? <div className="text-[15px] font-black text-ink">{title}</div> : <span />}
      <div className="min-w-9 flex justify-end">{right}</div>
    </header>
  );
}
