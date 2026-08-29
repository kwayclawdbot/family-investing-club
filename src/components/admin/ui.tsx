import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cx } from "@/components/ui";

/* ── Desktop admin primitives (FIC tokens, no phone shell) ────────────────── */

export function PageHeader({ title, sub, action, crumbs }: { title: string; sub?: string; action?: ReactNode; crumbs?: { label: string; href?: string }[] }) {
  return (
    <div className="mb-6">
      {crumbs && crumbs.length > 0 && (
        <nav className="mb-2 flex items-center gap-1.5 text-[12px] font-extrabold text-ink-3" aria-label="Breadcrumb">
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {c.href ? <Link href={c.href} className="hover:text-green">{c.label}</Link> : <span>{c.label}</span>}
              {i < crumbs.length - 1 && <span className="text-ink-4">/</span>}
            </span>
          ))}
        </nav>
      )}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[24px] font-black text-ink tracking-[-0.01em]">{title}</h1>
          {sub && <p className="mt-1 text-[13px] font-bold text-ink-3">{sub}</p>}
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>
    </div>
  );
}

export function Panel({ title, action, children, className, pad = true }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={cx("rounded-card border border-line bg-card", pad && "p-5", className)}>
      {(title || action) && (
        <div className={cx("flex items-center justify-between gap-3 mb-3", !pad && "px-5 pt-4")}>
          {title ? <h2 className="text-[11px] font-black uppercase tracking-[0.12em] text-ink-3">{title}</h2> : <span />}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: string; tone?: "green" | "orange" | "purple" | "red" }) {
  const c = tone === "green" ? "text-green" : tone === "orange" ? "text-orange-3" : tone === "purple" ? "text-purple-2" : tone === "red" ? "text-red" : "text-ink";
  return (
    <div className="rounded-card border border-line bg-card px-4 py-3.5">
      <div className={cx("text-[24px] font-black tabular-nums leading-tight", c)}>{value}</div>
      <div className="mt-1 text-[10.5px] font-black uppercase tracking-[0.1em] text-ink-3">{label}</div>
      {sub && <div className="text-[11px] font-bold text-ink-4 mt-0.5">{sub}</div>}
    </div>
  );
}

/* ── Table ────────────────────────────────────────────────────────────────── */

export function Table({ children, className, minWidth = 720 }: { children: ReactNode; className?: string; minWidth?: number }) {
  return (
    <div className={cx("overflow-x-auto rounded-card border border-line bg-card", className)}>
      <table className="w-full text-[13px] font-bold text-ink border-collapse" style={{ minWidth }}>{children}</table>
    </div>
  );
}
export function Th({ children, className, right }: { children?: ReactNode; className?: string; right?: boolean }) {
  return <th className={cx("px-3 py-2.5 text-[10.5px] font-black uppercase tracking-[0.1em] text-ink-3 bg-paper-2 border-b border-line whitespace-nowrap", right ? "text-right" : "text-left", className)}>{children}</th>;
}
export function Td({ children, className, right, muted, ...rest }: ComponentProps<"td"> & { right?: boolean; muted?: boolean }) {
  return <td className={cx("px-3 py-2.5 border-b border-paper-2 align-middle", right && "text-right tabular-nums", muted && "text-ink-3", className)} {...rest}>{children}</td>;
}
export function EmptyRow({ cols, children = "Nothing here yet." }: { cols: number; children?: ReactNode }) {
  return <tr><td colSpan={cols} className="px-3 py-10 text-center text-[13px] font-bold text-ink-3">{children}</td></tr>;
}

/* ── Chips ────────────────────────────────────────────────────────────────── */

export function Chip({ children, tone = "muted", className }: { children: ReactNode; tone?: "green" | "orange" | "purple" | "muted" | "gold" | "red" | "blue"; className?: string }) {
  const t = {
    green: "bg-green-tint text-green", orange: "bg-orange-tint text-orange-2", purple: "bg-purple-tint text-purple-2", muted: "bg-paper-2 text-ink-3",
    gold: "bg-[#FBF3DC] text-[#9A7A1F]", red: "bg-[#F8E3DE] text-red", blue: "bg-[#E3ECF8] text-[#3E6BB0]",
  }[tone];
  return <span className={cx("inline-flex items-center rounded-[6px] px-2 py-[3px] text-[10px] font-black tracking-[0.3px] uppercase whitespace-nowrap", t, className)}>{children}</span>;
}
export function TierChip({ tier }: { tier: string | null | undefined }) {
  return <Chip tone={tier === "fta" ? "gold" : tier === "fic" ? "green" : "muted"}>{tier ?? "free"}</Chip>;
}
export function RoleChip({ role }: { role: string | null | undefined }) {
  const tone = role === "admin" ? "red" : role === "coach" ? "purple" : role === "parent" ? "blue" : role === "child" ? "green" : "muted";
  return <Chip tone={tone}>{role ?? "—"}</Chip>;
}
export function KindChip({ kind }: { kind: string }) {
  return <Chip tone={kind === "fta" ? "gold" : kind === "fic" ? "green" : kind === "lead" ? "blue" : "muted"}>{kind}</Chip>;
}
export const STAGE_TONE: Record<string, "blue" | "purple" | "orange" | "green" | "muted" | "red" | "gold"> = { new: "blue", contacted: "purple", engaged: "purple", nurture: "orange", converted: "green", cold: "muted", unsubscribed: "red" };
export function StageChip({ stage }: { stage: string | null | undefined }) {
  return stage ? <Chip tone={STAGE_TONE[stage] ?? "muted"}>{stage}</Chip> : <span className="text-ink-4">—</span>;
}
export function StatusChip({ status }: { status: string | null | undefined }) {
  const tone = status === "open" ? "orange" : status === "pending" ? "gold" : status === "resolved" || status === "sent" || status === "live" || status === "completed" || status === "active" ? "green" : status === "failed" || status === "cancelled" ? "red" : status === "scheduled" || status === "sending" ? "blue" : "muted";
  return <Chip tone={tone}>{status ?? "—"}</Chip>;
}

/* ── Activity dot / avatar ────────────────────────────────────────────────── */

/** `nowMs` is passed in (server-computed) so this stays render-pure in the client tables that use it. */
export function SeenDot({ iso, nowMs }: { iso: string | null | undefined; nowMs: number }) {
  const d = iso ? (nowMs - new Date(iso).getTime()) / 86_400_000 : null;
  const c = d === null ? "bg-line-3" : d < 1 ? "bg-green-2" : d < 7 ? "bg-green-3" : d < 30 ? "bg-gold" : "bg-coral";
  return <span className={cx("inline-block w-2 h-2 rounded-full mr-2 align-middle", c)} aria-hidden />;
}
export function AdminAvatar({ name, url, size = 28 }: { name: string | null | undefined; url?: string | null; size?: number }) {
  const n = (name ?? "?").trim() || "?";
  const colors = ["bg-green-3", "bg-coral", "bg-gold", "bg-purple", "bg-orange", "bg-green-2"];
  const c = colors[n.charCodeAt(0) % colors.length];
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" width={size} height={size} className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />
  ) : (
    <span className={cx("inline-flex items-center justify-center rounded-full text-white font-black shrink-0", c)} style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }} aria-hidden>{n.slice(0, 1).toUpperCase()}</span>
  );
}

/* ── Form bits ────────────────────────────────────────────────────────────── */

export const field = "w-full h-[38px] rounded-[10px] border border-line bg-paper px-3 text-[13px] font-bold text-ink outline-none focus:border-green disabled:opacity-50";
export const textarea = "w-full min-h-[96px] rounded-[10px] border border-line bg-paper px-3 py-2 text-[13px] font-bold text-ink outline-none focus:border-green leading-[1.5]";
export function Label({ children, hint }: { children: ReactNode; hint?: string }) {
  return <label className="block mb-1 text-[11px] font-black uppercase tracking-[0.08em] text-ink-3">{children}{hint && <span className="ml-1 normal-case tracking-normal font-bold text-ink-4">{hint}</span>}</label>;
}
export function Notice({ tone = "muted", children }: { tone?: "muted" | "green" | "orange" | "red"; children: ReactNode }) {
  const t = { muted: "bg-paper-2 border-line text-ink-2", green: "bg-green-tint border-green-line text-green", orange: "bg-orange-tint border-orange-line text-orange-2", red: "bg-[#F8E3DE] border-[#EFC9C0] text-red" }[tone];
  return <div className={cx("rounded-[12px] border px-3.5 py-2.5 text-[12.5px] font-bold leading-[1.5]", t)}>{children}</div>;
}

/* ── Chip filter bar driven by search params (server-friendly) ────────────── */

export function FilterLinks({ items, value, param, base }: { items: { id: string; label: string; count?: number }[]; value: string; param: string; base: string }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="tablist">
      {items.map((it) => {
        const on = it.id === value;
        const href = it.id === "all" ? base : `${base}?${param}=${encodeURIComponent(it.id)}`;
        return (
          <Link key={it.id} href={href} role="tab" aria-selected={on} className={cx("h-[30px] px-3 rounded-[10px] text-[12px] font-extrabold inline-flex items-center gap-1.5 transition", on ? "bg-green text-cream-text" : "bg-card border border-line text-ink-3 hover:text-ink")}>
            {it.label}{typeof it.count === "number" && <span className={cx("text-[10.5px] tabular-nums", on ? "text-cream-text/80" : "text-ink-4")}>{it.count}</span>}
          </Link>
        );
      })}
    </div>
  );
}

/* ── Bar chart (pure SVG, one series) ─────────────────────────────────────── */

export function BarChart({ data, height = 140, color = "var(--green-2)" }: { data: { label: string; value: number }[]; height?: number; color?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const w = 100 / Math.max(1, data.length);
  return (
    <div className="w-full">
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" className="w-full block" style={{ height }} role="img" aria-label="Bar chart">
        {data.map((d, i) => {
          const h = (d.value / max) * (height - 4);
          return <rect key={i} x={i * w + w * 0.15} y={height - h} width={w * 0.7} height={h} rx={0.6} fill={color}><title>{`${d.label}: ${d.value}`}</title></rect>;
        })}
      </svg>
      <div className="flex justify-between mt-1.5 text-[10.5px] font-bold text-ink-4"><span>{data[0]?.label}</span><span>{data[data.length - 1]?.label}</span></div>
    </div>
  );
}

/* ── Funnel-style horizontal bars ─────────────────────────────────────────── */

export function HBar({ label, value, max, right, tone = "bg-green-2" }: { label: ReactNode; value: number; max: number; right?: ReactNode; tone?: string }) {
  return (
    <div className="py-1.5">
      <div className="flex items-center justify-between text-[12.5px] font-extrabold text-ink mb-1"><span>{label}</span><span className="tabular-nums text-ink-2">{right ?? value}</span></div>
      <div className="h-2 rounded-[4px] bg-line-2 overflow-hidden"><div className={cx("h-full rounded-[4px]", tone)} style={{ width: `${Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100))}%` }} /></div>
    </div>
  );
}
