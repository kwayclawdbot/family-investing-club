"use client";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, cx } from "@/components/ui";
import { AuthShell, field } from "@/components/auth/AuthShell";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [who, setWho] = useState<"parent" | "solo">("parent");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { setErr("Password needs at least 8 characters."); return; }
    setBusy(true); setErr(null);
    const { error } = await createClient().auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding/who`, data: { fic_role: who } },
    });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setDone(true);
  }

  if (done) {
    return (
      <AuthShell backHref="/welcome" title="Check your email" sub={`We sent a confirmation link to ${email}. Open it on this device to finish setting up.`}
        footer={<>Wrong address? <button onClick={() => setDone(false)} className="text-green font-extrabold">Try again</button></>}>
        <div className="bg-green-tint border border-green-line rounded-card px-4 py-5 text-center">
          <div className="text-[30px]">📬</div>
          <div className="mt-2 text-[13px] font-bold text-ink-2">Didn&apos;t arrive? Check spam, then <Link href="/login" className="text-green font-extrabold">sign in</Link> to resend.</div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell backHref="/welcome" title="Create your account" sub="Free to start. Families learn together on one plan."
      footer={<>Already a member? <Link href="/login" className="text-green font-extrabold">Sign in</Link></>}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <div className="flex gap-2" role="radiogroup" aria-label="Who are you">
          {([["parent", "I'm a parent", "👨‍👩‍👧‍👦"], ["solo", "I'm learning solo", "🌱"]] as const).map(([v, l, e]) => (
            <button key={v} type="button" role="radio" aria-checked={who === v} onClick={() => setWho(v)}
              className={cx("flex-1 rounded-[14px] border px-3 py-3 text-left", who === v ? "border-green-2 bg-green-tint" : "border-line bg-card")}>
              <span className="block text-[18px]">{e}</span>
              <span className="block mt-1 text-[13px] font-black text-ink">{l}</span>
            </button>
          ))}
        </div>
        <input className={field} type="email" autoComplete="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className={field} type="password" autoComplete="new-password" placeholder="Password (8+ characters)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        {err && <p className="text-[13px] font-bold text-red">{err}</p>}
        <Button type="submit" full disabled={busy} className="mt-2">{busy ? "Creating…" : "Create account"}</Button>
        <p className="text-[11px] font-bold text-ink-4 text-center leading-[1.5]">By continuing you agree to the Terms and Privacy Policy. Kids&apos; profiles are created by a parent after sign-up.</p>
      </form>
    </AuthShell>
  );
}
