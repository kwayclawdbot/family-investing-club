"use client";
import { useEffect, useState } from "react";
import { cx } from "@/components/ui";
import { CloseIcon, ChevronDown } from "@/components/ui/icons";
import { RingAvatar } from "@/components/community/BarChip";
import { circles } from "@/lib/fixtures/v12-social";
import { openSheet, showXp } from "./bus";

type Audience = { id: string; label: string; short: string };
const AUD: Audience[] = [
  { id: "main", label: "Main Feed 🌍", short: "MAIN FEED 🌍" },
  { id: "private", label: "The Mensah Club 🔒", short: "MENSAH CLUB 🔒" },
  ...circles.map((c) => ({ id: `circle:${c.id}`, label: `${c.emoji} ${c.name} circle`, short: `${c.emoji} ${c.name.toUpperCase()}` })),
];
const ARTIFACTS = [
  { id: "pick", label: "▲ Pick", cls: "bg-green-tint text-green" },
  { id: "chart", label: "📈 Chart", cls: "bg-orange-tint text-orange-2" },
  { id: "poll", label: "📊 Poll", cls: "bg-purple-tint text-purple-2" },
  { id: "research", label: "🔍 Research", cls: "bg-[#FFFDF4] text-[#BC9227]" },
  { id: "kai", label: "✦ Ask Kai", cls: "bg-[#F5F0E4] text-ink-2" },
  { id: "ticker", label: "🏷 $Ticker", cls: "bg-[#F5F0E4] text-ink-2" },
];

/** Compose modal (canvas v11, board 13) — opens from ✎ Share; audience picker inside; artifacts attach. */
export function ComposeSheet({ onClose, audience: initial = "main", reply }: { onClose: () => void; audience?: string; reply?: string }) {
  const [aud, setAud] = useState(initial);
  const [pickAud, setPickAud] = useState(false);
  const [text, setText] = useState(reply ? `@${reply.split(" ")[0]} ` : "");
  const [artifact, setArtifact] = useState<string | null>(null);
  const [poll, setPoll] = useState<string[]>(["", ""]);
  const [ticker, setTicker] = useState("");
  const [posted, setPosted] = useState(false);
  useEffect(() => { try { const d = localStorage.getItem("fic.compose.draft"); if (d && !reply) setText(d); } catch { /* ignore */ } }, [reply]); // eslint-disable-line react-hooks/set-state-in-effect -- restore draft after mount
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && onClose(); window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [onClose]);
  const current = AUD.find((a) => a.id === aud) ?? AUD[0];

  const attach = (id: string) => {
    if (id === "pick") { openSheet("pick", { symbol: ticker || undefined }); return; }
    if (id === "kai") { openSheet("kai", { context: `compose:${aud}` }); return; }
    if (id === "chart") { setArtifact(`📈 ${ticker || "NVDA"} · 1Y chart`); return; }
    if (id === "research") { setArtifact("🔍 Research note · Costco renewals"); return; }
    setArtifact((a) => (a === id ? null : id));
  };
  const post = () => {
    const entry = { id: `lp${Date.now()}`, text: text.trim(), audience: aud.startsWith("circle:") ? "main" : aud, at: Date.now(), artifact: artifact && artifact !== "poll" && artifact !== "ticker" ? artifact : ticker ? `🏷 $${ticker.toUpperCase()}` : undefined, poll: artifact === "poll" ? poll.filter(Boolean) : undefined };
    try { const cur = JSON.parse(localStorage.getItem("fic.posts") || "[]"); localStorage.setItem("fic.posts", JSON.stringify([entry, ...cur])); localStorage.removeItem("fic.compose.draft"); } catch { /* ignore */ }
    window.dispatchEvent(new Event("fic:posts"));
    showXp(entry.poll || entry.artifact ? 8 : 5);
    setPosted(true);
    setTimeout(onClose, 700);
  };
  const draft = () => { try { localStorage.setItem("fic.compose.draft", text); } catch { /* ignore */ } onClose(); };

  return (
    <div className="absolute inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true" aria-label="Share something">
      <button aria-label="Close" onClick={onClose} className="absolute inset-0 bg-[#2E2A21]/35 backdrop-blur-[1.5px]" />
      <section className="relative bg-[#FFFDF7] rounded-t-[26px] shadow-[0_-10px_34px_rgba(46,42,33,0.3)] px-5 pt-[13px] flex flex-col h-[560px] max-h-[88%] motion-safe:animate-[sheetRise_.22s_ease-out]">
        <div className="w-10 h-[5px] rounded-[3px] bg-[#D9CDB2] mx-auto" />
        <div className="flex items-center gap-[10px] mt-[14px]">
          <RingAvatar initial="K" bg="bg-green-2" ring="purple" size={34} />
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-black text-ink">Share something</div>
            <button type="button" onClick={() => setPickAud((v) => !v)} aria-expanded={pickAud} className="mt-[2px] inline-flex items-center gap-[5px] bg-green-tint border border-green-line rounded-[9px] px-[9px] py-[2px] text-[9.5px] font-black text-green">TO: {current.short} <ChevronDown size={9} /></button>
          </div>
          <button aria-label="Close" onClick={onClose} className="text-ink-3"><CloseIcon size={18} /></button>
        </div>
        {pickAud && (
          <div className="mt-2 rounded-[12px] bg-card border border-line overflow-hidden">
            {AUD.map((a) => <button key={a.id} type="button" onClick={() => { setAud(a.id); setPickAud(false); }} className={cx("w-full text-left px-3 py-2 text-[12px] font-extrabold border-b border-paper-2 last:border-0", a.id === aud ? "text-green" : "text-ink")}>{a.label}</button>)}
          </div>
        )}
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="What's on your mind about the market?" aria-label="Post text" autoFocus className="mt-3 flex-1 w-full resize-none bg-transparent text-[15px] font-semibold text-ink placeholder:text-ink-4 leading-[1.5] outline-none" />
        {artifact === "poll" && (
          <div className="mb-2 flex flex-col gap-1">
            {poll.map((o, i) => <input key={i} value={o} onChange={(e) => setPoll((p) => p.map((x, j) => (j === i ? e.target.value : x)))} placeholder={`Option ${i + 1}`} className="h-9 rounded-[9px] bg-paper-2 px-3 text-[12px] font-bold text-ink outline-none" />)}
            {poll.length < 4 && <button type="button" onClick={() => setPoll((p) => [...p, ""])} className="text-[11px] font-black text-purple-2 text-left">+ option</button>}
          </div>
        )}
        {artifact === "ticker" && <input value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} placeholder="Ticker, e.g. NVDA" className="mb-2 h-9 rounded-[9px] bg-paper-2 px-3 text-[12px] font-bold text-ink outline-none" />}
        {artifact && artifact !== "poll" && artifact !== "ticker" && <div className="mb-2 inline-flex items-center gap-2 rounded-[9px] bg-[#FBF6EA] border border-[#EFE4CF] px-[10px] py-[6px] text-[10.5px] font-black text-ink-2">{artifact}<button type="button" onClick={() => setArtifact(null)} aria-label="Remove artifact" className="text-ink-4">✕</button></div>}
        <div className="bg-[#FBF6EA] border border-[#EFE4CF] rounded-[13px] px-[13px] py-[10px] mb-[11px] flex items-center gap-[9px]">
          <span className="text-[13px]">💡</span><span className="flex-1 text-[10.5px] font-bold text-ink-3">Attach an artifact — posts with picks or charts get 3× more replies</span>
        </div>
        <div className="flex gap-[7px] flex-wrap mb-3">
          {ARTIFACTS.map((a) => <button key={a.id} type="button" onClick={() => attach(a.id)} aria-pressed={artifact === a.id} className={cx("rounded-[11px] px-[13px] py-2 text-[11px] font-black", a.cls, artifact === a.id && "ring-2 ring-ink/20")}>{a.label}</button>)}
        </div>
        <div className="flex gap-[9px] pb-10">
          <button type="button" onClick={draft} className="flex-1 rounded-[14px] bg-[#EFE7D6] text-ink-3 py-[13px] text-[13px] font-black">Draft</button>
          <button type="button" disabled={!text.trim() || posted} onClick={post} className="flex-[2] rounded-[14px] bg-orange text-cream-text py-[13px] text-[13.5px] font-black shadow-[0_3px_0_#C96D25] disabled:opacity-50">{posted ? "Posted ✓" : `Post to ${current.label.replace(/ [🌍🔒]$/u, "")}`}</button>
        </div>
      </section>
      <style>{`@keyframes sheetRise{from{transform:translateY(32px);opacity:.5}to{transform:none;opacity:1}}`}</style>
    </div>
  );
}
