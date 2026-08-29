"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, cx } from "@/components/ui";
import { adminApi } from "@/lib/live/client-admin";
import { Label, Notice, Panel, field, textarea } from "./ui";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** RFC-4180-ish CSV parser (ported from FTA src/lib/marketing.ts). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let f = ""; let q = false;
  const s = text.replace(/^﻿/, "");
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === '"') { if (s[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ",") { row.push(f); f = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && s[i + 1] === "\n") i++; row.push(f); f = ""; if (row.length > 1 || row[0] !== "") rows.push(row); row = []; }
    else f += c;
  }
  if (f !== "" || row.length > 0) { row.push(f); if (row.length > 1 || row[0] !== "") rows.push(row); }
  return rows;
}
function guess(headers: string[]) {
  const n = headers.map((h) => h.trim().toLowerCase());
  const find = (...c: string[]) => n.findIndex((h) => c.some((x) => h === x || h.includes(x)));
  return { email: find("email", "e-mail", "mail"), first_name: find("first name", "first_name", "firstname", "first", "fname"), last_name: find("last name", "last_name", "lastname", "last", "lname"), phone: find("phone", "mobile", "cell", "tel"), tags: find("tags", "tag", "segment", "list") };
}

export function LeadsPanel() {
  const router = useRouter();
  const [tab, setTab] = useState<"add" | "import">("add");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "green" | "red" | "orange"; text: string } | null>(null);
  // add
  const [email, setEmail] = useState(""); const [first, setFirst] = useState(""); const [last, setLast] = useState(""); const [phone, setPhone] = useState(""); const [tags, setTags] = useState(""); const [notes, setNotes] = useState("");
  // import
  const [csvText, setCsvText] = useState(""); const [source, setSource] = useState("csv");
  const parsed = useMemo(() => {
    const rows = parseCsv(csvText); if (rows.length < 2) return { rows: [], bad: 0 };
    const m = guess(rows[0]); if (m.email < 0) return { rows: [], bad: rows.length - 1, noEmail: true };
    const out: { email: string; first_name?: string; last_name?: string; phone?: string; tags?: string[] }[] = []; let bad = 0;
    for (const r of rows.slice(1)) {
      const e = (r[m.email] ?? "").trim().toLowerCase(); if (!EMAIL_RE.test(e)) { bad++; continue; }
      out.push({ email: e, first_name: m.first_name >= 0 ? r[m.first_name] : undefined, last_name: m.last_name >= 0 ? r[m.last_name] : undefined, phone: m.phone >= 0 ? r[m.phone] : undefined, tags: m.tags >= 0 ? (r[m.tags] ?? "").split(/[;|]/).map((t) => t.trim()).filter(Boolean) : undefined });
    }
    return { rows: out, bad };
  }, [csvText]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    const r = await adminApi.addLead({ email, first_name: first, last_name: last, phone, tags: tags.split(",").map((t) => t.trim()).filter(Boolean), notes });
    setBusy(false);
    if (!r.ok) { setMsg({ tone: "red", text: r.error }); return; }
    setMsg({ tone: "green", text: r.created ? "Lead added." : "That email already existed — updated instead." });
    setEmail(""); setFirst(""); setLast(""); setPhone(""); setTags(""); setNotes(""); router.refresh();
  };
  const doImport = async () => {
    setBusy(true); setMsg(null);
    const r = await adminApi.importLeads(parsed.rows, source);
    setBusy(false);
    if (!r.ok) { setMsg({ tone: "red", text: r.error }); return; }
    setMsg({ tone: "green", text: `Imported ${r.imported}, updated ${r.updated}, skipped ${r.skipped}.` }); setCsvText(""); router.refresh();
  };
  const sync = async () => {
    setBusy(true); setMsg(null);
    const r = await adminApi.syncConversions();
    setBusy(false);
    if (!r.ok) { setMsg({ tone: "red", text: r.error }); return; }
    setMsg({ tone: "green", text: `${r.converted} lead${r.converted === 1 ? "" : "s"} marked converted.` }); router.refresh();
  };
  const seg = (on: boolean) => cx("h-[30px] px-3 rounded-[10px] text-[12px] font-extrabold", on ? "bg-green text-cream-text" : "bg-card border border-line text-ink-3");
  return (
    <Panel title="Add leads" action={<Button size="sm" variant="secondary" onClick={sync} disabled={busy}>Sync conversions</Button>}>
      <div className="flex gap-1.5 mb-3" role="tablist"><button type="button" role="tab" aria-selected={tab === "add"} className={seg(tab === "add")} onClick={() => setTab("add")}>One lead</button><button type="button" role="tab" aria-selected={tab === "import"} className={seg(tab === "import")} onClick={() => setTab("import")}>CSV import</button></div>
      {tab === "add" ? (
        <form onSubmit={add} className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><Label>Email</Label><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={field} /></div>
          <div><Label>First name</Label><input value={first} onChange={(e) => setFirst(e.target.value)} className={field} /></div>
          <div><Label>Last name</Label><input value={last} onChange={(e) => setLast(e.target.value)} className={field} /></div>
          <div><Label>Phone</Label><input value={phone} onChange={(e) => setPhone(e.target.value)} className={field} placeholder="+1…" /></div>
          <div><Label hint="comma-separated">Tags</Label><input value={tags} onChange={(e) => setTags(e.target.value)} className={field} placeholder="webinar, parent" /></div>
          <div className="col-span-2"><Label>Notes</Label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={cx(textarea, "min-h-[64px]")} /></div>
          <div className="col-span-2 flex justify-end"><Button size="md" type="submit" disabled={busy || !EMAIL_RE.test(email)}>{busy ? "Saving…" : "Add lead"}</Button></div>
        </form>
      ) : (
        <div className="space-y-3">
          <div><Label hint="header row with email, first name, last name, phone, tags">Paste CSV</Label><textarea value={csvText} onChange={(e) => setCsvText(e.target.value)} className={cx(textarea, "font-mono text-[12px] min-h-[140px]")} placeholder={"email,first name,last name,phone,tags\nsam@example.com,Sam,Lee,+15551234567,webinar|parent"} /></div>
          <div className="flex items-center gap-3">
            <div className="w-[180px]"><Label>Source</Label><select value={source} onChange={(e) => setSource(e.target.value)} className={field}><option value="csv">csv</option><option value="manual">manual</option><option value="facebook">facebook</option><option value="referral">referral</option></select></div>
            <div className="text-[12.5px] font-bold text-ink-3 pt-5">{parsed.rows.length} valid row{parsed.rows.length === 1 ? "" : "s"}{parsed.bad ? ` · ${parsed.bad} skipped` : ""}{"noEmail" in parsed && parsed.noEmail ? " · no email column found" : ""}</div>
            <div className="ml-auto pt-5"><Button size="md" onClick={doImport} disabled={busy || parsed.rows.length === 0}>{busy ? "Importing…" : "Import"}</Button></div>
          </div>
        </div>
      )}
      {msg && <div className="mt-3"><Notice tone={msg.tone}>{msg.text}</Notice></div>}
    </Panel>
  );
}
