"use client";
import { useRef, useState } from "react";
import { PushToggle } from "@/components/profile/PushToggle";
import { useRouter } from "next/navigation";
import { Button, cx } from "@/components/ui";
import { Toggle, Sheet, LinkRow } from "@/components/ui/extras";
import { createClient } from "@/lib/supabase/client";
import { familyApi } from "@/lib/live/client-family";
import { MemberAvatar } from "@/components/family/MemberAvatar";
import type { ProfileSettings } from "@/lib/live/family";

type Level = "beginner" | "developing" | "proficient";
const LEVELS: { id: Level; label: string; who: string }[] = [
  { id: "beginner", label: "Beginner", who: "Plain words, everyday examples" },
  { id: "developing", label: "Developing", who: "Numbers, scenarios, a little jargon" },
  { id: "proficient", label: "Proficient", who: "Full detail, no hand-holding" },
];
const NOTIFS: [string, string][] = [["email_notifs", "Email notifications"], ["push_lessons", "New lessons"], ["push_picks", "Club picks & votes"], ["push_replies", "Replies to me"], ["push_mentions", "Mentions"], ["push_lives", "Live sessions"], ["live_alerts", "Live alerts"], ["weekly_digest", "Weekly progress email"]];
const field = "w-full h-[44px] rounded-[12px] border border-line bg-paper px-3 text-[14px] font-bold text-ink outline-none focus:border-green";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (<><h2 className="mt-5 mb-2 text-[11px] font-black text-ink-3 tracking-[0.6px] uppercase">{title}</h2><div className="bg-card border border-line rounded-card px-4 py-1">{children}</div></>);
}
function Row({ title, sub, children, last }: { title: string; sub?: string; children?: React.ReactNode; last?: boolean }) {
  return (<div className={cx("flex items-center gap-3 py-3", !last && "border-b border-paper-2")}><div className="flex-1 min-w-0"><div className="text-[13.5px] font-extrabold text-ink">{title}</div>{sub && <div className="text-[11.5px] font-bold text-ink-3">{sub}</div>}</div>{children}</div>);
}

export function SettingsLive({ me }: { me: ProfileSettings }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(me.displayName);
  const [username, setUsername] = useState(me.username);
  const [avatar, setAvatar] = useState<string | null>(me.avatarUrl);
  const [level, setLevel] = useState<Level | null>(me.comprehensionLevel);
  const [prefs, setPrefs] = useState<Record<string, unknown>>(me.notificationPrefs);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ where: string; text: string; ok: boolean } | null>(null);
  const [pw, setPw] = useState<{ open: boolean; a: string; b: string }>({ open: false, a: "", b: "" });
  const [del, setDel] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const say = (where: string, text: string, ok: boolean) => { setMsg({ where, text, ok }); if (ok) setTimeout(() => setMsg((m) => (m?.where === where ? null : m)), 1800); };

  async function saveIdentity() {
    setBusy("identity");
    const r = await familyApi.updateMe({ displayName: displayName.trim(), username: username.trim().toLowerCase() });
    setBusy(null);
    say("identity", r.ok ? "Saved ✓" : r.error, r.ok);
    if (r.ok) router.refresh();
  }
  async function upload(f: File | undefined) {
    if (!f) return;
    setBusy("avatar");
    const r = await familyApi.uploadAvatar(f);
    setBusy(null);
    if (r.ok) { setAvatar(r.avatarUrl); router.refresh(); }
    say("avatar", r.ok ? "Photo updated ✓" : r.error, r.ok);
  }
  async function pickLevel(l: Level) {
    const prev = level; setLevel(l); setBusy("level");
    const r = await familyApi.updateMe({ comprehensionLevel: l });
    setBusy(null);
    if (!r.ok) { setLevel(prev); say("level", r.error, false); } else router.refresh();
  }
  async function togglePref(k: string, v: boolean) {
    const prev = prefs; setPrefs({ ...prefs, [k]: v });
    const r = await familyApi.updateMe({ notificationPrefs: { [k]: v } });
    if (!r.ok) { setPrefs(prev); say("notif", r.error, false); }
  }
  async function changePassword() {
    if (pw.a.length < 8) { say("pw", "At least 8 characters.", false); return; }
    if (pw.a !== pw.b) { say("pw", "Passwords don't match.", false); return; }
    setBusy("pw");
    const r = await familyApi.changePassword(pw.a);
    setBusy(null);
    if (r.ok) { setPw({ open: false, a: "", b: "" }); say("security", "Password changed ✓", true); } else say("pw", r.error, false);
  }
  async function signOut() {
    setBusy("out");
    try { await createClient().auth.signOut(); } catch { /* ignore */ }
    router.replace("/welcome");
  }
  const note = (where: string) => msg?.where === where ? <p className={cx("mt-1 text-[12px] font-bold", msg.ok ? "text-green" : "text-red")} role="status">{msg.text}</p> : null;

  return (
    <div className="pb-6">
      <Section title="Identity">
        <div className="py-3 border-b border-paper-2 flex items-center gap-3">
          <MemberAvatar name={displayName || "?"} color="bg-green-2" avatarUrl={avatar} size={52} />
          <div className="flex-1">
            <div className="text-[13.5px] font-extrabold text-ink">Photo</div>
            <div className="text-[11.5px] font-bold text-ink-3">{avatar ? "Shown to your family and club." : "Your initial shows until you add one."}</div>
            {note("avatar")}
          </div>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={(e) => upload(e.target.files?.[0])} aria-label="Choose a photo" />
          <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()} disabled={busy === "avatar"}>{busy === "avatar" ? "Uploading…" : avatar ? "Change" : "Add photo"}</Button>
        </div>
        <div className="py-3 border-b border-paper-2">
          <label className="text-[11px] font-extrabold text-ink-3">Display name</label>
          <input className={cx(field, "mt-1")} value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={60} aria-label="Display name" />
        </div>
        <div className="py-3 border-b border-paper-2">
          <label className="text-[11px] font-extrabold text-ink-3">Username</label>
          <div className="mt-1 flex items-center gap-2"><span className="text-[14px] font-black text-ink-3">@</span><input className={field} value={username} onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9-]/g, "").toLowerCase())} maxLength={40} aria-label="Username" /></div>
        </div>
        <Row title="Email" sub={me.email} last />
        <div className="pb-3 flex items-center gap-3"><Button size="md" variant="green" onClick={saveIdentity} disabled={busy === "identity" || !displayName.trim() || username.length < 3}>{busy === "identity" ? "Saving…" : "Save changes"}</Button>{note("identity")}</div>
      </Section>

      {me.familyName && (
        <Section title="Household">
          <LinkRow href="/family" icon="👨‍👩‍👧‍👦" title={me.familyName} sub={me.isKid ? "Learner account · your grown-ups manage guardrails" : "Members, invites and guardian controls"} last />
        </Section>
      )}

      <Section title="How should we explain things?">
        <div className="py-3 flex flex-col gap-[6px]" role="radiogroup" aria-label="Explanation level">
          {LEVELS.map((l) => (
            <button key={l.id} role="radio" aria-checked={level === l.id} disabled={busy === "level"} onClick={() => pickLevel(l.id)}
              className={cx("flex items-center justify-between rounded-[12px] border px-3 py-[9px] text-left", level === l.id ? "border-green-2 bg-green-tint" : "border-line bg-paper")}>
              <span><span className="block text-[13px] font-black text-ink">{l.label}</span><span className="block text-[11px] font-bold text-ink-3">{l.who}</span></span>
              {level === l.id && <span className="text-green font-black">✓</span>}
            </button>
          ))}
          {note("level")}
          {me.isKid && <p className="text-[11px] font-bold text-ink-4">Your age band ({me.ageGroup === "kids" ? "Explorer" : "Builder"}) also shapes how lessons are written — a parent can change that.</p>}
        </div>
      </Section>

      <Section title="Notifications">
        <PushToggle userId={me.id} />
        {NOTIFS.map(([k, label], i) => (
          <Row key={k} title={label} last={i === NOTIFS.length - 1}><Toggle checked={prefs[k] !== false && prefs[k] !== undefined ? !!prefs[k] : prefs[k] === undefined ? k !== "weekly_digest" : false} onChange={(v) => togglePref(k, v)} label={label} /></Row>
        ))}
        {note("notif")}
      </Section>

      <Section title="Security">
        <LinkRow title="Change password" sub="Choose a new password right here" onClick={() => setPw({ open: true, a: "", b: "" })} last />
        {note("security")}
      </Section>

      <Section title="Account">
        <LinkRow title="Sign out" onClick={signOut} danger />
        <LinkRow title="Delete account" sub="Handled by support to protect family data" onClick={() => setDel(true)} danger last />
      </Section>
      {busy === "out" && <p className="mt-2 text-[12px] font-bold text-ink-3">Signing out…</p>}

      <Sheet open={pw.open} onClose={() => setPw({ open: false, a: "", b: "" })} title="Change password">
        <div className="flex flex-col gap-3">
          <input className={field} type="password" autoComplete="new-password" placeholder="New password (8+ characters)" value={pw.a} onChange={(e) => setPw((p) => ({ ...p, a: e.target.value }))} aria-label="New password" />
          <input className={field} type="password" autoComplete="new-password" placeholder="Repeat it" value={pw.b} onChange={(e) => setPw((p) => ({ ...p, b: e.target.value }))} aria-label="Repeat new password" />
          {note("pw")}
          <Button size="md" variant="green" full onClick={changePassword} disabled={busy === "pw"}>{busy === "pw" ? "Changing…" : "Change password"}</Button>
        </div>
      </Sheet>
      <Sheet open={del} onClose={() => setDel(false)} title="Delete account">
        <p className="text-[14px] font-bold text-ink-2 leading-[1.55]">Deleting removes your progress and, if you&apos;re a parent, affects your household&apos;s profiles. Email <b className="text-ink">support@familyinvestingclub.com</b> from your account address and we&apos;ll handle it within 2 business days.</p>
      </Sheet>
    </div>
  );
}
