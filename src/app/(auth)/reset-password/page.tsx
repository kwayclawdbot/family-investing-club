"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";
import { AuthShell, field } from "@/components/auth/AuthShell";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    createClient().auth.getSession().then(({ data }) => setHasSession(!!data.session)).catch(() => setHasSession(false));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) { setErr("Use at least 8 characters."); return; }
    if (pw !== pw2) { setErr("Passwords don't match."); return; }
    setBusy(true); setErr(null);
    const { error } = await createClient().auth.updateUser({ password: pw });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    router.replace("/home");
  }

  return (
    <AuthShell backHref="/login" title="Choose a new password" sub="Then you'll be signed in and sent home."
      footer={<>Link expired? <Link href="/forgot-password" className="text-green font-extrabold">Request a new one</Link></>}>
      {hasSession === false && (
        <div className="mb-3 bg-orange-tint border border-orange-line rounded-card px-4 py-3 text-[12.5px] font-bold text-orange-2">
          This page only works from a reset link. <Link href="/forgot-password" className="font-extrabold underline">Get a link</Link>.
        </div>
      )}
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input className={field} type="password" autoComplete="new-password" placeholder="New password" value={pw} onChange={(e) => setPw(e.target.value)} required minLength={8} />
        <input className={field} type="password" autoComplete="new-password" placeholder="Repeat new password" value={pw2} onChange={(e) => setPw2(e.target.value)} required minLength={8} />
        {err && <p className="text-[13px] font-bold text-red">{err}</p>}
        <Button type="submit" full disabled={busy || hasSession === false} className="mt-2">{busy ? "Saving…" : "Save password"}</Button>
      </form>
    </AuthShell>
  );
}
