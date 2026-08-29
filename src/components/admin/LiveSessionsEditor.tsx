"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, cx } from "@/components/ui";
import { adminApi } from "@/lib/live/client-admin";
import type { SessionRow } from "@/lib/live/admin-crm";
import { Chip, EmptyRow, Label, Notice, Panel, StatusChip, Table, Td, Th, field, textarea } from "./ui";

const STATUS = ["scheduled", "live", "completed", "cancelled"];
const TRACKS = [{ v: "all", l: "Whole family" }, { v: "kids", l: "Kids Corner" }, { v: "teens", l: "Teens" }, { v: "adults", l: "Parents & adults" }];
const CLASS = [{ v: "", l: "— none —" }, { v: "free_class", l: "Free class (public funnel)" }, { v: "weekly_class", l: "Weekly family stock class" }, { v: "guest_speaker", l: "Guest speaker" }, { v: "orientation", l: "Orientation" }, { v: "parent_qa", l: "Parent Q&A" }, { v: "kids_money_lab", l: "Kids Money Lab" }, { v: "market_recap", l: "Market recap" }];
const TIERS = ["free", "challenge", "academy"];

type F = { title: string; description: string; scheduled_at: string; duration_min: number; zoom_join_url: string; recording_url: string; status: string; track: string; min_tier: string; class_type: string; worksheet_url: string; assignment: string; host_name: string };
const toLocal = (iso: string | null) => { if (!iso) return ""; const d = new Date(iso); const p = (n: number) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };
const form = (s?: SessionRow): F => ({ title: s?.title ?? "", description: s?.description ?? "", scheduled_at: toLocal(s?.scheduled_at ?? null), duration_min: s?.duration_min ?? 60, zoom_join_url: s?.zoom_join_url ?? "", recording_url: s?.recording_url ?? "", status: s?.status ?? "scheduled", track: s?.track ?? "all", min_tier: s?.min_tier ?? "challenge", class_type: s?.class_type ?? "", worksheet_url: s?.worksheet_url ?? "", assignment: s?.assignment ?? "", host_name: s?.host_name ?? "" });
const when = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—");

export function LiveSessionsEditor({ sessions }: { sessions: SessionRow[] }) {
  const router = useRouter();
  const [edit, setEdit] = useState<{ id?: string; f: F } | null>(null);
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null);
  const list = sessions.filter((s) => filter === "all" || s.status === filter);
  const save = async () => {
    if (!edit) return; setBusy(true); setErr(null);
    const r = await adminApi.saveSession({ ...(edit.id ? { id: edit.id } : {}), ...edit.f, scheduled_at: edit.f.scheduled_at || null });
    setBusy(false); if (!r.ok) { setErr(r.error); return; } setEdit(null); router.refresh();
  };
  const del = async (s: SessionRow) => { if (!confirm(`Delete "${s.title}"?`)) return; const r = await adminApi.deleteSession(s.id); if (!r.ok) alert(r.error); else router.refresh(); };
  const quick = async (s: SessionRow, status: string) => { const r = await adminApi.saveSession({ id: s.id, status }); if (!r.ok) alert(r.error); else router.refresh(); };
  const set = (p: Partial<F>) => edit && setEdit({ ...edit, f: { ...edit.f, ...p } });
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-1.5" role="tablist">{["all", ...STATUS].map((s) => <button key={s} type="button" role="tab" aria-selected={filter === s} onClick={() => setFilter(s)} className={cx("h-[30px] px-3 rounded-[10px] text-[12px] font-extrabold", filter === s ? "bg-green text-cream-text" : "bg-card border border-line text-ink-3")}>{s}</button>)}</div>
        <Button size="md" className="ml-auto" onClick={() => setEdit({ f: form() })}>New session</Button>
      </div>
      {edit && (
        <Panel title={edit.id ? "Edit session" : "New session"}>
          <div className="grid grid-cols-4 gap-3">
            <div className="col-span-3"><Label>Title</Label><input value={edit.f.title} onChange={(e) => set({ title: e.target.value })} className={field} /></div>
            <div><Label>Status</Label><select value={edit.f.status} onChange={(e) => set({ status: e.target.value })} className={field}>{STATUS.map((s) => <option key={s}>{s}</option>)}</select></div>
            <div className="col-span-4"><Label>Description</Label><textarea value={edit.f.description} onChange={(e) => set({ description: e.target.value })} className={cx(textarea, "min-h-[64px]")} /></div>
            <div><Label>When (local)</Label><input type="datetime-local" value={edit.f.scheduled_at} onChange={(e) => set({ scheduled_at: e.target.value })} className={field} /></div>
            <div><Label>Duration (min)</Label><input type="number" value={edit.f.duration_min} onChange={(e) => set({ duration_min: Number(e.target.value) })} className={field} /></div>
            <div><Label>Track</Label><select value={edit.f.track} onChange={(e) => set({ track: e.target.value })} className={field}>{TRACKS.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}</select></div>
            <div><Label>Minimum tier</Label><select value={edit.f.min_tier} onChange={(e) => set({ min_tier: e.target.value })} className={field}>{TIERS.map((t) => <option key={t}>{t}</option>)}</select></div>
            <div className="col-span-2"><Label>Class type</Label><select value={edit.f.class_type} onChange={(e) => set({ class_type: e.target.value })} className={field}>{CLASS.map((c) => <option key={c.v} value={c.v}>{c.l}</option>)}</select></div>
            <div className="col-span-2"><Label>Host</Label><input value={edit.f.host_name} onChange={(e) => set({ host_name: e.target.value })} className={field} /></div>
            <div className="col-span-2"><Label>Zoom join URL</Label><input value={edit.f.zoom_join_url} onChange={(e) => set({ zoom_join_url: e.target.value })} className={field} /></div>
            <div className="col-span-2"><Label hint="YouTube / Vimeo / direct link">Recording URL</Label><input value={edit.f.recording_url} onChange={(e) => set({ recording_url: e.target.value })} className={field} /></div>
            <div className="col-span-2"><Label>Worksheet URL</Label><input value={edit.f.worksheet_url} onChange={(e) => set({ worksheet_url: e.target.value })} className={field} /></div>
            <div className="col-span-2"><Label>Assignment</Label><input value={edit.f.assignment} onChange={(e) => set({ assignment: e.target.value })} className={field} /></div>
          </div>
          <p className="mt-2 text-[11px] font-bold text-ink-4">Recording uploads to the `class-recordings` bucket aren&apos;t wired here yet — paste a URL for now.</p>
          {err && <div className="mt-2"><Notice tone="red">{err}</Notice></div>}
          <div className="mt-3 flex justify-end gap-2"><Button size="md" variant="secondary" onClick={() => setEdit(null)}>Cancel</Button><Button size="md" variant="green" onClick={save} disabled={busy || !edit.f.title.trim()}>{busy ? "Saving…" : "Save session"}</Button></div>
        </Panel>
      )}
      <Table minWidth={900}>
        <thead><tr><Th>Session</Th><Th>When</Th><Th>Track</Th><Th>Type</Th><Th>Status</Th><Th right>RSVPs</Th><Th>Recording</Th><Th right>Actions</Th></tr></thead>
        <tbody>
          {list.length === 0 ? <EmptyRow cols={8}>No sessions.</EmptyRow> : list.map((s) => (
            <tr key={s.id}>
              <Td><span className="text-ink">{s.title}</span>{s.host_name && <span className="block text-[11.5px] text-ink-3">{s.host_name}</span>}</Td>
              <Td muted className="whitespace-nowrap">{when(s.scheduled_at)}{s.duration_min ? ` · ${s.duration_min}m` : ""}</Td>
              <Td><Chip>{s.track ?? "all"}</Chip></Td>
              <Td muted>{s.class_type ?? "—"}</Td>
              <Td><StatusChip status={s.status} /></Td>
              <Td right>{s.rsvps}</Td>
              <Td muted>{s.recording_url || s.recording_path ? <Chip tone="green">{s.recording_kind ?? "yes"}</Chip> : "—"}</Td>
              <Td right className="whitespace-nowrap">
                {s.status === "scheduled" && <Button size="sm" variant="green" onClick={() => quick(s, "live")}>Go live</Button>}
                {s.status === "live" && <Button size="sm" variant="secondary" onClick={() => quick(s, "completed")}>Mark done</Button>}
                <Button size="sm" variant="secondary" className="ml-1.5" onClick={() => setEdit({ id: s.id, f: form(s) })}>Edit</Button>
                <button type="button" onClick={() => del(s)} className="ml-1.5 text-[12px] font-black text-red">Delete</button>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}
