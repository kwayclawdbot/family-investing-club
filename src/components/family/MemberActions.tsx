"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, cx } from "@/components/ui";
import { Sheet } from "@/components/ui/extras";
import { familyApi } from "@/lib/live/client-family";
import type { HouseholdMember } from "@/lib/live/family";

/** Parent actions on a household member: rename, move a child between age bands, remove from the household. */
export function MemberActions({ member }: { member: HouseholdMember }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(member.fullName);
  const [band, setBand] = useState<"kids" | "teens">(member.ageGroup === "kids" ? "kids" : "teens");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);

  async function save() {
    setBusy(true); setErr(null);
    const r = await familyApi.updateMember({ id: member.id, displayName: name.trim() !== member.fullName ? name.trim() : undefined, ageGroup: member.role === "child" && band !== member.ageGroup ? band : undefined });
    setBusy(false);
    if (!r.ok) { setErr(r.error); return; }
    setOpen(false); router.refresh();
  }
  async function remove() {
    setBusy(true); setErr(null);
    const r = await familyApi.removeMember(member.id);
    setBusy(false);
    if (!r.ok) { setErr(r.error); return; }
    setOpen(false); router.refresh();
  }
  const field = "w-full h-[44px] rounded-[12px] border border-line bg-paper px-3 text-[14px] font-bold text-ink outline-none focus:border-green";
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="text-[11.5px] font-extrabold text-green">Edit</button>
      <Sheet open={open} onClose={() => setOpen(false)} title={member.name}>
        <label className="text-[11px] font-extrabold text-ink-3">Display name</label>
        <input className={cx(field, "mt-1")} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} aria-label="Display name" />
        {member.role === "child" && (
          <>
            <div className="mt-3 text-[11px] font-extrabold text-ink-3">Age band</div>
            <div className="mt-1 flex gap-[6px]" role="radiogroup" aria-label="Age band">
              {([["kids", "Kids · Explorer", "Under 13 · stories & pictures"], ["teens", "Teens · Builder", "13–17 · numbers & scenarios"]] as const).map(([v, l, s]) => (
                <button key={v} type="button" role="radio" aria-checked={band === v} onClick={() => setBand(v)} className={cx("flex-1 rounded-[12px] border px-3 py-[9px] text-left", band === v ? "border-green-2 bg-green-tint" : "border-line bg-paper")}>
                  <span className="block text-[13px] font-black text-ink">{l}</span><span className="block text-[10.5px] font-bold text-ink-3">{s}</span>
                </button>
              ))}
            </div>
          </>
        )}
        {err && <p className="mt-2 text-[12px] font-bold text-red">{err}</p>}
        <Button size="md" variant="green" full className="mt-4" onClick={save} disabled={busy || !name.trim()}>{busy ? "Saving…" : "Save"}</Button>
        {!member.isYou && (
          confirm ? (
            <div className="mt-3 bg-orange-tint border border-orange-line rounded-card px-3 py-3">
              <p className="text-[12.5px] font-bold text-ink-2">Remove {member.name} from the household? Their account and progress stay; they just leave this family.</p>
              <div className="mt-2 flex gap-2"><Button size="sm" onClick={remove} disabled={busy}>Yes, remove</Button><Button size="sm" variant="secondary" onClick={() => setConfirm(false)}>Keep</Button></div>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirm(true)} className="mt-3 w-full text-center text-[12px] font-extrabold text-red">Remove from household</button>
          )
        )}
      </Sheet>
    </>
  );
}
