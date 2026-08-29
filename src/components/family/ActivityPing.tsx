"use client";
import { useEffect, useState } from "react";
import { familyApi } from "@/lib/live/client-family";

/**
 * Credits "time in app" for a supervised child while a family surface is open (FTA `family_activity_ping`,
 * once a minute). Shows a gentle note when a guardrail (downtime / daily limit) is resting the account.
 */
export function ActivityPing({ active }: { active: boolean }) {
  const [state, setState] = useState<{ minutes: number; limit: number | null; locked: boolean } | null>(null);
  useEffect(() => {
    if (!active) return;
    let stop = false;
    const tick = async () => { const r = await familyApi.ping(); if (!stop && r.ok) setState({ minutes: r.minutes, limit: r.limit, locked: r.locked }); };
    tick();
    const id = setInterval(tick, 60_000);
    return () => { stop = true; clearInterval(id); };
  }, [active]);
  if (!active || !state) return null;
  if (state.locked) {
    return (
      <div className="mt-3 bg-purple-tint border border-purple-line rounded-card px-4 py-3 text-[12.5px] font-bold text-purple-2" role="status">
        🌙 A guardrail is resting this account right now (downtime, or today&apos;s limit). Reading stays open — posting and practice trades come back on their own.
      </div>
    );
  }
  if (state.limit != null) {
    return <div className="mt-2 text-[11px] font-bold text-ink-4" role="status">{state.minutes} of {state.limit} min used today</div>;
  }
  return null;
}
