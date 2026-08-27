"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { Company, Idea } from "@/lib/types";
import { Button, cx } from "@/components/ui";
import { Sheet } from "@/components/ui/extras";
import { KaiSpark, SearchIcon, CheckIcon, CloseIcon } from "@/components/ui/icons";
import { IdeaCard } from "./cards";
import { read, write } from "./storage";

const HORIZONS = ["Months", "1–2 years", "3–5 years", "5–10 years", "10+ years"];
const CONVICTION = ["Low", "Medium", "High"] as const;

type Draft = {
  title: string; opportunity: string; why: string; risks: string; horizon: string; evidence: string;
  conviction: (typeof CONVICTION)[number] | ""; companies: string[];
};
const EMPTY: Draft = { title: "", opportunity: "", why: "", risks: "", horizon: "", evidence: "", conviction: "", companies: [] };

const field = "w-full rounded-[12px] border border-line bg-paper-2 px-3 py-[10px] text-[13.5px] font-bold text-ink placeholder:text-ink-4 outline-none focus:border-green focus:bg-card";

function Section({ n, title, hint, children }: { n: number; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="mt-3 bg-card border border-line rounded-card px-4 py-[14px]">
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 rounded-full bg-purple-tint text-purple-2 text-[11px] font-black flex items-center justify-center">{n}</span>
        <h2 className="text-[14px] font-black text-ink">{title}</h2>
      </div>
      {hint && <p className="mt-1 text-[11.5px] font-bold text-ink-3 leading-[1.45]">{hint}</p>}
      <div className="mt-[10px]">{children}</div>
    </section>
  );
}

export function IdeaComposer({ companies }: { companies: Company[] }) {
  const [d, setD] = useState<Draft>(EMPTY);
  const [q, setQ] = useState("");
  const [kai, setKai] = useState(false);
  const [saved, setSaved] = useState(false);
  const up = (patch: Partial<Draft>) => { setD((p) => ({ ...p, ...patch })); setSaved(false); };

  const matches = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return companies.filter((c) => !d.companies.includes(c.symbol) && (c.symbol.toLowerCase().includes(s) || c.name.toLowerCase().includes(s))).slice(0, 4);
  }, [q, companies, d.companies]);

  const preview: Idea = {
    id: "draft", title: d.title, author: "Kway M.", ago: "Draft", status: "DRAFT", summary: d.opportunity.slice(0, 140),
    opportunity: d.opportunity, horizon: d.horizon,
    companies: d.companies.map((s) => { const c = companies.find((x) => x.symbol === s); return { symbol: s, name: c?.name ?? s, changePct: c?.changePct ?? 0 }; }),
    risks: d.risks, concepts: [], likes: 0, comments: 0, saves: 0,
  };

  const riskCount = d.risks.split(/\n|·|;|,/).map((s) => s.trim()).filter(Boolean).length;
  const checks = [
    { label: "A clear thesis title", ok: d.title.trim().length > 6 },
    { label: "The opportunity, in your own words", ok: d.opportunity.trim().length > 40 },
    { label: "At least one company or asset", ok: d.companies.length > 0 },
    { label: "At least two risks", ok: riskCount >= 2 },
    { label: "A time horizon", ok: !!d.horizon },
    { label: "Conviction stated honestly", ok: !!d.conviction },
  ];

  function save() {
    const all = read<(Draft & { id: string; at: string })[]>("fic.ideas", []);
    write("fic.ideas", [{ ...d, id: `draft-${all.length + 1}`, at: new Date().toISOString() }, ...all]);
    setSaved(true);
  }

  return (
    <div className="pb-6">
      <div className="mt-1 flex items-center gap-2">
        <span className="bg-paper-2 text-ink-3 rounded-[8px] px-2 py-[3px] text-[10px] font-extrabold tracking-[0.3px]">STATUS · DRAFT</span>
        <span className="text-[11px] font-bold text-ink-4">Ideas start as drafts and move through the Club lifecycle.</span>
      </div>

      <Section n={1} title="Thesis" hint="One sentence a beginner could repeat. Template: “[Trend] means [who] will need [what] — [company] is positioned because [why].”">
        <input className={field} placeholder="Title — e.g. Nuclear Energy: The Next Decade" value={d.title} onChange={(e) => up({ title: e.target.value })} />
        <textarea className={cx(field, "mt-2 min-h-[88px]")} placeholder="What's the opportunity?" value={d.opportunity} onChange={(e) => up({ opportunity: e.target.value })} />
      </Section>

      <Section n={2} title="Companies & assets" hint="Search by name or ticker. Add the ones you'll actually research.">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-4" />
          <input className={cx(field, "pl-9")} placeholder="Search companies, ETFs…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {matches.length > 0 && (
          <ul className="mt-2 border border-line rounded-[12px] bg-card overflow-hidden">
            {matches.map((c) => (
              <li key={c.symbol}>
                <button type="button" onClick={() => { up({ companies: [...d.companies, c.symbol] }); setQ(""); }} className="w-full flex items-center gap-3 px-3 py-[9px] text-left border-b border-paper-2 last:border-0">
                  <span className="w-8 h-8 rounded-[10px] bg-green-tint text-green text-[10px] font-black flex items-center justify-center">{c.symbol}</span>
                  <span className="text-[13px] font-extrabold text-ink">{c.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {d.companies.length > 0 && (
          <div className="flex gap-[7px] mt-2 flex-wrap">
            {d.companies.map((s) => (
              <button key={s} type="button" onClick={() => up({ companies: d.companies.filter((x) => x !== s) })} className="bg-green-tint text-green rounded-[9px] px-[10px] py-1 text-[11.5px] font-black inline-flex items-center gap-1" aria-label={`Remove ${s}`}>
                {s} <CloseIcon size={10} />
              </button>
            ))}
          </div>
        )}
      </Section>

      <Section n={3} title="Why it matters" hint="Who is affected, and how big could it be?">
        <textarea className={cx(field, "min-h-[72px]")} value={d.why} onChange={(e) => up({ why: e.target.value })} placeholder="e.g. Data centers could double electricity demand by 2030…" />
      </Section>

      <Section n={4} title="Risks" hint="List at least two. What would make this wrong?">
        <textarea className={cx(field, "min-h-[72px]")} value={d.risks} onChange={(e) => up({ risks: e.target.value })} placeholder="One per line — regulation, costs, competition, timing…" />
        <div className={cx("mt-1 text-[11px] font-extrabold", riskCount >= 2 ? "text-green" : "text-ink-4")}>{riskCount} risk{riskCount === 1 ? "" : "s"} listed</div>
      </Section>

      <Section n={5} title="Time horizon">
        <div className="flex gap-[6px] flex-wrap" role="radiogroup">
          {HORIZONS.map((h) => (
            <button key={h} type="button" role="radio" aria-checked={d.horizon === h} onClick={() => up({ horizon: h })}
              className={cx("h-[30px] px-[12px] rounded-[10px] text-[12px] font-extrabold", d.horizon === h ? "bg-green text-cream-text" : "bg-card border border-line text-ink-3")}>
              {h}
            </button>
          ))}
        </div>
      </Section>

      <Section n={6} title="Evidence" hint="Links, numbers, notes. Sources beat opinions.">
        <textarea className={cx(field, "min-h-[64px]")} value={d.evidence} onChange={(e) => up({ evidence: e.target.value })} placeholder="e.g. Utility signed a 20-year power deal with a cloud provider (link)…" />
      </Section>

      <Section n={7} title="Conviction" hint="Be honest — low conviction ideas are welcome. They're how research starts.">
        <div className="flex gap-[6px]" role="radiogroup">
          {CONVICTION.map((c) => (
            <button key={c} type="button" role="radio" aria-checked={d.conviction === c} onClick={() => up({ conviction: c })}
              className={cx("flex-1 h-[36px] rounded-[10px] text-[12.5px] font-extrabold", d.conviction === c ? "bg-purple-2 text-cream-text" : "bg-card border border-line text-ink-3")}>
              {c}
            </button>
          ))}
        </div>
      </Section>

      <div className="mt-5 text-[11px] font-extrabold text-ink-3 tracking-[0.3px] uppercase">Preview</div>
      <IdeaCard idea={preview} href={null} />

      <div className="mt-4 flex flex-col gap-[10px]">
        <button type="button" onClick={() => setKai(true)} className="h-[48px] rounded-[14px] border-2 border-purple text-purple-2 text-[14px] font-black inline-flex items-center justify-center gap-2">
          <KaiSpark size={16} /> Ask Kai to review
        </button>
        <Button variant={saved ? "green" : "primary"} full onClick={save}>{saved ? "✓ Draft saved" : "Save draft"}</Button>
        {saved && (
          <div className="text-center text-[12px] font-bold text-ink-3">
            Saved to your drafts. <Link href="/club" className="text-green font-extrabold">Back to Club</Link>
          </div>
        )}
      </div>
      <p className="mt-3 text-[10.5px] font-semibold text-ink-4 leading-[1.4] text-center">Ideas are for learning and discussion — not personalized advice.</p>

      <Sheet open={kai} onClose={() => setKai(false)} title="Kai review">
        <div className="flex items-start gap-2 bg-purple-tint rounded-[12px] px-3 py-[10px]">
          <KaiSpark size={16} className="text-purple-2 mt-[2px] shrink-0" />
          <p className="text-[13px] font-bold text-ink-2 leading-[1.5]">Kai review arrives when the tutor is wired — here&apos;s the checklist Kai will use.</p>
        </div>
        <ul className="mt-3">
          {checks.map((c) => (
            <li key={c.label} className="flex items-center gap-3 py-[9px] border-b border-paper-2 last:border-0">
              <span className={cx("w-6 h-6 rounded-full flex items-center justify-center", c.ok ? "bg-green-tint text-green" : "bg-paper-2 text-ink-4")}>
                {c.ok ? <CheckIcon size={12} /> : <CloseIcon size={11} />}
              </span>
              <span className={cx("text-[13.5px] font-extrabold", c.ok ? "text-ink" : "text-ink-3")}>{c.label}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 text-[12px] font-extrabold text-ink-3">{checks.filter((c) => c.ok).length} / {checks.length} complete</div>
      </Sheet>
    </div>
  );
}
