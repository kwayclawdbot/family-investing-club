"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ExplanationLevel } from "@/lib/types";
import { Button, cx } from "@/components/ui";
import { Toggle, Sheet, LinkRow } from "@/components/ui/extras";
import { createClient } from "@/lib/supabase/client";
import { useLocal } from "./useLocal";

const LEVELS: { id: ExplanationLevel; who: string }[] = [
  { id: "Explorer", who: "Young / very early learner" },
  { id: "Builder", who: "Older child / early teen" },
  { id: "Investor", who: "Teen / adult beginner" },
  { id: "Trader", who: "Advanced learner" },
];
const field = "w-full h-[44px] rounded-[12px] border border-line bg-paper px-3 text-[14px] font-bold text-ink outline-none focus:border-green";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <h2 className="mt-5 mb-2 text-[11px] font-black text-ink-3 tracking-[0.6px] uppercase">{title}</h2>
      <div className="bg-card border border-line rounded-card px-4 py-1">{children}</div>
    </>
  );
}
function Row({ title, sub, children, last }: { title: string; sub?: string; children?: React.ReactNode; last?: boolean }) {
  return (
    <div className={cx("flex items-center gap-3 py-3", !last && "border-b border-paper-2")}>
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-extrabold text-ink">{title}</div>
        {sub && <div className="text-[11.5px] font-bold text-ink-3">{sub}</div>}
      </div>
      {children}
    </div>
  );
}

export function SettingsForm({ initial, email: fallbackEmail }: { initial: { firstName: string; lastName: string; username: string; level: ExplanationLevel }; email: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(fallbackEmail);
  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => { if (data.user?.email) setEmail(data.user.email); }).catch(() => {});
  }, []);
  const [profile, setProfile] = useLocal("fic.profile", { displayName: `${initial.firstName} ${initial.lastName}`, username: initial.username, avatar: initial.firstName[0] });
  const [level, setLevel] = useLocal<ExplanationLevel>("fic.level", initial.level);
  const [a11y, setA11y] = useLocal("fic.a11y", { reducedMotion: false, textSize: "M" as "S" | "M" | "L" });
  const [notif, setNotif] = useLocal("fic.notif", { email: true, push: true, reminders: true, family: true, club: false, digest: false });
  const [privacy, setPrivacy] = useLocal("fic.privacy", { visibility: "community" as "community" | "family" | "private" });
  const [pw, setPw] = useState<{ open: boolean; state: "idle" | "sending" | "sent" | "error"; msg?: string }>({ open: false, state: "idle" });
  const [del, setDel] = useState(false);
  const [saved, setSaved] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.reducedMotion = a11y.reducedMotion ? "true" : "false";
    root.style.fontSize = { S: "15px", M: "16px", L: "18px" }[a11y.textSize];
  }, [a11y]);

  async function changePassword() {
    setPw({ open: true, state: "sending" });
    try {
      const { error } = await createClient().auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?next=/reset-password` });
      if (error) setPw({ open: true, state: "error", msg: error.message });
      else setPw({ open: true, state: "sent" });
    } catch (e) { setPw({ open: true, state: "error", msg: e instanceof Error ? e.message : "Could not send" }); }
  }
  async function signOut() {
    setSigningOut(true);
    try { await createClient().auth.signOut(); } catch { /* ignore */ }
    router.replace("/welcome");
  }
  function save() { setSaved(true); setTimeout(() => setSaved(false), 1500); }

  return (
    <div className="pb-6">
      <Section title="Identity">
        <div className="py-3 border-b border-paper-2 flex items-center gap-3">
          <span className="w-12 h-12 rounded-full bg-green-2 text-white text-[20px] font-black flex items-center justify-center">{profile.avatar || "?"}</span>
          <div className="flex-1">
            <label className="text-[11px] font-extrabold text-ink-3">Avatar letter</label>
            <input className={cx(field, "w-16 h-[36px] mt-1 text-center")} maxLength={1} value={profile.avatar} onChange={(e) => setProfile((p) => ({ ...p, avatar: e.target.value.toUpperCase() }))} aria-label="Avatar letter" />
          </div>
        </div>
        <div className="py-3 border-b border-paper-2">
          <label className="text-[11px] font-extrabold text-ink-3">Display name</label>
          <input className={cx(field, "mt-1")} value={profile.displayName} onChange={(e) => setProfile((p) => ({ ...p, displayName: e.target.value }))} aria-label="Display name" />
        </div>
        <div className="py-3 border-b border-paper-2">
          <label className="text-[11px] font-extrabold text-ink-3">Username</label>
          <input className={cx(field, "mt-1")} value={profile.username} onChange={(e) => setProfile((p) => ({ ...p, username: e.target.value.replace(/\s/g, "").toLowerCase() }))} aria-label="Username" />
        </div>
        <Row title="Email" sub={email} last />
        <div className="pb-3"><Button size="md" variant="green" onClick={save}>{saved ? "Saved ✓" : "Save changes"}</Button></div>
      </Section>

      <Section title="Appearance & accessibility">
        <Row title="Reduce motion" sub="Turns off celebrations and slide-ins">
          <Toggle checked={a11y.reducedMotion} onChange={(v) => setA11y((a) => ({ ...a, reducedMotion: v }))} label="Reduce motion" />
        </Row>
        <Row title="Text size">
          <div className="flex gap-[5px]" role="radiogroup" aria-label="Text size">
            {(["S", "M", "L"] as const).map((s) => (
              <button key={s} role="radio" aria-checked={a11y.textSize === s} onClick={() => setA11y((a) => ({ ...a, textSize: s }))}
                className={cx("w-9 h-8 rounded-[9px] text-[12px] font-black", a11y.textSize === s ? "bg-green text-cream-text" : "bg-paper border border-line text-ink-3")}>{s}</button>
            ))}
          </div>
        </Row>
        <Row title="Theme" sub="Dark arrives later" last><span className="text-[12.5px] font-extrabold text-ink-3">Light</span></Row>
      </Section>

      <Section title="Explanation level">
        <div className="py-3 flex flex-col gap-[6px]" role="radiogroup" aria-label="Explanation level">
          {LEVELS.map((l) => (
            <button key={l.id} role="radio" aria-checked={level === l.id} onClick={() => setLevel(l.id)}
              className={cx("flex items-center justify-between rounded-[12px] border px-3 py-[9px] text-left", level === l.id ? "border-green-2 bg-green-tint" : "border-line bg-paper")}>
              <span><span className="block text-[13px] font-black text-ink">{l.id}</span><span className="block text-[11px] font-bold text-ink-3">{l.who}</span></span>
              {level === l.id && <span className="text-green font-black">✓</span>}
            </button>
          ))}
        </div>
      </Section>

      <Section title="Notifications">
        {([["email", "Email notifications"], ["push", "Push notifications"], ["reminders", "Daily lesson reminder · 7:00 PM"], ["family", "Family streak & challenges"], ["club", "Club ideas I follow"], ["digest", "Weekly progress email"]] as const).map(([k, label], i, arr) => (
          <Row key={k} title={label} last={i === arr.length - 1}>
            <Toggle checked={notif[k]} onChange={(v) => setNotif((n) => ({ ...n, [k]: v }))} label={label} />
          </Row>
        ))}
      </Section>

      <Section title="Privacy">
        <div className="py-3">
          <div className="text-[13.5px] font-extrabold text-ink">Who can see your profile</div>
          <div className="mt-2 flex gap-[6px]" role="radiogroup" aria-label="Profile visibility">
            {([["community", "Community"], ["family", "Family only"], ["private", "Only me"]] as const).map(([v, l]) => (
              <button key={v} role="radio" aria-checked={privacy.visibility === v} onClick={() => setPrivacy({ visibility: v })}
                className={cx("flex-1 h-[32px] rounded-[10px] text-[11.5px] font-extrabold", privacy.visibility === v ? "bg-green text-cream-text" : "bg-paper border border-line text-ink-3")}>{l}</button>
            ))}
          </div>
          <p className="mt-2 text-[11px] font-bold text-ink-4">Young learners default to Family only and can&apos;t be found by search.</p>
        </div>
      </Section>

      <Section title="Security">
        <LinkRow title="Change password" sub="We email you a secure link" onClick={changePassword} last />
      </Section>

      <Section title="Account">
        <LinkRow title="Sign out" onClick={signOut} danger />
        <LinkRow title="Delete account" sub="Handled by support to protect family data" onClick={() => setDel(true)} danger last />
      </Section>
      {signingOut && <p className="mt-2 text-[12px] font-bold text-ink-3">Signing out…</p>}

      <Sheet open={pw.open} onClose={() => setPw({ open: false, state: "idle" })} title="Change password">
        {pw.state === "sending" && <p className="text-[14px] font-bold text-ink-2">Sending a reset link to {email}…</p>}
        {pw.state === "sent" && <p className="text-[14px] font-bold text-green">Sent. Open the link in your email to choose a new password.</p>}
        {pw.state === "error" && <p className="text-[14px] font-bold text-red">Couldn&apos;t send: {pw.msg}</p>}
      </Sheet>
      <Sheet open={del} onClose={() => setDel(false)} title="Delete account">
        <p className="text-[14px] font-bold text-ink-2 leading-[1.55]">Deleting removes your progress and, if you&apos;re a parent, affects your household&apos;s profiles. Email <b className="text-ink">support@familyinvestingclub.com</b> from your account address and we&apos;ll handle it within 2 business days.</p>
      </Sheet>
    </div>
  );
}
