"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";
import { TopBar } from "@/components/shell/TopBar";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(params.get("error") === "link" ? "That link didn't work — try signing in or request a new one below." : null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    router.replace("/home");
  }

  const field = "w-full h-[50px] rounded-[14px] border border-line bg-card px-4 text-[15px] font-bold text-ink placeholder:text-ink-4 outline-none focus:border-green";
  return (
    <>
      <TopBar backHref="/welcome" />
      <div className="px-[22px] pt-4 flex-1 flex flex-col">
        <div className="w-14 h-14 rounded-[18px] bg-green text-cream-text font-black text-[18px] flex items-center justify-center">FIC</div>
        <h1 className="mt-5 text-[26px] font-black text-ink leading-tight">Welcome back</h1>
        <p className="mt-1 text-[14px] font-bold text-ink-3">Sign in to pick up where you left off.</p>
        <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
          <input className={field} type="email" autoComplete="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className={field} type="password" autoComplete="current-password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Link href="/forgot-password" className="self-end -mt-1 text-[12.5px] font-extrabold text-green">Forgot password?</Link>
          {err && <p className="text-[13px] font-bold text-red">{err}</p>}
          <Button type="submit" full disabled={busy} className="mt-2">{busy ? "Signing in…" : "Sign in"}</Button>
        </form>
        <p className="mt-auto pb-8 text-center text-[13px] font-bold text-ink-3">
          New here? <Link href="/signup" className="text-green font-extrabold">Create an account</Link>
        </p>
      </div>
    </>
  );
}
export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>;
}
