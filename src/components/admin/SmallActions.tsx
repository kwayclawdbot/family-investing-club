"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, cx } from "@/components/ui";
import { Toggle } from "@/components/ui/extras";
import { adminApi } from "@/lib/live/client-admin";
import { Notice } from "./ui";

/** Welcome-drip master switch (app_settings.drip_enabled). */
export function DripsToggle({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [v, setV] = useState(enabled);
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="flex items-center gap-3">
      <Toggle checked={v} label="Welcome drip enabled" onChange={async (next) => { setV(next); setErr(null); const r = await adminApi.setDrips(next); if (!r.ok) { setV(!next); setErr(r.error); } else router.refresh(); }} />
      <span className={cx("text-[12.5px] font-extrabold", v ? "text-green" : "text-ink-3")}>{v ? "Sending" : "Paused"}</span>
      {err && <span className="text-[12px] font-bold text-red">{err}</span>}
    </div>
  );
}

/** Lesson draft publish / unpublish (publish_lesson_draft / unpublish_lesson_draft). */
export function PublishDraftButton({ lessonId, action, label }: { lessonId: string; action: "publish" | "unpublish"; label: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <span className="inline-flex items-center gap-2">
      <Button size="sm" variant={action === "publish" ? "green" : "secondary"} disabled={busy} onClick={async () => { if (action === "unpublish" && !confirm("Unpublish this lesson's steps? Members lose the interactive version until you publish again.")) return; setBusy(true); setErr(null); const r = await adminApi.publishDraft(lessonId, action); setBusy(false); if (!r.ok) setErr(r.error); else router.refresh(); }}>{busy ? "…" : label}</Button>
      {err && <span className="text-[11px] font-bold text-red">{err}</span>}
    </span>
  );
}

/** Support ticket actions: team reply + status (service-role route). */
export function TicketActions({ ticketId, status }: { ticketId: string; status: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ tone: "green" | "red"; text: string } | null>(null);
  const reply = async () => {
    setBusy("reply"); setMsg(null);
    const r = await adminApi.supportReply(ticketId, text.trim());
    setBusy(null);
    if (!r.ok) { setMsg({ tone: "red", text: r.error }); return; }
    setText(""); setMsg({ tone: "green", text: "Reply sent — the member gets a notification." }); router.refresh();
  };
  const set = async (s: string) => {
    setBusy(s); setMsg(null);
    const r = await adminApi.supportStatus(ticketId, s);
    setBusy(null);
    if (!r.ok) { setMsg({ tone: "red", text: r.error }); return; }
    router.refresh();
  };
  return (
    <div className="space-y-2">
      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a reply from the team…" className="w-full min-h-[88px] rounded-[10px] border border-line bg-paper px-3 py-2 text-[13px] font-bold text-ink outline-none focus:border-green leading-[1.5]" />
      <div className="flex items-center gap-1.5 flex-wrap">
        <Button size="sm" variant="green" onClick={reply} disabled={!!busy || !text.trim()}>{busy === "reply" ? "Sending…" : "Send reply"}</Button>
        <span className="ml-auto text-[11px] font-black uppercase tracking-[0.1em] text-ink-4">Status</span>
        {["open", "pending", "resolved", "closed"].map((s) => (
          <button key={s} type="button" disabled={!!busy || s === status} onClick={() => set(s)} className={cx("h-[28px] px-2.5 rounded-[8px] text-[11.5px] font-extrabold", s === status ? "bg-green text-cream-text" : "bg-card border border-line text-ink-3 hover:text-ink disabled:opacity-60")}>{s}</button>
        ))}
      </div>
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
    </div>
  );
}
