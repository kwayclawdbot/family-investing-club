"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, cx } from "@/components/ui";
import { adminApi } from "@/lib/live/client-admin";
import { Label, Notice, field } from "./ui";

const MODE_COPY: Record<string, string> = {
  invited: "Invite email sent (Resend). They'll set a password and land in onboarding.",
  invited_via_supabase: "Account created and Supabase's own invite email sent.",
  invited_email_failed: "Account created but the invite email failed — resend from Supabase Auth.",
  activated: "Existing member — their family's enrollment is active now.",
  pending: "They have an account but no family yet; the membership claims itself when onboarding finishes.",
};

/** Admin invite / membership grant → POST /api/admin/invite (service-role provisioning). */
export function InviteForm({ compact }: { compact?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(!compact);
  const [email, setEmail] = useState("");
  const [program, setProgram] = useState<"fic" | "fta">("fic");
  const [door, setDoor] = useState<"family" | "club">("family");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "green" | "red" | "orange"; text: string } | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    const r = await adminApi.invite({ email, program, door });
    setBusy(false);
    if (!r.ok) { setMsg({ tone: "red", text: r.error }); return; }
    setMsg({ tone: r.mode === "invited_email_failed" ? "orange" : "green", text: `${MODE_COPY[r.mode] ?? r.mode}${r.note ? ` (${r.note})` : ""}` });
    setEmail(""); router.refresh();
  };
  if (compact && !open) return <Button size="md" onClick={() => setOpen(true)}>Invite a member</Button>;
  return (
    <form onSubmit={submit} className={cx("rounded-card border border-line bg-card p-4 space-y-3", compact && "w-full max-w-[520px]")}>
      <div className="flex items-center justify-between"><div className="text-[13px] font-black text-ink">Invite / grant membership</div>{compact && <button type="button" onClick={() => setOpen(false)} className="text-[12px] font-extrabold text-ink-3">Close</button>}</div>
      <div><Label>Email</Label><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={field} placeholder="parent@example.com" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Program</Label><select value={program} onChange={(e) => setProgram(e.target.value as "fic" | "fta")} className={field}><option value="fic">FIC — Club membership</option><option value="fta">FTA — Academy</option></select></div>
        <div><Label>Door</Label><select value={door} onChange={(e) => setDoor(e.target.value as "family" | "club")} className={field}><option value="family">Family (household)</option><option value="club">Club (solo)</option></select></div>
      </div>
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
      <Button size="md" type="submit" disabled={busy || !email}>{busy ? "Sending…" : "Send invite"}</Button>
    </form>
  );
}
