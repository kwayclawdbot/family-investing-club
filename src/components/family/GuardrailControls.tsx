"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cx } from "@/components/ui";
import { Toggle } from "@/components/ui/extras";
import { familyApi, type GuardrailSetting } from "@/lib/live/client-family";
import type { Guardrails, GuardrailEvent } from "@/lib/live/family";

const DAILY: { value: number | null; label: string }[] = [{ value: null, label: "No limit" }, { value: 20, label: "20m" }, { value: 30, label: "30m" }, { value: 45, label: "45m" }, { value: 60, label: "60m" }, { value: 90, label: "90m" }];
const STARTS = [19, 20, 21, 22, 23];
const ENDS = [5, 6, 7, 8, 9];
const hour = (h: number) => { const x = ((h % 24) + 24) % 24; return `${x % 12 === 0 ? 12 : x % 12} ${x < 12 ? "AM" : "PM"}`; };
const SETTING_LABEL: Record<string, string> = { chat_family_only: "Family chat only", downtime_enabled: "Downtime", downtime_start_hour: "Downtime starts", downtime_end_hour: "Downtime ends", daily_limit_min: "Daily limit", live_listen_only: "Live rooms listen-only", tz: "Household clock" };

/**
 * Guardian controls for one child. Every switch is a real write through `set_family_guardrail` (parent/admin of
 * the household; logged; the other parent is notified). A refused write snaps back and says why.
 */
export function GuardrailControls({ childName, initial, events }: { childName: string; initial: Guardrails; events: GuardrailEvent[] }) {
  const router = useRouter();
  const [g, setG] = useState<Guardrails>(initial);
  const [busy, setBusy] = useState<GuardrailSetting | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function write(setting: GuardrailSetting, value: boolean | number | string | null) {
    const prev = g;
    setErr(null); setBusy(setting);
    setG({ ...g, [setting]: value } as Guardrails);
    const r = await familyApi.guardrail(g.child_id, setting, value);
    setBusy(null);
    if (!r.ok) { setG(prev); setErr(`${r.error}. Nothing was changed.`); return; }
    setG(r.guardrails as unknown as Guardrails);
    setSaved(true); setTimeout(() => setSaved(false), 1500);
    router.refresh();
  }
  const row = (i: number, n: number) => cx("py-3", i < n - 1 && "border-b border-paper-2");

  return (
    <div>
      <div className="bg-purple-tint border border-purple-line rounded-card px-4 py-1">
        <div className={cx(row(0, 5), "flex items-center gap-3")}>
          <div className="flex-1"><div className="text-[13.5px] font-extrabold text-ink">Practice money only</div><div className="text-[11.5px] font-bold text-ink-3">There is no real-money order path in FIC — always on.</div></div>
          <span className="rounded-[6px] bg-card px-2 py-[3px] text-[10px] font-extrabold text-purple-2">ALWAYS</span>
        </div>
        <div className={cx(row(1, 5), "flex items-center gap-3")}>
          <div className="flex-1"><div className="text-[13.5px] font-extrabold text-ink">Chat: family only</div><div className="text-[11.5px] font-bold text-ink-3">No public rooms or feed posts for {childName}. The family club stays open.</div></div>
          <Toggle checked={g.chat_family_only} onChange={(v) => write("chat_family_only", v)} label={`Chat family only for ${childName}`} />
        </div>
        <div className={cx(row(2, 5), "flex items-center gap-3")}>
          <div className="flex-1"><div className="text-[13.5px] font-extrabold text-ink">Live rooms: listen only</div><div className="text-[11.5px] font-bold text-ink-3">Recorded now, enforced the day live audio ships.</div></div>
          <Toggle checked={g.live_listen_only} onChange={(v) => write("live_listen_only", v)} label={`Live rooms listen-only for ${childName}`} />
        </div>
        <div className={row(3, 5)}>
          <div className="flex items-center gap-3">
            <div className="flex-1"><div className="text-[13.5px] font-extrabold text-ink">Downtime</div><div className="text-[11.5px] font-bold text-ink-3">Posting, votes and practice trades pause overnight ({g.tz.replace("_", " ")}).</div></div>
            <Toggle checked={g.downtime_enabled} onChange={(v) => write("downtime_enabled", v)} label={`Downtime for ${childName}`} />
          </div>
          {g.downtime_enabled && (
            <div className="mt-2 flex gap-3">
              {[["Starts", STARTS, "downtime_start_hour", g.downtime_start_hour], ["Ends", ENDS, "downtime_end_hour", g.downtime_end_hour]].map(([label, opts, key, cur]) => (
                <div key={label as string} className="flex-1">
                  <div className="text-[10px] font-black text-purple-2 tracking-[0.5px]">{(label as string).toUpperCase()}</div>
                  <div className="mt-1 flex gap-1" role="radiogroup" aria-label={`Downtime ${(label as string).toLowerCase()}`}>
                    {(opts as number[]).map((h) => (
                      <button key={h} type="button" role="radio" aria-checked={cur === h} disabled={busy !== null} onClick={() => write(key as GuardrailSetting, h)}
                        className={cx("flex-1 h-[28px] rounded-[8px] text-[10px] font-extrabold", cur === h ? "bg-purple-2 text-cream-text" : "bg-card border border-purple-line text-ink-3")}>{hour(h)}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className={row(4, 5)}>
          <div className="text-[13.5px] font-extrabold text-ink">Daily limit</div>
          <div className="text-[11.5px] font-bold text-ink-3">Minutes of family surfaces a day. Once reached, writes pause until tomorrow.</div>
          <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Daily limit">
            {DAILY.map((d) => (
              <button key={String(d.value)} type="button" role="radio" aria-checked={g.daily_limit_min === d.value} disabled={busy !== null} onClick={() => write("daily_limit_min", d.value)}
                className={cx("flex-1 h-[28px] rounded-[8px] text-[10px] font-extrabold", g.daily_limit_min === d.value ? "bg-purple-2 text-cream-text" : "bg-card border border-purple-line text-ink-3")}>{d.label}</button>
            ))}
          </div>
        </div>
      </div>
      {err && <p className="mt-2 text-[12px] font-bold text-red" role="alert">{err}</p>}
      {saved && <p className="mt-2 text-[12px] font-bold text-green" role="status">Saved — logged, and the other parent is notified.</p>}
      <p className="mt-2 text-[11px] font-bold text-ink-4">Only parents can change these · changes are logged · both parents are notified.</p>
      {events.length > 0 && (
        <div className="mt-3 bg-card border border-line rounded-card px-4 py-1">
          <div className="py-2 text-[11px] font-black text-ink-3 tracking-[0.5px]">RECENT CHANGES</div>
          {events.map((e, i) => (
            <div key={e.id} className={cx("flex items-center gap-3 py-2", i < events.length - 1 && "border-b border-paper-2")}>
              <span className="flex-1 text-[12.5px] font-extrabold text-ink">{SETTING_LABEL[e.setting] ?? e.setting} → {String(e.newValue ?? "—")}</span>
              <span className="text-[11px] font-bold text-ink-3">{e.actor} · {e.ago}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
