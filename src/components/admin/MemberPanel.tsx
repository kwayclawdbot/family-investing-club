"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { adminApi } from "@/lib/live/client-admin";
import type { AdminNote } from "@/lib/live/admin-crm";
import { Label, Notice, Panel, field, textarea } from "./ui";

/** Role / age-group controls → PATCH /api/admin/members (FTA "Admins update any profile"). */
export function MemberControls({ userId, role, ageGroup, self }: { userId: string; role: string; ageGroup: string | null; self: boolean }) {
  const router = useRouter();
  const [r, setR] = useState(role);
  const [a, setA] = useState(ageGroup ?? "adults");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "green" | "red"; text: string } | null>(null);
  const save = async () => {
    setBusy(true); setMsg(null);
    const res = await adminApi.updateMember({ userId, role: r, ageGroup: a });
    setBusy(false);
    if (!res.ok) { setMsg({ tone: "red", text: res.error }); return; }
    setMsg({ tone: "green", text: "Saved." }); router.refresh();
  };
  return (
    <Panel title="Account">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Role</Label><select value={r} onChange={(e) => setR(e.target.value)} disabled={self} className={field}><option value="parent">parent</option><option value="child">child</option><option value="coach">coach</option><option value="admin">admin</option></select></div>
        <div><Label>Age group</Label><select value={a} onChange={(e) => setA(e.target.value)} className={field}><option value="adults">adults</option><option value="teens">teens</option><option value="kids">kids</option></select></div>
      </div>
      {self && <p className="mt-2 text-[11.5px] font-bold text-ink-4">This is you — the role stays admin.</p>}
      {msg && <div className="mt-3"><Notice tone={msg.tone}>{msg.text}</Notice></div>}
      <div className="mt-3"><Button size="md" variant="green" onClick={save} disabled={busy || (r === role && a === (ageGroup ?? "adults"))}>{busy ? "Saving…" : "Save changes"}</Button></div>
    </Panel>
  );
}

/** Internal notes (FTA `admin_notes`). */
export function NotesPanel({ userId, notes }: { userId: string; notes: AdminNote[] }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const add = async () => {
    if (!text.trim()) return;
    setBusy(true); setErr(null);
    const r = await adminApi.addNote(userId, text.trim());
    setBusy(false);
    if (!r.ok) { setErr(r.error); return; }
    setText(""); router.refresh();
  };
  const del = async (id: string) => { const r = await adminApi.deleteNote(id); if (!r.ok) setErr(r.error); else router.refresh(); };
  return (
    <Panel title="Internal notes">
      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Call notes, context, follow-ups… (admins only)" className={textarea} />
      {err && <div className="mt-2"><Notice tone="red">{err}</Notice></div>}
      <div className="mt-2 flex justify-end"><Button size="sm" variant="secondary" onClick={add} disabled={busy || !text.trim()}>{busy ? "Adding…" : "Add note"}</Button></div>
      <ul className="mt-3 space-y-2">
        {notes.length === 0 && <li className="text-[12.5px] font-bold text-ink-4">No notes yet.</li>}
        {notes.map((n) => (
          <li key={n.id} className="rounded-[12px] bg-paper-2 px-3 py-2.5">
            <p className="text-[13px] font-bold text-ink whitespace-pre-wrap leading-[1.5]">{n.note}</p>
            <div className="mt-1 flex items-center justify-between text-[11px] font-bold text-ink-4"><span>{n.author?.display_name ?? "Admin"} · {new Date(n.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span><button type="button" onClick={() => del(n.id)} className="text-red hover:underline">Delete</button></div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/** Tier switch → POST /api/admin/families/tier (FTA `admin_set_family_tier`). */
export function FamilyTierControl({ familyId, tier }: { familyId: string; tier: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ tone: "green" | "red"; text: string } | null>(null);
  const set = async (t: "fic" | "fta") => {
    if (!confirm(`Set this family to ${t.toUpperCase()}? This updates enrollments and plan_tier.`)) return;
    setBusy(t); setMsg(null);
    const r = await adminApi.setFamilyTier(familyId, t);
    setBusy(null);
    if (!r.ok) { setMsg({ tone: "red", text: r.error }); return; }
    setMsg({ tone: "green", text: `Family is now ${t.toUpperCase()}.` }); router.refresh();
  };
  return (
    <Panel title="Membership tier">
      <p className="text-[12.5px] font-bold text-ink-2 mb-3">Current: <span className="font-black uppercase text-ink">{tier}</span>. Setting FTA attaches the newest cohort; setting FIC cancels the FTA enrollment.</p>
      <div className="flex gap-2">
        <Button size="md" variant="green" onClick={() => set("fic")} disabled={!!busy || tier === "fic"}>{busy === "fic" ? "Saving…" : "Set FIC"}</Button>
        <Button size="md" variant="primary" onClick={() => set("fta")} disabled={!!busy || tier === "fta"}>{busy === "fta" ? "Saving…" : "Set FTA"}</Button>
      </div>
      {msg && <div className="mt-3"><Notice tone={msg.tone}>{msg.text}</Notice></div>}
    </Panel>
  );
}
