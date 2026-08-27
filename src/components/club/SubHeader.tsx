import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft } from "@/components/ui/icons";

/** Back · title · right — for Club sub-pages inside the tab shell (Content already pads 18px). */
export function SubHeader({ backHref, title, right }: { backHref: string; title?: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between pt-[14px] pb-2">
      <Link href={backHref} aria-label="Back" className="w-9 h-9 rounded-full bg-card border border-line flex items-center justify-center text-ink-2">
        <ChevronLeft />
      </Link>
      {title ? <div className="text-[15px] font-black text-ink truncate px-2">{title}</div> : <span />}
      <div className="min-w-9 flex justify-end items-center gap-2">{right}</div>
    </div>
  );
}
