"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StepShell, Title, Subtitle, Cta, Check } from "./StepShell";
import { readAnswers, writeAnswers, writeClub, nextStep, type OnboardingAnswers } from "./store";
import { api } from "@/lib/live/client";

type Kind = NonNullable<OnboardingAnswers["clubKind"]>;
type Privacy = NonNullable<OnboardingAnswers["clubPrivacy"]>;
const KINDS: { id: Kind; label: string }[] = [
  { id: "family", label: "👨‍👩‍👧‍👦 Family" },
  { id: "friends", label: "Friends" },
  { id: "mixed", label: "Mixed" },
];
const PRIVACY: { id: Privacy; icon: string; title: string; sub: string }[] = [
  { id: "private", icon: "🔒", title: "Private", sub: "Invite-only. Picks, votes & talk stay inside." },
  { id: "public", icon: "🌍", title: "Public", sub: "Anyone can follow · picks visible to the network" },
];

/** Compact create-club step (artboard 01, inside onboarding). Decisions are preset; change anytime in My Club. */
export function CreateStep() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<Kind>("family");
  const [privacy, setPrivacy] = useState<Privacy>("private");
  useEffect(() => {
    const a = readAnswers();
    /* eslint-disable react-hooks/set-state-in-effect -- hydrate from localStorage after mount */
    if (a.clubName) setName(a.clubName);
    if (a.clubKind) setKind(a.clubKind);
    if (a.clubPrivacy) setPrivacy(a.clubPrivacy);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function next() {
    if (busy) return;
    const clubName = name.trim() || "My Investing Club";
    writeAnswers({ clubName, clubKind: kind, clubPrivacy: privacy });
    setBusy(true); setErr(null);
    // Signed in → the family (tenant) + club are created server-side, idempotently. 401 = demo visitor: keep the local prototype path.
    const res = await api.ensureFamily({ name: clubName, kind, privacy });
    setBusy(false);
    if (!res.ok && !/sign in/i.test(res.error)) { setErr(res.error); return; }
    if (res.ok) writeAnswers({ inviteCode: res.inviteCode });
    else writeClub({ name: clubName, kind, privacy });
    router.push(nextStep("create"));
  }

  return (
    <StepShell step="create" cta={<Cta onClick={next}>{busy ? "Creating…" : "Create Club → Continue"}</Cta>}>
      {err && <p role="alert" className="mt-3 text-[12.5px] font-bold text-coral">{err}</p>}
      <Title>Create your club</Title>
      <Subtitle>Name it, say who it&apos;s for, keep it private. Everything else is preset — change it anytime.</Subtitle>

      <div className="mt-5 text-[11px] font-black text-ink-3">CLUB NAME</div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        aria-label="Club name"
        placeholder="e.g. The Coffie Family Investing Club"
        className="mt-[6px] w-full h-[48px] rounded-[12px] border border-line bg-card px-4 text-[14.5px] font-extrabold text-ink outline-none focus:border-green-2"
      />

      <div className="mt-4 text-[11px] font-black text-ink-3">WHO&apos;S IT FOR?</div>
      <div className="mt-[6px] flex gap-2" role="radiogroup">
        {KINDS.map((k) => (
          <button
            key={k.id}
            type="button"
            role="radio"
            aria-checked={kind === k.id}
            onClick={() => setKind(k.id)}
            className={`flex-1 h-[38px] rounded-[11px] text-[12.5px] font-extrabold ${kind === k.id ? "bg-green-tint border-2 border-green-2 text-ink" : "bg-card border-[1.5px] border-line text-ink-2"}`}
          >
            {k.label}
          </button>
        ))}
      </div>

      <div className="mt-4 text-[11px] font-black text-ink-3">PRIVACY</div>
      <div className="mt-[6px] flex flex-col gap-2" role="radiogroup">
        {PRIVACY.map((p) => (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={privacy === p.id}
            onClick={() => setPrivacy(p.id)}
            className={`w-full text-left bg-card rounded-[14px] flex items-center gap-3 px-4 py-3 ${privacy === p.id ? "border-2 border-green-2" : "border-[1.5px] border-line"}`}
          >
            <span className="text-[18px]" aria-hidden>{p.icon}</span>
            <span className="flex-1">
              <span className="block text-[14px] font-extrabold text-ink">{p.title}</span>
              <span className="block text-[11.5px] font-semibold text-ink-3">{p.sub}</span>
            </span>
            {privacy === p.id && <Check />}
          </button>
        ))}
      </div>

      <div className="mt-4 bg-card border border-line rounded-[14px] px-[15px] py-[6px]">
        <div className="text-[10.5px] font-black text-ink-3 pt-2">HOW DECISIONS WORK · CHANGE ANYTIME</div>
        {[["Portfolio votes", "Majority"], ["Kids can vote", "On"], ["Weekly club prompt", "Thu 7 PM"]].map(([k, v], i) => (
          <div key={k} className={`flex items-center justify-between py-[9px] ${i < 2 ? "border-b border-paper-2" : ""}`}>
            <span className="text-[13px] font-extrabold text-ink">{k}</span>
            <span className="text-[12px] font-extrabold text-ink-3">{v} ›</span>
          </div>
        ))}
      </div>
    </StepShell>
  );
}
