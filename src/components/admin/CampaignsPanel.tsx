"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, cx } from "@/components/ui";
import { adminApi, type SendOutcome } from "@/lib/live/client-admin";
import type { Campaign } from "@/lib/live/admin-crm";
import { Label, Notice, Panel, StatusChip, field, textarea } from "./ui";

const STAGES = ["new", "contacted", "engaged", "nurture", "converted", "cold"];

function outcome(r: SendOutcome): { tone: "green" | "orange" | "red"; text: string } {
  if (!r.configured) return { tone: "orange", text: r.message ?? "Not configured." };
  if (r.error) return { tone: "red", text: r.error };
  return { tone: "green", text: `${r.dry_run ? "Dry run — " : ""}sent ${r.sent ?? 0}, failed ${r.failed ?? 0}, skipped ${r.skipped ?? 0}.${r.message ? ` ${r.message}` : ""}` };
}

export function CampaignComposer({ resend, twilio }: { resend: boolean; twilio: boolean }) {
  const router = useRouter();
  const [name, setName] = useState(""); const [channel, setChannel] = useState<"email" | "sms">("email"); const [subject, setSubject] = useState(""); const [body, setBody] = useState("");
  const [stages, setStages] = useState<string[]>([]); const [tags, setTags] = useState("");
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState<{ tone: "green" | "red" | "orange"; text: string } | null>(null);
  const [testTo, setTestTo] = useState("");
  const create = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    const r = await adminApi.createCampaign({ name, channel, body, subject: channel === "email" ? subject : undefined, segment: { stages, tags: tags.split(",").map((t) => t.trim()).filter(Boolean) } });
    setBusy(false);
    if (!r.ok) { setMsg({ tone: "red", text: r.error }); return; }
    setMsg({ tone: "green", text: "Draft saved — send it from the list below (dry run first)." }); setName(""); setSubject(""); setBody(""); setStages([]); setTags(""); router.refresh();
  };
  const test = async () => {
    setBusy(true); setMsg(null);
    const r = await adminApi.testSend({ channel, to: testTo, subject: subject || name, body: body || "Test from FIC admin" });
    setBusy(false);
    setMsg(r.ok ? outcome(r) : { tone: "red", text: r.error });
  };
  return (
    <Panel title="New campaign">
      {!(channel === "sms" ? twilio : resend) && <div className="mb-3"><Notice tone="orange">{channel === "sms" ? "Twilio isn't configured on this deployment — SMS campaigns can be drafted and dry-run only." : "Resend isn't configured on this deployment (RESEND_API_KEY) — email campaigns can be drafted and dry-run only."}</Notice></div>}
      <form onSubmit={create} className="grid grid-cols-2 gap-3">
        <div><Label>Name</Label><input required value={name} onChange={(e) => setName(e.target.value)} className={field} placeholder="Sept challenge reminder" /></div>
        <div><Label>Channel</Label><select value={channel} onChange={(e) => setChannel(e.target.value as "email" | "sms")} className={field}><option value="email">Email</option><option value="sms">SMS</option></select></div>
        {channel === "email" && <div className="col-span-2"><Label>Subject</Label><input required value={subject} onChange={(e) => setSubject(e.target.value)} className={field} /></div>}
        <div className="col-span-2"><Label hint="merge fields: {{first_name}} {{last_name}} {{email}}">Body</Label><textarea required value={body} onChange={(e) => setBody(e.target.value)} className={cx(textarea, "min-h-[140px]")} /></div>
        <div>
          <Label>Segment · stages</Label>
          <div className="flex flex-wrap gap-1.5">{STAGES.map((s) => { const on = stages.includes(s); return <button key={s} type="button" aria-pressed={on} onClick={() => setStages(on ? stages.filter((x) => x !== s) : [...stages, s])} className={cx("h-[28px] px-2.5 rounded-[8px] text-[11.5px] font-extrabold", on ? "bg-green text-cream-text" : "bg-card border border-line text-ink-3")}>{s}</button>; })}</div>
          <p className="mt-1 text-[11px] font-bold text-ink-4">None selected = every stage except unsubscribed.</p>
        </div>
        <div><Label hint="comma-separated, any match">Segment · tags</Label><input value={tags} onChange={(e) => setTags(e.target.value)} className={field} /></div>
        <div className="col-span-2 flex items-end gap-2 flex-wrap">
          <div className="flex-1 min-w-[220px]"><Label>Test send to</Label><input value={testTo} onChange={(e) => setTestTo(e.target.value)} className={field} placeholder={channel === "sms" ? "+1555…" : "you@example.com"} /></div>
          <Button size="md" variant="secondary" type="button" onClick={test} disabled={busy || !testTo}>Send test</Button>
          <Button size="md" type="submit" disabled={busy || !name || !body}>{busy ? "Saving…" : "Save draft"}</Button>
        </div>
      </form>
      {msg && <div className="mt-3"><Notice tone={msg.tone}>{msg.text}</Notice></div>}
    </Panel>
  );
}

export function CampaignRowActions({ c }: { c: Campaign }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ tone: "green" | "red" | "orange"; text: string } | null>(null);
  const run = async (dry: boolean) => {
    if (!dry && !confirm(`Send "${c.name}" for real to its whole segment?`)) return;
    setBusy(dry ? "dry" : "live"); setMsg(null);
    const r = await adminApi.sendCampaign({ campaignId: c.id, dryRun: dry });
    setBusy(null);
    setMsg(r.ok ? outcome(r) : { tone: "red", text: r.error });
    router.refresh();
  };
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-1.5">
        <Button size="sm" variant="secondary" onClick={() => run(true)} disabled={!!busy}>{busy === "dry" ? "Running…" : "Dry run"}</Button>
        <Button size="sm" variant="green" onClick={() => run(false)} disabled={!!busy || c.status === "sending"}>{busy === "live" ? "Sending…" : "Send"}</Button>
      </div>
      {msg && <span className={cx("text-[11px] font-bold text-right max-w-[260px]", msg.tone === "green" ? "text-green" : msg.tone === "orange" ? "text-orange-2" : "text-red")}>{msg.text}</span>}
    </div>
  );
}

export function CampaignStatus({ status }: { status: string }) { return <StatusChip status={status} />; }
