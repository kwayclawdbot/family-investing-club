"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, cx } from "@/components/ui";
import { MemberAvatar } from "./MemberAvatar";
import { familyApi } from "@/lib/live/client-family";
import type { NightState } from "@/lib/live/family";

type Step = "pick" | "talk" | "who" | "done";
const STEPS: { id: Step; label: string }[] = [{ id: "pick", label: "The pick" }, { id: "talk", label: "Talk about it" }, { id: "who", label: "Who came" }, { id: "done", label: "XP" }];

/**
 * Family Investing Night as one flow: vote on tonight's company (family_watchlist_votes), talk it through,
 * mark who showed up, then a parent records it (POST /api/family/night → xp_events + family_night_sessions).
 */
export function FamilyNightFlow({ night }: { night: NightState }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(night.leader ? "talk" : "pick");
  const [q, setQ] = useState(0);
  const [present, setPresent] = useState<string[]>(() => night.members.filter((m) => night.alreadyPaid.includes(m.id)).map((m) => m.id));
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [results, setResults] = useState<{ id: string; awarded: boolean; alreadyAwarded: boolean; xp: number }[] | null>(null);
  const idx = STEPS.findIndex((s) => s.id === step);

  async function vote(ticker: string) {
    setBusy(ticker); setErr(null);
    const r = night.myVote === ticker ? await familyApi.clearVote() : await familyApi.vote(ticker);
    setBusy(null);
    if (!r.ok) { setErr(r.error); return; }
    router.refresh();
  }
  async function record() {
    setBusy("record"); setErr(null);
    const r = await familyApi.recordNight({ night: night.night, attendeeIds: present, ticker: night.leader?.ticker, companyName: night.leader?.name });
    setBusy(null);
    if (!r.ok) { setErr(r.error); return; }
    setResults(r.results); setStep("done"); router.refresh();
  }
  const toggle = (id: string) => setPresent((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  return (
    <div className="pb-6">
      <div className="flex gap-1" aria-label="Steps">
        {STEPS.map((s, i) => (
          <button key={s.id} type="button" onClick={() => i <= idx && setStep(s.id)} className={cx("flex-1 rounded-[8px] px-1 py-[6px] text-[10px] font-extrabold", i === idx ? "bg-purple-2 text-cream-text" : i < idx ? "bg-purple-tint text-purple-2" : "bg-paper-2 text-ink-4")}>{i + 1}. {s.label}</button>
        ))}
      </div>

      {step === "pick" && (
        <div className="mt-3">
          <h2 className="text-[15px] font-black text-ink">Which company should we learn about tonight?</h2>
          <p className="mt-1 text-[12.5px] font-bold text-ink-3">One vote each. Changing your mind just moves your vote.</p>
          {night.options.length === 0 ? (
            <div className="mt-3 bg-card border border-line rounded-card px-4 py-5 text-center">
              <div className="text-[13px] font-black text-ink">The family list is empty</div>
              <p className="mt-1 text-[12px] font-bold text-ink-3">Add a brand you all use, then come back and vote.</p>
              <Link href="/family/research" className="inline-flex mt-3 h-[36px] px-4 items-center rounded-[12px] bg-green text-cream-text text-[13px] font-black">Add a company</Link>
            </div>
          ) : (
            <div className="mt-3 bg-card border border-line rounded-card px-4 py-1">
              {night.options.map((o, i) => {
                const mine = night.myVote === o.ticker;
                return (
                  <div key={o.id} className={cx("flex items-center gap-3 py-3", i < night.options.length - 1 && "border-b border-paper-2")}>
                    <span className="w-10 h-10 rounded-[10px] bg-green-tint text-green text-[11px] font-black flex items-center justify-center">{o.ticker}</span>
                    <div className="flex-1 min-w-0"><div className="text-[13.5px] font-black text-ink truncate">{o.name}</div><div className="text-[11px] font-bold text-ink-3">{o.votes ? `${o.votes} vote${o.votes > 1 ? "s" : ""} · ${o.voters.join(", ")}` : "No votes yet"}</div></div>
                    <button type="button" onClick={() => vote(o.ticker)} disabled={busy !== null} aria-pressed={mine} className={cx("h-[30px] px-3 rounded-[10px] text-[11.5px] font-extrabold", mine ? "bg-purple-2 text-cream-text" : "bg-purple-tint text-purple-2")}>{mine ? "Voted ✓" : "Vote"}</button>
                  </div>
                );
              })}
            </div>
          )}
          {night.leader && <Button size="md" variant="purple" full className="mt-3" onClick={() => setStep("talk")}>Tonight: {night.leader.ticker} · Next ›</Button>}
        </div>
      )}

      {step === "talk" && (
        <div className="mt-3">
          {night.leader ? (
            <div className="bg-card border border-line rounded-card px-4 py-4">
              <div className="text-[11px] font-black text-purple-2 tracking-[0.5px]">TONIGHT&apos;S COMPANY</div>
              <div className="mt-1 flex items-center gap-3">
                <span className="w-12 h-12 rounded-[12px] bg-green-tint text-green text-[12px] font-black flex items-center justify-center">{night.leader.ticker}</span>
                <div className="flex-1"><div className="text-[17px] font-black text-ink">{night.leader.name}</div><div className="text-[11.5px] font-bold text-ink-3">{night.leader.votes} vote{night.leader.votes === 1 ? "" : "s"} · {night.leader.champion} put it on the list</div></div>
              </div>
              {night.leader.whatTheySell || night.leader.howTheyMakeMoney ? (
                <div className="mt-3 text-[13px] font-bold text-ink-2 leading-[1.5]">
                  {night.leader.whatTheySell && <p><b className="text-ink">What they sell:</b> {night.leader.whatTheySell}</p>}
                  {night.leader.howTheyMakeMoney && <p className="mt-1"><b className="text-ink">How they make money:</b> {night.leader.howTheyMakeMoney}</p>}
                  {night.leader.strength && <p className="mt-1"><b className="text-ink">Strength:</b> {night.leader.strength}</p>}
                  {night.leader.risk && <p className="mt-1"><b className="text-ink">Risk:</b> {night.leader.risk}</p>}
                </div>
              ) : (
                <p className="mt-3 text-[12px] font-bold text-ink-3">Nobody has written the one-pager yet — the questions below are how you write it together. <Link href={`/discover/${night.leader.ticker}`} className="text-green font-extrabold">Look it up ›</Link></p>
              )}
            </div>
          ) : (
            <div className="bg-card border border-line rounded-card px-4 py-4 text-[13px] font-bold text-ink-3">No pick yet — go back and vote.</div>
          )}
          <div className="mt-3 bg-purple-tint border border-purple-line rounded-card px-4 py-4">
            <div className="text-[11px] font-black text-purple-2 tracking-[0.5px]">QUESTION {q + 1} OF {night.questions.length}</div>
            <p className="mt-2 text-[17px] font-black text-ink leading-[1.3]">{night.questions[q]}</p>
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setQ((x) => Math.max(0, x - 1))} disabled={q === 0}>‹ Back</Button>
              {q < night.questions.length - 1 ? <Button size="sm" variant="purple" onClick={() => setQ((x) => x + 1)}>Next question ›</Button> : <Button size="sm" variant="purple" onClick={() => setStep("who")}>Who came? ›</Button>}
            </div>
          </div>
        </div>
      )}

      {step === "who" && (
        <div className="mt-3">
          <h2 className="text-[15px] font-black text-ink">Who showed up?</h2>
          <p className="mt-1 text-[12.5px] font-bold text-ink-3">Everyone present earns +{night.xpPerAttendee} XP for the night. {night.isParent ? "" : "A parent records it."}</p>
          <div className="mt-3 bg-card border border-line rounded-card px-4 py-1">
            {night.members.map((m, i) => {
              const on = present.includes(m.id); const paid = night.alreadyPaid.includes(m.id);
              return (
                <label key={m.id} className={cx("flex items-center gap-3 py-3", i < night.members.length - 1 && "border-b border-paper-2")}>
                  <input type="checkbox" checked={on} disabled={paid || !night.isParent} onChange={() => toggle(m.id)} className="w-5 h-5 accent-[#6B5CA8]" aria-label={`${m.name} was here`} />
                  <MemberAvatar name={m.name} color={m.color} avatarUrl={m.avatarUrl} size={30} />
                  <span className="flex-1 text-[13.5px] font-extrabold text-ink">{m.name}{m.isYou ? " (you)" : ""}</span>
                  {paid && <span className="text-[11px] font-extrabold text-green">Credited ✓</span>}
                </label>
              );
            })}
          </div>
          {err && <p className="mt-2 text-[12px] font-bold text-red" role="alert">{err}</p>}
          {night.isParent ? (
            <Button size="md" variant="purple" full className="mt-3" onClick={record} disabled={busy === "record" || present.filter((id) => !night.alreadyPaid.includes(id)).length === 0}>{busy === "record" ? "Recording…" : "Record tonight & award XP"}</Button>
          ) : (
            <p className="mt-3 text-center text-[12px] font-bold text-ink-4">Ask a parent to record tonight from their account.</p>
          )}
        </div>
      )}

      {step === "done" && results && (
        <div className="mt-3 bg-green-tint border border-green-line rounded-card px-4 py-5 text-center">
          <div className="text-[30px]">🌙</div>
          <div className="mt-1 text-[16px] font-black text-ink">Family Investing Night recorded</div>
          <div className="mt-2 flex flex-col gap-1">
            {results.map((r) => { const m = night.members.find((x) => x.id === r.id); return <div key={r.id} className="text-[12.5px] font-bold text-ink-2">{m?.name ?? "Member"}: {r.alreadyAwarded ? "already credited" : r.awarded ? `+${r.xp} XP` : "not credited"}</div>; })}
          </div>
          <Link href="/family" className="inline-flex mt-4 h-[36px] px-4 items-center rounded-[12px] bg-green text-cream-text text-[13px] font-black">Back to family</Link>
        </div>
      )}

      {night.history.length > 0 && (
        <div className="mt-5">
          <h2 className="mb-2 text-[15px] font-black text-ink">Past nights</h2>
          <div className="bg-card border border-line rounded-card px-4 py-1">
            {night.history.map((h, i) => (
              <div key={h.night} className={cx("flex items-center gap-3 py-[10px]", i < night.history.length - 1 && "border-b border-paper-2")}>
                <span className="w-9 h-9 rounded-[10px] bg-purple-tint text-purple-2 text-[10.5px] font-black flex items-center justify-center">{h.ticker ?? "—"}</span>
                <div className="flex-1 min-w-0"><div className="text-[13px] font-extrabold text-ink truncate">{h.name ?? "Family night"}</div><div className="text-[11px] font-bold text-ink-3">{new Date(`${h.night}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {h.attendees} there · hosted by {h.host}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
