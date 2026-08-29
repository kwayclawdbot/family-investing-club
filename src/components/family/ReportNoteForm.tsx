"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { familyApi } from "@/lib/live/client-family";

/** A parent's note on the learner's week (FTA `report_notes`, one per child per week). */
export function ReportNoteForm({ childId, week, initial }: { childId: string; week: number; initial: string }) {
  const router = useRouter();
  const [note, setNote] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(null);
    const r = await familyApi.note(childId, note, week);
    setBusy(false);
    setMsg(r.ok ? "Saved ✓" : r.error);
    if (r.ok) router.refresh();
  }
  return (
    <form onSubmit={save} className="bg-card border border-line rounded-card px-4 py-3">
      <label className="text-[11px] font-black text-ink-3 tracking-[0.5px]">THIS WEEK&apos;S NOTE</label>
      <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={1000} placeholder="What went well, what to practise next, something to say at dinner…"
        className="mt-1 w-full rounded-[12px] border border-line bg-paper px-3 py-2 text-[13.5px] font-bold text-ink placeholder:text-ink-4 outline-none focus:border-green" />
      <div className="mt-2 flex items-center gap-3">
        <Button type="submit" size="sm" variant="green" disabled={busy || note.trim().length < 2}>{busy ? "Saving…" : "Save note"}</Button>
        {msg && <span className={`text-[12px] font-bold ${msg === "Saved ✓" ? "text-green" : "text-red"}`}>{msg}</span>}
      </div>
    </form>
  );
}
