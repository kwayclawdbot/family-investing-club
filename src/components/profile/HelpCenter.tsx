"use client";
import Link from "next/link";
import { useState } from "react";
import type { Faq } from "@/lib/types";
import { Button, cx } from "@/components/ui";
import { SearchIcon, ChevronDown } from "@/components/ui/icons";

const field = "w-full h-[44px] rounded-[12px] border border-line bg-card px-3 text-[14px] font-bold text-ink placeholder:text-ink-4 outline-none focus:border-green";

export function HelpCenter({ faqs }: { faqs: Faq[] }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const [subject, setSubject] = useState("");
  const [msg, setMsg] = useState("");
  const [sent, setSent] = useState(false);
  const list = faqs.filter((f) => !q.trim() || (f.q + f.a).toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="pb-6">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-[14px] text-ink-4" />
        <input className={cx(field, "pl-9")} placeholder="Search help…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search help" />
      </div>

      <div className="mt-3 bg-purple-tint border border-purple-line rounded-card px-4 py-3 flex items-center gap-3">
        <span className="text-[20px]">✦</span>
        <div className="flex-1">
          <div className="text-[13px] font-black text-ink">Question about investing?</div>
          <div className="text-[11.5px] font-bold text-ink-3">Kai explains concepts. Support fixes the app.</div>
        </div>
        <Link href="/kai?context=help" className="h-[32px] px-3 rounded-[10px] bg-purple-2 text-cream-text text-[12px] font-black flex items-center">Ask Kai</Link>
      </div>

      <h2 className="mt-5 mb-2 text-[15px] font-black text-ink">Common questions</h2>
      {list.length === 0 ? (
        <div className="bg-card border border-line rounded-card px-4 py-4 text-center text-[13px] font-bold text-ink-3">No matches — try the form below.</div>
      ) : (
        <div className="bg-card border border-line rounded-card px-4 py-1">
          {list.map((f, i) => (
            <div key={f.q} className={cx(i < list.length - 1 && "border-b border-paper-2")}>
              <button className="w-full flex items-center gap-3 py-3 text-left" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
                <span className="flex-1 text-[13.5px] font-extrabold text-ink">{f.q}</span>
                <ChevronDown className={cx("text-ink-4 transition", open === i && "rotate-180")} />
              </button>
              {open === i && <p className="pb-3 text-[13px] font-bold text-ink-2 leading-[1.55]">{f.a}</p>}
            </div>
          ))}
        </div>
      )}

      <h2 className="mt-5 mb-2 text-[15px] font-black text-ink">Contact support</h2>
      {sent ? (
        <div className="bg-green-tint border border-green-line rounded-card px-4 py-4 text-center">
          <div className="text-[22px]">📬</div>
          <div className="mt-1 text-[14px] font-black text-ink">Sent — we reply within a day</div>
          <div className="text-[12px] font-bold text-ink-3">We&apos;ll answer at your account email.</div>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); if (subject.trim() && msg.trim()) setSent(true); }} className="bg-card border border-line rounded-card px-4 py-4 flex flex-col gap-3">
          <input className={field} placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} aria-label="Subject" />
          <textarea className={cx(field, "h-[110px] py-3 resize-none")} placeholder="What's going on?" value={msg} onChange={(e) => setMsg(e.target.value)} aria-label="Message" />
          <Button type="submit" size="md" full disabled={!subject.trim() || !msg.trim()}>Send to support</Button>
        </form>
      )}
    </div>
  );
}
