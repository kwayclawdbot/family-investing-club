"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cx } from "@/components/ui";
import { adminApi } from "@/lib/live/client-admin";
import { VIEW_AS_ORDER, VIEW_AS_PERSONAS, type ViewAs } from "./view-as";

/** Register preview switcher. Changes the shell only — never RLS (the line below says so; keep it). */
export function ViewAsBar({ current }: { current: ViewAs | null }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const set = (v: ViewAs | null) => start(async () => {
    setErr(null);
    const r = await adminApi.viewAs(v);
    if (!r.ok) { setErr(r.error); return; }
    router.refresh();
  });
  return (
    <div className={cx("flex items-center gap-3 px-8 py-2 border-b text-[12px] font-bold", current ? "bg-purple-tint border-purple-line text-purple-2" : "bg-nav border-line-2 text-ink-3")}>
      <span className="font-black uppercase tracking-[0.1em] text-[10.5px]">View as</span>
      <div className="flex items-center gap-1" role="tablist">
        {VIEW_AS_ORDER.map((id) => {
          const on = current === id;
          return (
            <button key={id} type="button" role="tab" aria-selected={on} disabled={pending} title={VIEW_AS_PERSONAS[id].blurb} onClick={() => set(on ? null : id)}
              className={cx("h-[26px] px-2.5 rounded-[8px] text-[11.5px] font-extrabold transition", on ? "bg-purple-2 text-cream-text" : "bg-card border border-line text-ink-3 hover:text-ink")}>
              {VIEW_AS_PERSONAS[id].label}
            </button>
          );
        })}
        {current && <button type="button" disabled={pending} onClick={() => set(null)} className="ml-1 h-[26px] px-2.5 rounded-[8px] text-[11.5px] font-extrabold text-purple-2 hover:underline">Turn off</button>}
      </div>
      <span className="ml-auto text-[11px] font-bold text-ink-4">{current ? `${VIEW_AS_PERSONAS[current].blurb}. Shell only — your own data, real RLS.` : "Preview the member shell as a register (shell only, never RLS)."}</span>
      {err && <span className="text-red">{err}</span>}
    </div>
  );
}
