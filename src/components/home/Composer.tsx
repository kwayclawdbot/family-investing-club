"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { clubApi, signedOut } from "@/lib/live/client-club";
import { openSheet, showXp } from "@/components/sheets/bus";

export type ComposerAudience = "main" | "private";

type LocalPost = { id: string; text: string; audience: string; at: number; artifact?: string };
function pushLocal(text: string, audience: string) {
  try {
    const prev = JSON.parse(localStorage.getItem("fic.posts") || "[]") as LocalPost[];
    const entry: LocalPost = { id: `local-${Date.now()}`, text, audience, at: Date.now() };
    localStorage.setItem("fic.posts", JSON.stringify([entry, ...prev]));
    window.dispatchEvent(new Event("fic:posts"));
  } catch { /* storage unavailable */ }
}

/**
 * The always-present composer under both Home feeds (canvas v11/v12 · DECISIONS #47 "composer with attach").
 * Main → a real `feed_posts` row via /api/community/post; Private → a real `chat_messages` row via
 * /api/club/chat. A 401 means a signed-out demo visitor, and only then does it fall back to localStorage;
 * every other refusal (kid wall, guardrails) is shown, never silently swallowed.
 */
export function Composer({ audience, clubName, onLocalEcho }: { audience: ComposerAudience; clubName?: string; onLocalEcho?: (text: string) => void }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attach, setAttach] = useState(false);

  const send = async () => {
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true); setError(null);
    const tickers = [...new Set((body.match(/\$[A-Za-z.]{1,8}/g) ?? []).map((t) => t.slice(1).toUpperCase()))];
    const r = audience === "main" ? await clubApi.post({ text: body, tickers }) : await clubApi.chat(body);
    setBusy(false);
    if (r.ok) {
      setText("");
      onLocalEcho?.(body);
      if ("xp" in r && typeof r.xp === "number" && r.xp) showXp(r.xp);
      router.refresh();
      return;
    }
    if (signedOut(r)) { pushLocal(body, audience); onLocalEcho?.(body); setText(""); return; }
    setError(r.error);
  };

  return (
    <>
      <div className="mt-3 flex items-center gap-2 bg-card border border-line rounded-[14px] px-3 py-2">
        <button type="button" onClick={() => setAttach(true)} aria-label="Add to your message" className="text-[16px] font-black text-ink-3">＋</button>
        <input
          value={text}
          onChange={(e) => { setText(e.target.value); if (error) setError(null); }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void send(); } }}
          placeholder={audience === "main" ? "Share something with the club…" : "Message the club…"}
          aria-label={audience === "main" ? "Share something with the club" : "Message the club"}
          className="flex-1 bg-transparent text-[12.5px] font-bold text-ink placeholder:text-ink-4 outline-none"
        />
        <button type="button" onClick={() => void send()} disabled={busy || !text.trim()} aria-label="Send" className="w-7 h-7 rounded-full bg-green text-cream-text text-[12px] font-black disabled:opacity-40">↑</button>
      </div>
      {error && <p role="alert" className="mt-[6px] text-[11px] font-bold text-coral px-1">{error}</p>}

      {attach && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end" role="dialog" aria-label="Add to your message">
          <button aria-label="Cancel" onClick={() => setAttach(false)} className="absolute inset-0 bg-[#2E2A21]/45" />
          <div className="relative bg-card rounded-t-[24px] px-[18px] pt-3 pb-[calc(24px+env(safe-area-inset-bottom))] sm:max-w-[402px] sm:mx-auto sm:w-full">
            <div className="mx-auto w-10 h-[5px] rounded-full bg-line-3" />
            <div className="mt-3 text-[10px] font-black tracking-[0.5px] text-ink-3">{(audience === "main" ? "Main feed" : clubName ?? "Your club").toUpperCase()}</div>
            <div className="text-[16px] font-black text-ink">Add to your message</div>
            {([
              ["📈", "Trade idea", "structured pick card — ticker, stance, why", () => { setAttach(false); openSheet("pick", {}); }],
              ["📊", "Poll", "let the club vote on anything", () => { setAttach(false); openSheet("compose", { audience, text }); }],
              ["📎", "Research artifact", "attach a thesis, chart or Kai summary", () => { setAttach(false); openSheet("compose", { audience, text }); }],
              ["💬", "Ask the club", "a question that needs your people, not Google", () => { setAttach(false); openSheet("ask", {}); }],
            ] as [string, string, string, () => void][]).map(([e, t, d, fn]) => (
              <button key={t} type="button" onClick={fn} className="mt-2 w-full flex items-center gap-3 rounded-[13px] border border-line bg-paper px-3 py-[10px] text-left">
                <span className="text-[18px]">{e}</span>
                <span className="flex-1"><span className="block text-[13px] font-black text-ink">{t}</span><span className="block text-[10.5px] font-extrabold text-ink-3">{d}</span></span>
                <span className="text-ink-4">›</span>
              </button>
            ))}
            <button onClick={() => setAttach(false)} className="mt-3 w-full h-11 rounded-[14px] bg-card border border-line text-[13px] font-black text-ink-2">Cancel</button>
          </div>
        </div>
      )}
    </>
  );
}
