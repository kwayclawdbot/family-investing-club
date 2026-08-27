"use client";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AuthShell } from "@/components/auth/AuthShell";

const label = "text-[10px] font-black text-ink-3";
const input = "mt-[5px] w-full rounded-[13px] border-[1.5px] border-line bg-card px-[15px] py-3 text-[14px] font-extrabold text-ink placeholder:text-ink-4 placeholder:font-bold outline-none focus:border-green-2 focus:border-2";

/** Prototype v2 `signup` — Create your account. */
export default function SignupPage() {
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false); const [err, setErr] = useState<string | null>(null); const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { setErr("Password needs at least 8 characters."); return; }
    setBusy(true); setErr(null);
    const { error } = await createClient().auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding/who`, data: { display_name: name } } });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setDone(true);
  }
  async function oauth(provider: "apple" | "google") {
    setErr(null);
    const { error } = await createClient().auth.signInWithOAuth({ provider, options: { redirectTo: `${window.location.origin}/auth/callback?next=/onboarding/who` } });
    if (error) setErr(`${provider === "apple" ? "Apple" : "Google"} sign-in isn't enabled yet — use email for now.`);
  }
  if (done) return (
    <AuthShell backHref="/welcome" title="Check your email" sub={`We sent a confirmation link to ${email}. Open it on this device to finish setting up.`} footer={<>Wrong address? <button onClick={() => setDone(false)} className="text-green font-extrabold">Try again</button></>}>
      <div className="bg-green-tint border border-green-line rounded-card px-4 py-5 text-center"><div className="text-[30px]">📬</div><div className="mt-2 text-[13px] font-bold text-ink-2">Didn&apos;t arrive? Check spam, then <Link href="/login" className="text-green font-extrabold">sign in</Link> to resend.</div></div>
    </AuthShell>
  );
  return (
    <AuthShell backHref="/welcome" title="Create your account" sub="Free to start · no brokerage required · kids join by invite only" footer={<>Already a member? <Link href="/login" className="text-green font-extrabold">Sign in</Link></>}>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <div><div className={label}>FULL NAME</div><input className={input} autoComplete="name" placeholder="Kway Mensah" value={name} onChange={(e) => setName(e.target.value)} required /></div>
        <div><div className={label}>EMAIL</div><input className={input} type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
        <div><div className={label}>PASSWORD</div><div className="relative"><input className={input} type={show ? "text" : "password"} autoComplete="new-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} /><button type="button" aria-label={show ? "Hide password" : "Show password"} onClick={() => setShow((v) => !v)} className="absolute right-[14px] top-[19px] text-[12px] font-extrabold text-ink-3">👁</button></div></div>
        <div className="flex items-center gap-[10px] my-1"><span className="flex-1 h-px bg-line-3" /><span className="text-[10px] font-extrabold text-ink-4">OR</span><span className="flex-1 h-px bg-line-3" /></div>
        <div className="flex gap-2">
          <button type="button" onClick={() => oauth("apple")} className="flex-1 h-[46px] rounded-[13px] bg-[#2E2A21] text-cream-text text-[13px] font-black"> Apple</button>
          <button type="button" onClick={() => oauth("google")} className="flex-1 h-[46px] rounded-[13px] bg-card border border-line text-ink text-[13px] font-black"><span className="text-[#4285F4]">G</span> Google</button>
        </div>
        {err && <p className="text-[12px] font-bold text-red">{err}</p>}
        <p className="text-[10px] font-bold text-ink-4 text-center leading-[1.5]">By continuing you agree to the Terms &amp; Privacy Policy.<br />Education only — never investment advice.</p>
        <button type="submit" disabled={busy} className="w-full h-[52px] rounded-[16px] bg-orange text-cream-text text-[16px] font-black shadow-[0_3px_0_#C96D25] disabled:opacity-60">{busy ? "Creating…" : "Create account →"}</button>
      </form>
    </AuthShell>
  );
}
