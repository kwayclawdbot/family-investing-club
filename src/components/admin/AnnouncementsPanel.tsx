"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, cx } from "@/components/ui";
import { adminApi } from "@/lib/live/client-admin";
import type { AudienceCount } from "@/lib/live/admin-crm";
import { Label, Notice, Panel, field, textarea } from "./ui";

const AUDIENCES = [{ id: "all", label: "Everyone" }, { id: "fic", label: "FIC families" }, { id: "fta", label: "FTA families" }, { id: "free", label: "Free / lapsed" }];
const LINKS = [{ label: "Community", path: "/community" }, { label: "Home", path: "/home" }, { label: "Learn", path: "/learn" }, { label: "Live classes", path: "/live" }, { label: "Club", path: "/club" }, { label: "Custom…", path: "__custom__" }];

/** Announce (feed post + in-app notification) or push broadcast (notifications → push dispatch hook). */
export function AnnouncementsPanel({ counts }: { counts: Record<string, AudienceCount | null> }) {
  const router = useRouter();
  const [tab, setTab] = useState<"announce" | "push">("announce");
  const [title, setTitle] = useState(""); const [body, setBody] = useState(""); const [audience, setAudience] = useState("all");
  const [linkPick, setLinkPick] = useState("/community"); const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ tone: "green" | "red"; text: string } | null>(null);
  /** Switching tabs clears the last result — done in the handler, not an effect (no cascading render). */
  const pickTab = (t: "announce" | "push") => { setTab(t); setMsg(null); };
  const link = linkPick === "__custom__" ? custom.trim() : linkPick;
  const c = counts[audience];
  const go = async (test = false) => {
    setBusy(test ? "test" : "send"); setMsg(null);
    const r = tab === "announce" ? await adminApi.announce({ title, body, audience, link }) : await adminApi.push({ title, body, audience, link, test });
    setBusy(null);
    if (!r.ok) { setMsg({ tone: "red", text: r.error }); return; }
    setMsg({ tone: "green", text: test ? "Test push sent to you — check your bell / device." : `${tab === "announce" ? "Posted — notified" : "Sent — pushed to"} ${r.recipients} member${r.recipients === 1 ? "" : "s"}.` });
    if (!test) { setTitle(""); setBody(""); router.refresh(); }
  };
  const seg = (on: boolean) => cx("h-[30px] px-3 rounded-[10px] text-[12px] font-extrabold", on ? "bg-green text-cream-text" : "bg-card border border-line text-ink-3");
  return (
    <Panel title={tab === "announce" ? "New announcement" : "Push broadcast"}>
      <div className="flex gap-1.5 mb-3" role="tablist"><button type="button" role="tab" aria-selected={tab === "announce"} className={seg(tab === "announce")} onClick={() => pickTab("announce")}>Announcement</button><button type="button" role="tab" aria-selected={tab === "push"} className={seg(tab === "push")} onClick={() => pickTab("push")}>Push</button></div>
      <p className="text-[12.5px] font-bold text-ink-3 mb-3">{tab === "announce" ? "Posts to the community feed and drops an in-app notification for the audience." : "Notification-only blast; devices with push turned on get it through the dispatch hook."}</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Label>Title</Label><input value={title} onChange={(e) => setTitle(e.target.value)} className={field} maxLength={140} placeholder={tab === "announce" ? "Family Night moved to Thursday" : "Live class starts in 10 minutes"} /></div>
        <div className="col-span-2"><Label>Body</Label><textarea value={body} onChange={(e) => setBody(e.target.value)} className={textarea} /></div>
        <div><Label>Audience</Label><select value={audience} onChange={(e) => setAudience(e.target.value)} className={field}>{AUDIENCES.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}</select>
          <p className="mt-1 text-[11px] font-bold text-ink-4">{c ? `${c.recipients ?? 0} members · ${c.push_subs ?? 0} with push` : "—"}</p></div>
        <div><Label>Link</Label><select value={linkPick} onChange={(e) => setLinkPick(e.target.value)} className={field}>{LINKS.map((l) => <option key={l.path} value={l.path}>{l.label}</option>)}</select>
          {linkPick === "__custom__" && <input value={custom} onChange={(e) => setCustom(e.target.value)} className={cx(field, "mt-2")} placeholder="/learn/path/foundations" />}</div>
      </div>
      {msg && <div className="mt-3"><Notice tone={msg.tone}>{msg.text}</Notice></div>}
      <div className="mt-3 flex justify-end gap-2">
        {tab === "push" && <Button size="md" variant="secondary" onClick={() => go(true)} disabled={!!busy || !title.trim()}>{busy === "test" ? "…" : "Send test to me"}</Button>}
        <Button size="md" onClick={() => go(false)} disabled={!!busy || !title.trim()}>{busy === "send" ? "Sending…" : tab === "announce" ? "Post announcement" : "Send push"}</Button>
      </div>
    </Panel>
  );
}
