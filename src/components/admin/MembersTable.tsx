"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { cx } from "@/components/ui";
import type { ContactRow } from "@/lib/live/admin-crm";
import { AdminAvatar, EmptyRow, KindChip, RoleChip, SeenDot, StageChip, Table, Td, Th, field } from "./ui";

const KINDS = [{ id: "all", label: "All" }, { id: "fta", label: "FTA" }, { id: "fic", label: "FIC" }, { id: "free", label: "Free" }, { id: "lead", label: "Leads" }];
const ACTIVITY = [{ id: "all", label: "Any activity" }, { id: "week", label: "Active 7d" }, { id: "month", label: "Active 30d" }, { id: "dormant", label: "Dormant 30d+" }, { id: "never", label: "Never" }];

function rel(iso: string | null, nowMs: number) {
  if (!iso) return "never";
  const d = Math.floor((nowMs - new Date(iso).getTime()) / 86_400_000);
  return d < 1 ? "today" : d < 30 ? `${d}d ago` : d < 365 ? `${Math.floor(d / 30)}mo ago` : `${Math.floor(d / 365)}y ago`;
}
function bucket(iso: string | null, nowMs: number) {
  if (!iso) return "never";
  const d = (nowMs - new Date(iso).getTime()) / 86_400_000;
  return d < 7 ? "week" : d < 30 ? "month" : "dormant";
}
function csv(rows: ContactRow[]) {
  const cell = (v: unknown) => { const s = v == null ? "" : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const cols: (keyof ContactRow)[] = ["name", "email", "phone", "contact_kind", "role", "stage", "last_activity", "created"];
  return [cols.join(","), ...rows.map((r) => cols.map((c) => cell(r[c])).join(","))].join("\n");
}

/** Unified directory (FTA `admin_contacts`: members ∪ lead-only marketing_leads), filtered client-side. */
/** `nowMs` comes from the server page so every relative label renders purely (and identically on hydration). */
export function MembersTable({ rows, nowMs }: { rows: ContactRow[]; nowMs: number }) {
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("all");
  const [act, setAct] = useState("all");
  const counts = useMemo(() => { const c: Record<string, number> = { all: rows.length }; for (const r of rows) c[r.contact_kind] = (c[r.contact_kind] ?? 0) + 1; return c; }, [rows]);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((r) => (kind === "all" || r.contact_kind === kind) && (act === "all" || (act === "month" ? bucket(r.last_activity, nowMs) !== "dormant" && bucket(r.last_activity, nowMs) !== "never" : bucket(r.last_activity, nowMs) === act)) && (!s || (r.name ?? "").toLowerCase().includes(s) || (r.email ?? "").toLowerCase().includes(s) || (r.phone ?? "").includes(s)));
  }, [rows, q, kind, act, nowMs]);
  const download = () => {
    const blob = new Blob([csv(list)], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `contacts-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(a.href);
  };
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, phone…" className={cx(field, "max-w-[320px]")} aria-label="Search contacts" />
        <div className="flex gap-1.5" role="tablist">
          {KINDS.map((k) => (
            <button key={k.id} type="button" role="tab" aria-selected={kind === k.id} onClick={() => setKind(k.id)} className={cx("h-[30px] px-3 rounded-[10px] text-[12px] font-extrabold inline-flex items-center gap-1.5", kind === k.id ? "bg-green text-cream-text" : "bg-card border border-line text-ink-3")}>
              {k.label}<span className={cx("text-[10.5px] tabular-nums", kind === k.id ? "text-cream-text/80" : "text-ink-4")}>{counts[k.id] ?? 0}</span>
            </button>
          ))}
        </div>
        <select value={act} onChange={(e) => setAct(e.target.value)} className={cx(field, "w-auto")} aria-label="Activity filter">{ACTIVITY.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}</select>
        <button type="button" onClick={download} className="ml-auto h-[30px] px-3 rounded-[10px] text-[12px] font-extrabold bg-card border border-line text-ink-2 hover:text-ink">Export CSV ({list.length})</button>
      </div>
      <Table minWidth={860}>
        <thead><tr><Th>Contact</Th><Th>Type</Th><Th>Role</Th><Th>Stage</Th><Th>Last activity</Th><Th>Joined</Th></tr></thead>
        <tbody>
          {list.length === 0 ? <EmptyRow cols={6}>No contacts match.</EmptyRow> : list.map((r) => {
            const href = r.record === "member" ? `/admin/members/${r.contact_id}` : `/admin/pipeline?lead=${r.contact_id}`;
            return (
              <tr key={`${r.record}:${r.contact_id}`} className="hover:bg-paper-2/60">
                <Td>
                  <Link href={href} className="flex items-center gap-2.5 min-w-0">
                    <AdminAvatar name={r.name} />
                    <span className="min-w-0"><span className="block truncate text-ink">{r.name || "—"}</span><span className="block truncate text-[11.5px] text-ink-3">{r.email ?? r.phone ?? "—"}</span></span>
                  </Link>
                </Td>
                <Td><KindChip kind={r.contact_kind} /></Td>
                <Td>{r.role ? <RoleChip role={r.role} /> : <span className="text-ink-4">—</span>}</Td>
                <Td><StageChip stage={r.stage} /></Td>
                <Td muted><SeenDot iso={r.last_activity} nowMs={nowMs} />{rel(r.last_activity, nowMs)}</Td>
                <Td muted>{new Date(r.created).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</Td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}
