"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, cx } from "@/components/ui";
import { familyApi } from "@/lib/live/client-family";
import type { FamilyInvite } from "@/lib/live/family";

type Kind = "kids" | "teens" | "parent";
const KINDS: { id: Kind; label: string; sub: string }[] = [
  { id: "kids", label: "Child · Explorer", sub: "Under 13 · stories & pictures" },
  { id: "teens", label: "Teen · Builder", sub: "13–17 · numbers & scenarios" },
  { id: "parent", label: "Parent", sub: "Full household controls" },
];
const field = "w-full h-[46px] rounded-[12px] border border-line bg-card px-4 text-[14px] font-bold text-ink placeholder:text-ink-4 outline-none focus:border-green";

function joinLink(code: string) { return `${typeof window !== "undefined" ? window.location.origin : ""}/join/${code}`; }

/** Real household invites on FTA `family_invites`: create (7-day code), share the /join link, revoke. */
export function InviteManager({ invites, familyName }: { invites: FamilyInvite[]; familyName: string }) {
  const router = useRouter();
  const [kind, setKind] = useState<Kind>("kids");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [created, setCreated] = useState<{ code: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setErr("Enter a valid email, or leave it blank."); return; }
    setBusy(true); setErr(null);
    const r = await familyApi.invite({ role: kind === "parent" ? "parent" : "child", ageGroup: kind === "parent" ? undefined : kind, email: email || undefined });
    setBusy(false);
    if (!r.ok) { setErr(r.error); return; }
    setCreated({ code: r.code }); setEmail("");
    router.refresh();
  }
  async function share(code: string) {
    const link = joinLink(code);
    const text = `Join ${familyName} on Family Investing Club: ${link} (code ${code})`;
    try {
      if (navigator.share) { await navigator.share({ text, url: link }); return; }
      await navigator.clipboard.writeText(link);
      setCopied(code); setTimeout(() => setCopied(null), 1600);
    } catch { /* cancelled */ }
  }
  async function revoke(id: string) {
    setErr(null);
    const r = await familyApi.revokeInvite(id);
    if (!r.ok) { setErr(r.error); return; }
    if (created && invites.find((i) => i.id === id)?.code === created.code) setCreated(null);
    router.refresh();
  }
  const open = invites.filter((i) => !i.used && !i.expired);
  const past = invites.filter((i) => i.used || i.expired).slice(0, 5);

  return (
    <div className="pb-6">
      {created && (
        <div className="bg-green-tint border border-green-line rounded-card px-4 py-4 text-center">
          <div className="text-[11px] font-black text-green tracking-[0.5px]">NEW INVITE CODE</div>
          <div className="mt-1 text-[28px] font-black text-ink tracking-[2px]">{created.code}</div>
          <div className="mt-1 text-[12px] font-bold text-ink-3">They sign up (or sign in), then enter the code at /join. Good for 7 days.</div>
          <Button size="md" variant="green" onClick={() => share(created.code)} className="mt-3">{copied === created.code ? "Link copied!" : "Share link"}</Button>
        </div>
      )}

      <h2 className="mt-5 mb-2 text-[15px] font-black text-ink">Invite someone</h2>
      <form onSubmit={create} className="bg-card border border-line rounded-card px-4 py-4">
        <div className="text-[11px] font-black text-ink-3 tracking-[0.5px]">WHO</div>
        <div className="mt-[6px] flex flex-col gap-[6px]" role="radiogroup" aria-label="Who are you inviting">
          {KINDS.map((k) => (
            <button key={k.id} type="button" role="radio" aria-checked={kind === k.id} onClick={() => setKind(k.id)} className={cx("flex items-center justify-between rounded-[12px] border px-3 py-[9px] text-left", kind === k.id ? "border-green-2 bg-green-tint" : "border-line bg-paper")}>
              <span><span className="block text-[13px] font-black text-ink">{k.label}</span><span className="block text-[10.5px] font-bold text-ink-3">{k.sub}</span></span>
              {kind === k.id && <span className="text-green font-black">✓</span>}
            </button>
          ))}
        </div>
        <div className="mt-3 text-[11px] font-black text-ink-3 tracking-[0.5px]">EMAIL (OPTIONAL)</div>
        <input className={cx(field, "mt-[6px]")} type="email" placeholder="them@example.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" />
        {err && <p className="mt-2 text-[12px] font-bold text-red">{err}</p>}
        <Button type="submit" size="md" full className="mt-3" disabled={busy}>{busy ? "Creating…" : "Create invite code"}</Button>
        <p className="mt-2 text-[11px] font-bold text-ink-4">Kids join by invite only. A child&apos;s account is protected: practice money, family chat only, guardian controls.</p>
      </form>

      <h2 className="mt-5 mb-2 text-[15px] font-black text-ink">Open invites</h2>
      {open.length === 0 ? (
        <div className="bg-card border border-line rounded-card px-4 py-4 text-center text-[13px] font-bold text-ink-3">No open invites.</div>
      ) : (
        <div className="bg-card border border-line rounded-card px-4 py-1">
          {open.map((i, idx) => (
            <div key={i.id} className={cx("flex items-center gap-3 py-[10px]", idx < open.length - 1 && "border-b border-paper-2")}>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-black text-ink tracking-[1px]">{i.code}</div>
                <div className="text-[11px] font-bold text-ink-3 truncate">{i.role === "parent" ? "Parent" : i.ageGroup === "teens" ? "Teen" : "Child"}{i.email ? ` · ${i.email}` : ""} · expires {new Date(i.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
              </div>
              <button type="button" onClick={() => share(i.code)} className="text-[12px] font-extrabold text-green">{copied === i.code ? "Copied" : "Share"}</button>
              <button type="button" onClick={() => revoke(i.id)} className="text-[12px] font-extrabold text-red">Revoke</button>
            </div>
          ))}
        </div>
      )}
      {past.length > 0 && (
        <div className="mt-2 bg-paper-2 border border-line rounded-card px-4 py-1">
          {past.map((i, idx) => (
            <div key={i.id} className={cx("flex items-center justify-between py-2 text-[11.5px] font-bold text-ink-4", idx < past.length - 1 && "border-b border-line")}>
              <span>{i.code} · {i.role === "parent" ? "Parent" : "Child"}</span><span>{i.used ? "Used ✓" : "Expired"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
