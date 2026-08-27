import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { ChevronRight } from "./icons";

export function cx(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(" ");
}

/* ── Card ─────────────────────────────────────────────────────────── */
export function Card({
  className,
  children,
  tone = "card",
  ...rest
}: ComponentProps<"div"> & { tone?: "card" | "orange" | "green" | "purple" | "paper" }) {
  const tones = {
    card: "bg-card border-line",
    orange: "bg-orange-tint border-orange-line",
    green: "bg-green-tint border-green-line",
    purple: "bg-purple-tint border-purple-line",
    paper: "bg-paper-2 border-line",
  };
  return (
    <div className={cx("rounded-card border p-4", tones[tone], className)} {...rest}>
      {children}
    </div>
  );
}

/* ── Button ───────────────────────────────────────────────────────── */
type BtnProps = {
  variant?: "primary" | "green" | "purple" | "secondary" | "ghost";
  size?: "lg" | "md" | "sm";
  full?: boolean;
  className?: string;
  children: ReactNode;
};
const btnBase =
  "inline-flex items-center justify-center font-black rounded-btn transition active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100";
const btnVariant = {
  primary: "bg-orange text-cream-text",
  green: "bg-green text-cream-text",
  purple: "bg-purple-2 text-cream-text",
  secondary: "bg-card text-ink border border-line",
  ghost: "bg-transparent text-green",
};
const btnSize = {
  lg: "h-[52px] px-6 text-[16px] rounded-[16px]",
  md: "h-[40px] px-[18px] text-[13.5px] rounded-[12px]",
  sm: "h-[30px] px-3 text-[12px] rounded-[10px]",
};
export function Button({
  variant = "primary",
  size = "lg",
  full,
  className,
  children,
  ...rest
}: BtnProps & Omit<ComponentProps<"button">, "children">) {
  return (
    <button
      className={cx(btnBase, btnVariant[variant], btnSize[size], full && "w-full", className)}
      {...rest}
    >
      {children}
    </button>
  );
}
export function ButtonLink({
  variant = "primary",
  size = "lg",
  full,
  className,
  children,
  ...rest
}: BtnProps & ComponentProps<typeof Link>) {
  return (
    <Link
      className={cx(btnBase, btnVariant[variant], btnSize[size], full && "w-full", className)}
      {...rest}
    >
      {children}
    </Link>
  );
}

/* ── Progress bar ─────────────────────────────────────────────────── */
export function ProgressBar({
  value,
  color = "bg-green-2",
  height = 7,
  className,
}: { value: number; color?: string; height?: number; className?: string }) {
  return (
    <div
      className={cx("w-full rounded-[4px] bg-line-2 overflow-hidden", className)}
      style={{ height }}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className={cx("h-full rounded-[4px]", color)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

/* ── Section header ───────────────────────────────────────────────── */
export function SectionHeader({
  title,
  action,
  href,
  className,
}: { title: string; action?: string; href?: string; className?: string }) {
  return (
    <div className={cx("flex items-center justify-between mt-4 mb-2", className)}>
      <h2 className="text-[15px] font-black text-ink">{title}</h2>
      {action && href ? (
        <Link href={href} className="text-[12px] font-extrabold text-green">
          {action}
        </Link>
      ) : action ? (
        <span className="text-[12px] font-extrabold text-green">{action}</span>
      ) : (
        <ChevronRight className="text-ink-4" />
      )}
    </div>
  );
}

/* ── Avatar ───────────────────────────────────────────────────────── */
const avatarColors = ["bg-green-3", "bg-coral", "bg-gold", "bg-purple", "bg-orange", "bg-green-2"];
export function Avatar({
  name,
  color,
  size = 30,
  className,
}: { name: string; color?: string; size?: number; className?: string }) {
  const c = color ?? avatarColors[name.charCodeAt(0) % avatarColors.length];
  return (
    <span
      className={cx("inline-flex items-center justify-center rounded-full text-white font-black shrink-0", c, className)}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
      aria-hidden
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

/* ── Chip / Tag ───────────────────────────────────────────────────── */
export function Tag({
  children,
  tone = "green",
  className,
}: { children: ReactNode; tone?: "green" | "orange" | "purple" | "muted" | "gold"; className?: string }) {
  const t = {
    green: "bg-green-tint text-green",
    orange: "bg-orange-tint text-orange-2",
    purple: "bg-purple-tint text-purple-2",
    muted: "bg-paper-2 text-ink-3",
    gold: "bg-[#FBF3DC] text-[#9A7A1F]",
  };
  return (
    <span className={cx("inline-flex items-center rounded-[6px] px-2 py-[3px] text-[10px] font-extrabold tracking-[0.3px]", t[tone], className)}>
      {children}
    </span>
  );
}

/* ── Segmented control ────────────────────────────────────────────── */
export function Segmented({
  items,
  value,
  onChange,
  tone = "green",
  className,
}: {
  items: string[];
  value: string;
  onChange?: (v: string) => void;
  tone?: "green" | "orange" | "purple";
  className?: string;
}) {
  const active = { green: "bg-green text-cream-text", orange: "bg-orange text-cream-text", purple: "bg-purple-2 text-cream-text" }[tone];
  return (
    <div className={cx("flex gap-[6px]", className)} role="tablist">
      {items.map((it) => (
        <button
          key={it}
          role="tab"
          aria-selected={it === value}
          onClick={() => onChange?.(it)}
          className={cx(
            "h-[30px] px-[13px] rounded-[10px] text-[12px] font-extrabold transition",
            it === value ? active : "bg-card border border-line text-ink-3"
          )}
        >
          {it}
        </button>
      ))}
    </div>
  );
}

/* ── Placeholder art (until the v2 vector set lands) ──────────────── */
export function ArtPlaceholder({
  label = "v2 art",
  className,
  round,
}: { label?: string; className?: string; round?: boolean }) {
  return (
    <div className={cx("art-placeholder flex items-center justify-center text-[8.5px]", round ? "rounded-full" : "rounded-[14px]", className)}>
      {label}
    </div>
  );
}

/* ── Row (list item) ──────────────────────────────────────────────── */
export function Row({ children, className, last }: { children: ReactNode; className?: string; last?: boolean }) {
  return (
    <div className={cx("flex items-center gap-[11px] py-[9px]", !last && "border-b border-paper-2", className)}>{children}</div>
  );
}
