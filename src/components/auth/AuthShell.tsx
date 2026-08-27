import Link from "next/link";
import type { ReactNode } from "react";
import { TopBar } from "@/components/shell/TopBar";

export const field = "w-full h-[50px] rounded-[14px] border border-line bg-card px-4 text-[15px] font-bold text-ink placeholder:text-ink-4 outline-none focus:border-green";

export function AuthShell({ backHref, title, sub, children, footer }: { backHref: string; title: string; sub?: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <>
      <TopBar backHref={backHref} />
      <div className="px-[22px] pt-4 flex-1 flex flex-col overflow-y-auto no-scrollbar">
        <Link href="/welcome" className="w-14 h-14 rounded-[18px] bg-green text-cream-text font-black text-[18px] flex items-center justify-center">FIC</Link>
        <h1 className="mt-5 text-[26px] font-black text-ink leading-tight">{title}</h1>
        {sub && <p className="mt-1 text-[14px] font-bold text-ink-3">{sub}</p>}
        <div className="mt-6">{children}</div>
        {footer && <p className="mt-auto pt-6 pb-8 text-center text-[13px] font-bold text-ink-3">{footer}</p>}
      </div>
    </>
  );
}
