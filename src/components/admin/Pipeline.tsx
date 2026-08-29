"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, cx } from "@/components/ui";
import { adminApi } from "@/lib/live/client-admin";
import type { Lead, LeadDetail } from "@/lib/live/admin-crm";
import { Chip, Label, Notice, Panel, STAGE_TONE, StageChip, field, textarea } from "./ui";

const STAGES = ["new", "contacted", "engaged", "nurture", "converted", "cold"] as const;
const ALL = [...STAGES, "unsubscribed"] as const;
const name = (l: { first_name: string | null; last_name: string | null; email: string }) => [l.first_name, l.last_name].filter(Boolean).join(" ").trim() || l.email;
const rel = (iso: string | null) => { if (!iso) return "—"; const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000); return d < 1 ? "today" : `${d}d`; };

function StageSelect({ leadId, stage, onDone }: { leadId: string; stage: string; onDone?: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <select value={stage} disabled={busy} aria-label="Stage" onChange={async (e) => { setBusy(true); const r = await adminApi.setStage(leadId, e.target.value); setBusy(false); if (r.ok) { router.refresh(); onDone?.(); } else alert(r.error); }}
      className="h-[26px] rounded-[8px] border border-line bg-paper px-1.5 text-[11px] font-extrabold text-ink-2">
      {ALL.map((s) => <option key={s} value={s}>{s}</option>)}
    </select>
  );
}

/** Kanban over FTA `admin_marketing_leads`; stage moves via `admin_marketing_set_stage`. */
export function Pipeline({ leads, selected }: { leads: Lead[]; selected: string | null }) {
  const [q, setQ] = useState("");
  const s = q.trim().toLowerCase();
  const vis = leads.filter((l) => !s || name(l).toLowerCase().includes(s) || l.email.toLowerCase().includes(s) || l.tags.some((t) => t.toLowerCase().includes(s)));
  return (
    <div className="space-y-3">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by name, email or tag…" className={cx(field, "max-w-[320px]")} aria-label="Filter leads" />
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-3" style={{ minWidth: STAGES.length * 236 }}>
          {STAGES.map((st) => {
            const col = vis.filter((l) => l.stage === st);
            return (
              <div key={st} className="w-[224px] shrink-0 rounded-card border border-line bg-paper-2/60 p-2">
                <div className="flex items-center justify-between px-1 pb-2"><Chip tone={STAGE_TONE[st]}>{st}</Chip><span className="text-[11px] font-black text-ink-3 tabular-nums">{col.length}</span></div>
                <div className="space-y-2 max-h-[62vh] overflow-y-auto pr-0.5">
                  {col.length === 0 && <div className="text-[11.5px] font-bold text-ink-4 px-1 py-3 text-center">Empty</div>}
                  {col.map((l) => (
                    <div key={l.id} className={cx("rounded-[12px] border bg-card p-2.5", selected === l.id ? "border-green" : "border-line")}>
                      <Link href={`/admin/pipeline?lead=${l.id}`} scroll={false} className="block text-[12.5px] font-extrabold text-ink truncate hover:text-green">{name(l)}</Link>
                      <div className="text-[11px] font-bold text-ink-3 truncate">{l.email}</div>
                      <div className="mt-1.5 flex items-center justify-between gap-2">
                        <span className="text-[10.5px] font-bold text-ink-4">{l.source} · {rel(l.last_activity_at)}{l.is_cold ? " · cold" : ""}</span>
                        <StageSelect leadId={l.id} stage={l.stage} />
                      </div>
                      {l.tags.length > 0 && <div className="mt-1.5 flex flex-wrap gap-1">{l.tags.slice(0, 4).map((t) => <span key={t} className="rounded-[5px] bg-paper-2 px-1.5 py-[2px] text-[9.5px] font-black text-ink-3">{t}</span>)}</div>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Detail pane: notes / tags edit (`admin_marketing_update_lead`) + event timeline. */
export function LeadEditor({ detail }: { detail: LeadDetail }) {
  const router = useRouter();
  const l = detail.lead;
  const [notes, setNotes] = useState(l?.notes ?? "");
  const [tags, setTags] = useState((l?.tags ?? []).join(", "));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "green" | "red"; text: string } | null>(null);
  if (!l) return <Panel title="Lead"><p className="text-[13px] font-bold text-ink-3">Lead not found.</p></Panel>;
  const save = async () => {
    setBusy(true); setMsg(null);
    const r = await adminApi.updateLead({ leadId: l.id, notes: notes.trim() || null, tags: tags.split(",").map((t) => t.trim()).filter(Boolean) });
    setBusy(false);
    if (!r.ok) { setMsg({ tone: "red", text: r.error }); return; }
    setMsg({ tone: "green", text: "Saved." }); router.refresh();
  };
  return (
    <Panel title="Lead" action={<Link href="/admin/pipeline" scroll={false} className="text-[12px] font-extrabold text-ink-3 hover:text-ink">Close</Link>}>
      <div className="text-[16px] font-black text-ink">{name(l)}</div>
      <div className="text-[12.5px] font-bold text-ink-3">{l.email}{l.phone ? ` · ${l.phone}` : ""}</div>
      <div className="mt-2 flex items-center gap-2"><StageChip stage={l.stage} /><Chip>{l.source}</Chip>{l.converted_profile_id && <Link href={`/admin/members/${l.converted_profile_id}`} className="text-[11.5px] font-extrabold text-green hover:underline">Member profile →</Link>}</div>
      <div className="mt-3"><Label>Stage</Label><StageSelect leadId={l.id} stage={l.stage} /></div>
      <div className="mt-3"><Label hint="comma-separated">Tags</Label><input value={tags} onChange={(e) => setTags(e.target.value)} className={field} /></div>
      <div className="mt-3"><Label>Notes</Label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={textarea} /></div>
      {msg && <div className="mt-2"><Notice tone={msg.tone}>{msg.text}</Notice></div>}
      <div className="mt-2 flex justify-end"><Button size="sm" variant="green" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</Button></div>
      <h3 className="mt-5 mb-2 text-[11px] font-black uppercase tracking-[0.12em] text-ink-3">Timeline</h3>
      <ul className="space-y-1.5 max-h-[320px] overflow-y-auto">
        {detail.events.length === 0 && <li className="text-[12px] font-bold text-ink-4">No events yet.</li>}
        {detail.events.map((e) => (
          <li key={e.id} className="flex items-start gap-2 text-[12px] font-bold"><Chip className="mt-[1px]">{e.type}</Chip><span className="text-ink-3">{new Date(e.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>{e.meta && Object.keys(e.meta).length > 0 && <span className="text-ink-4 truncate">{JSON.stringify(e.meta)}</span>}</li>
        ))}
      </ul>
    </Panel>
  );
}
