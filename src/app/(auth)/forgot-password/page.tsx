"use client";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";
import { AuthShell, field } from "@/components/auth/AuthShell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const { error } = await createClient().auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?next=/reset-password` });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setSent(true);
  }

  return (
    <AuthShell backHref="/login" title={sent ? "Check your email" : "Forgot your password?"}
      sub={sent ? `If ${email} has an account, a reset link is on its way.` : "Enter your email and we'll send a link to choose a new one."}
      footer={<>Remembered it? <Link href="/login" className="text-green font-extrabold">Sign in</Link></>}>
      {sent ? (
        <div className="bg-green-tint border border-green-line rounded-card px-4 py-5 text-center">
          <div className="text-[30px]">🔑</div>
          <div className="mt-2 text-[13px] font-bold text-ink-2">The link is single-use and expires in about an hour.</div>
          <button onClick={() => setSent(false)} className="mt-3 text-[13px] font-extrabold text-green">Send again</button>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-3">
          <input className={field} type="email" autoComplete="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          {err && <p className="text-[13px] font-bold text-red">{err}</p>}
          <Button type="submit" full disabled={busy} className="mt-2">{busy ? "Sending…" : "Send reset link"}</Button>
        </form>
      )}
    </AuthShell>
  );
}
