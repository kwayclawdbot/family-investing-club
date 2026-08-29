/** Small surface atoms the ported games expect, expressed in FIC's tokens. */
import Link from "next/link";
import type { ReactNode } from "react";

export function EmptyLine({ title, body, action }: { title: string; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className="club-b-card mt-6 px-5 py-8 text-center">
      <div className="text-[15px] font-black text-ink">{title}</div>
      {body && <div className="mt-1 text-[12.5px] font-bold text-soft leading-[1.5]">{body}</div>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function TextAction({ href, onClick, children }: { href?: string; onClick?: () => void; children: ReactNode }) {
  const cls = "text-[13px] font-black text-green";
  return href ? <Link href={href} className={cls}>{children}</Link> : <button type="button" onClick={onClick} className={cls}>{children}</button>;
}

/** Conic score dial (FTA's board `Dial`). */
export function Dial({ pct, value, label, size = 64, title }: { pct: number; value: string; label: string; size?: number; title?: string }) {
  const p = Math.max(0, Math.min(100, Math.round(pct)));
  return (
    <div className="shrink-0 text-center" title={title}>
      <div className="relative flex items-center justify-center rounded-full" style={{ width: size, height: size, background: `conic-gradient(#4C8C4A ${p * 3.6}deg, #E4DAC4 0deg)` }}>
        <span className="flex items-center justify-center rounded-full bg-card" style={{ width: size - 12, height: size - 12 }}>
          <span className="text-[12px] font-black text-ink">{value}</span>
        </span>
      </div>
      <div className="mt-1 text-[8.5px] font-black tracking-[0.4px] text-soft">{label}</div>
    </div>
  );
}
