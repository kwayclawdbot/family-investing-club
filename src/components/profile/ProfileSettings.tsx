"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ExplanationLevel } from "@/lib/types";
import { cx } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

const LEVELS: { id: ExplanationLevel; who: string }[] = [
  { id: "Explorer", who: "Young / very early learner" },
  { id: "Builder", who: "Older child / early teen" },
  { id: "Investor", who: "Teen / adult beginner" },
  { id: "Trader", who: "Advanced learner" },
];
const LS_KEY = "fic.level";

function readLevel(fallback: ExplanationLevel): ExplanationLevel {
  try {
    const v = localStorage.getItem(LS_KEY);
    if (v && LEVELS.some((l) => l.id === v)) return v as ExplanationLevel;
  } catch { /* storage unavailable */ }
  return fallback;
}

const rowCls = "flex justify-between items-center py-3 text-[13.5px] font-extrabold text-ink w-full text-left";

export function ProfileSettings({ familyName, initialLevel }: { familyName: string; initialLevel: ExplanationLevel }) {
  const router = useRouter();
  const [level, setLevel] = useState<ExplanationLevel>(initialLevel);
  const [openLevel, setOpenLevel] = useState(false);
  const [openNotif, setOpenNotif] = useState(false);
  const [prefs, setPrefs] = useState({ reminders: true, family: true, club: false, digest: false });
  const [signingOut, setSigningOut] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount (no SSR mismatch)
  useEffect(() => { setLevel(readLevel(initialLevel)); }, [initialLevel]);

  function choose(l: ExplanationLevel) {
    setLevel(l);
    try { localStorage.setItem(LS_KEY, l); } catch { /* ignore */ }
    setOpenLevel(false);
  }

  async function signOut() {
    setSigningOut(true);
    try { await createClient().auth.signOut(); } catch { /* not signed in */ }
    router.replace("/welcome");
  }

  return (
    <>
      <div className="mt-3 bg-card border border-line rounded-card px-4 py-[2px]">
        <Link href="/family" className={cx(rowCls, "border-b border-paper-2")}>
          <span>👨‍👩‍👧‍👦 {familyName}</span>
          <span className="text-ink-4">›</span>
        </Link>

        <button className={cx(rowCls, "border-b border-paper-2")} onClick={() => setOpenLevel((o) => !o)} aria-expanded={openLevel}>
          <span>Explanation level</span>
          <span className="text-ink-3 font-bold">{level} {openLevel ? "⌄" : "›"}</span>
        </button>
        {openLevel && (
          <div className="pb-3 border-b border-paper-2 flex flex-col gap-[6px]" role="radiogroup" aria-label="Explanation level">
            {LEVELS.map((l) => (
              <button
                key={l.id}
                role="radio"
                aria-checked={level === l.id}
                onClick={() => choose(l.id)}
                className={cx(
                  "flex items-center justify-between rounded-[12px] border px-3 py-[9px] text-left",
                  level === l.id ? "border-green-2 bg-green-tint" : "border-line bg-paper"
                )}
              >
                <span>
                  <span className="block text-[13px] font-black text-ink">{l.id}</span>
                  <span className="block text-[11px] font-bold text-ink-3">{l.who}</span>
                </span>
                {level === l.id && <span className="text-green font-black">✓</span>}
              </button>
            ))}
          </div>
        )}

        <button className={rowCls} onClick={() => setOpenNotif((o) => !o)} aria-expanded={openNotif}>
          <span>Notifications &amp; preferences</span>
          <span className="text-ink-4">{openNotif ? "⌄" : "›"}</span>
        </button>
        {openNotif && (
          <div className="pb-3 flex flex-col">
            {(
              [
                ["reminders", "Daily lesson reminder · 7:00 PM"],
                ["family", "Family streak & challenges"],
                ["club", "Club ideas I follow"],
                ["digest", "Weekly progress email"],
              ] as const
            ).map(([k, label]) => (
              <label key={k} className="flex items-center justify-between py-[7px]">
                <span className="text-[12.5px] font-bold text-ink-2">{label}</span>
                <Toggle on={prefs[k]} onChange={(v) => setPrefs((p) => ({ ...p, [k]: v }))} />
              </label>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={signOut}
        disabled={signingOut}
        className="mt-3 w-full bg-card border border-line rounded-card px-4 py-3 text-[13.5px] font-extrabold text-red text-left disabled:opacity-60"
      >
        {signingOut ? "Signing out…" : "Sign out"}
      </button>
    </>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={cx("w-[42px] h-[24px] rounded-full relative transition", on ? "bg-green-2" : "bg-line-3")}
    >
      <span className={cx("absolute top-[3px] w-[18px] h-[18px] rounded-full bg-white shadow transition-all", on ? "left-[21px]" : "left-[3px]")} />
    </button>
  );
}
