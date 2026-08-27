"use client";
import { useState } from "react";
import { Button, cx } from "@/components/ui";
import { useLocal, useShare } from "@/components/profile/useLocal";

type Invite = { email: string; at: string };
type Child = { name: string; level: "Explorer" | "Builder" };
const field = "w-full h-[46px] rounded-[12px] border border-line bg-card px-4 text-[14px] font-bold text-ink placeholder:text-ink-4 outline-none focus:border-green";

export function InviteManager({ code, seats }: { code: string; seats: { used: number; max: number } }) {
  const { share, copied } = useShare(`Join our family on Family Investing Club — code ${code}`, code);
  const [invites, setInvites] = useLocal<Invite[]>("fic.invites", []);
  const [kids, setKids] = useLocal<Child[]>("fic.children", []);
  const [email, setEmail] = useState("");
  const [emailErr, setEmailErr] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [kidName, setKidName] = useState("");
  const [kidLevel, setKidLevel] = useState<"Explorer" | "Builder">("Explorer");
  const used = seats.used + invites.length + kids.length;

  function invite(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setEmailErr("Enter a valid email."); return; }
    if (used >= seats.max) { setEmailErr("All seats are used — upgrade your plan to add more."); return; }
    setEmailErr(null);
    setInvites((v) => [...v, { email: email.trim().toLowerCase(), at: "just now" }]);
    setEmail(""); setSent(true); setTimeout(() => setSent(false), 2500);
  }
  function addKid(e: React.FormEvent) {
    e.preventDefault();
    if (!kidName.trim() || used >= seats.max) return;
    setKids((k) => [...k, { name: kidName.trim(), level: kidLevel }]);
    setKidName("");
  }

  return (
    <div className="pb-6">
      <div className="bg-green-tint border border-green-line rounded-card px-4 py-4 text-center">
        <div className="text-[11px] font-black text-green tracking-[0.5px]">YOUR FAMILY CODE</div>
        <div className="mt-1 text-[28px] font-black text-ink tracking-[2px]">{code}</div>
        <div className="mt-1 text-[12px] font-bold text-ink-3">Anyone with this code joins your household.</div>
        <Button size="md" variant="green" onClick={share} className="mt-3">{copied ? "Copied!" : "Share code"}</Button>
      </div>
      <div className="mt-2 text-center text-[12px] font-extrabold text-ink-3">{used} of {seats.max} seats used</div>

      <h2 className="mt-5 mb-2 text-[15px] font-black text-ink">Invite by email</h2>
      <form onSubmit={invite} className="bg-card border border-line rounded-card px-4 py-4">
        <input className={field} type="email" placeholder="parent@example.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" />
        {emailErr && <p className="mt-2 text-[12px] font-bold text-red">{emailErr}</p>}
        {sent && <p className="mt-2 text-[12px] font-bold text-green">Invite sent (pending) — they&apos;ll get a link.</p>}
        <Button type="submit" size="md" full className="mt-3">Send invite</Button>
      </form>
      {invites.length > 0 && (
        <div className="mt-2 bg-card border border-line rounded-card px-4 py-1">
          {invites.map((i, idx) => (
            <div key={i.email} className={cx("flex items-center justify-between py-[10px]", idx < invites.length - 1 && "border-b border-paper-2")}>
              <div>
                <div className="text-[13px] font-extrabold text-ink">{i.email}</div>
                <div className="text-[11px] font-bold text-ink-3">Pending · sent {i.at}</div>
              </div>
              <button onClick={() => setInvites((v) => v.filter((x) => x.email !== i.email))} className="text-[12px] font-extrabold text-red">Cancel</button>
            </div>
          ))}
        </div>
      )}

      <h2 className="mt-5 mb-2 text-[15px] font-black text-ink">Create a child profile</h2>
      <form onSubmit={addKid} className="bg-card border border-line rounded-card px-4 py-4">
        <input className={field} placeholder="Child's first name" value={kidName} onChange={(e) => setKidName(e.target.value)} aria-label="Child's first name" />
        <div className="mt-3 text-[11px] font-black text-ink-3 tracking-[0.5px]">AGE GROUP</div>
        <div className="mt-[6px] flex gap-[6px]" role="radiogroup" aria-label="Age group">
          {([["Explorer", "Under 10 · stories & pictures"], ["Builder", "10–14 · numbers & scenarios"]] as const).map(([v, l]) => (
            <button key={v} type="button" role="radio" aria-checked={kidLevel === v} onClick={() => setKidLevel(v)}
              className={cx("flex-1 rounded-[12px] border px-3 py-[9px] text-left", kidLevel === v ? "border-green-2 bg-green-tint" : "border-line bg-paper")}>
              <span className="block text-[13px] font-black text-ink">{v}</span>
              <span className="block text-[10.5px] font-bold text-ink-3">{l}</span>
            </button>
          ))}
        </div>
        <Button type="submit" size="md" variant="green" full className="mt-3" disabled={!kidName.trim() || used >= seats.max}>Create profile</Button>
        <p className="mt-2 text-[11px] font-bold text-ink-4">Kids sign in with a family PIN — no email needed. Guardian controls apply automatically.</p>
      </form>
      {kids.length > 0 && (
        <div className="mt-2 flex flex-col gap-2">
          {kids.map((k) => (
            <div key={k.name} className="bg-card border border-line rounded-card px-4 py-3 flex items-center gap-3">
              <span className="w-9 h-9 rounded-full bg-gold text-white font-black flex items-center justify-center">{k.name[0]}</span>
              <div className="flex-1">
                <div className="text-[13px] font-black text-ink">{k.name}</div>
                <div className="text-[11px] font-bold text-ink-3">{k.level} level · profile ready</div>
              </div>
              <span className="text-[11px] font-extrabold text-green">New</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
