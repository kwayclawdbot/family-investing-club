"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { TopBar } from "@/components/shell/TopBar";
import { familyApi } from "@/lib/live/client-family";

type Invite = { familyName: string; inviter: string; role: "parent" | "child" } | null;

export function JoinClient({ code, invite, me }: { code: string; invite: Invite; me: { name: string; familyName: string | null; isChild: boolean } }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<{ kind: "family" | "club"; name: string; role?: string } | null>(null);

  async function join() {
    setBusy(true); setErr(null);
    const r = await familyApi.join(code);
    setBusy(false);
    if (!r.ok) { setErr(r.error); return; }
    setDone({ kind: r.kind, name: r.kind === "family" ? (invite?.familyName ?? r.club.name) : r.club.name, role: r.role });
    router.refresh();
  }

  return (
    <>
      <TopBar backHref="/home" />
      <div className="px-[22px] pt-4 flex-1 flex flex-col overflow-y-auto no-scrollbar">
        <Link href="/welcome" className="w-14 h-14 rounded-[18px] bg-green text-cream-text font-black text-[18px] flex items-center justify-center">FIC</Link>
        {done ? (
          <>
            <h1 className="mt-5 text-[26px] font-black text-ink leading-tight">You&apos;re in 🎉</h1>
            <p className="mt-1 text-[14px] font-bold text-ink-3">{done.kind === "family" ? `Welcome to ${done.name}.` : `You joined ${done.name}.`}{done.role === "child" ? " Your account is a protected learner account — practice money only, family chat only." : ""}</p>
            <Button full className="mt-6" onClick={() => router.replace(done.role === "parent" ? "/onboarding/who" : "/home")}>{done.role === "parent" ? "Finish setting up →" : "Go to Home →"}</Button>
          </>
        ) : invite ? (
          <>
            <div className="mt-5 bg-green-tint border border-green-line rounded-card px-4 py-4">
              <div className="text-[11px] font-black text-green tracking-[0.5px]">YOU&apos;VE BEEN INVITED TO JOIN</div>
              <div className="mt-1 text-[22px] font-black text-ink leading-tight">{invite.familyName}</div>
              <div className="mt-1 text-[12.5px] font-bold text-ink-3">by {invite.inviter} · as a {invite.role === "parent" ? "parent" : "learner"}</div>
            </div>
            <h1 className="mt-5 text-[22px] font-black text-ink leading-tight">Join as {me.name || "yourself"}?</h1>
            {me.familyName && <p className="mt-2 text-[13px] font-bold text-orange-2">You&apos;re currently in {me.familyName}. Joining moves your account to {invite.familyName}.</p>}
            {invite.role === "child" && !me.isChild && <p className="mt-2 text-[12.5px] font-bold text-ink-3">This invite creates a learner account: practice money only, family chat only, guardian controls apply.</p>}
            {err && <p className="mt-3 text-[13px] font-bold text-red" role="alert">{err}</p>}
            <Button full className="mt-6" onClick={join} disabled={busy}>{busy ? "Joining…" : `Join ${invite.familyName} →`}</Button>
            <Link href="/home" className="mt-3 text-center text-[13px] font-extrabold text-ink-3">Not now</Link>
          </>
        ) : (
          <>
            <h1 className="mt-5 text-[26px] font-black text-ink leading-tight">Is this a club code?</h1>
            <p className="mt-1 text-[14px] font-bold text-ink-3">We couldn&apos;t find a household invite for <b className="text-ink tracking-[1px]">{code}</b> — it may have expired or already been used. If it&apos;s an investing-club code, try joining the club instead.</p>
            {err && <p className="mt-3 text-[13px] font-bold text-red" role="alert">{err}</p>}
            <Button full variant="green" className="mt-6" onClick={join} disabled={busy}>{busy ? "Checking…" : "Join the club with this code"}</Button>
            <Link href="/home" className="mt-3 text-center text-[13px] font-extrabold text-ink-3">Back to Home</Link>
          </>
        )}
        <p className="mt-auto pt-6 pb-8 text-center text-[11px] font-bold text-ink-4">Education only — never investment advice. Practice money, real learning.</p>
      </div>
    </>
  );
}
