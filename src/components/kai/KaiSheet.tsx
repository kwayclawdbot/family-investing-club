"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { KaiSpark, CloseIcon } from "@/components/ui/icons";

type Msg = { role: "user" | "kai"; text: string; lesson?: { label: string; href: string } };

const CANNED = "I'm still being wired up — for now, try one of the prompts above.";

function contextLabel(raw: string | null): string {
  if (!raw || raw === "home") return "Home";
  if (raw.startsWith("symbol:")) return raw.slice(7).toUpperCase();
  if (raw.startsWith("lesson")) return raw.replace(/^lesson[:·]?\s*/, "lesson · ");
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

export function KaiSheet({
  prompts,
  sample,
}: {
  prompts: string[];
  sample: { question: string; answer: string; lessonLabel: string; lessonHref: string };
}) {
  const router = useRouter();
  const params = useSearchParams();
  const context = contextLabel(params.get("context"));
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "user", text: sample.question },
    { role: "kai", text: sample.answer, lesson: { label: sample.lessonLabel, href: sample.lessonHref } },
  ]);
  const [draft, setDraft] = useState(params.get("q") ?? "");
  const [open, setOpen] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(t);
  }, []);
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [msgs]);

  function send(text: string) {
    const t = text.trim();
    if (!t) return;
    setMsgs((m) => [...m, { role: "user", text: t }, { role: "kai", text: CANNED }]);
    setDraft("");
  }
  function close() {
    setOpen(false);
    setTimeout(() => router.back(), 180);
  }

  return (
    <div className="absolute inset-0 flex flex-col bg-[#C9BFA8]">
      <button aria-label="Close Kai" onClick={close} className={`h-[120px] shrink-0 transition-opacity ${open ? "opacity-100" : "opacity-0"}`} />
      <section
        role="dialog"
        aria-label="Kai, your investing tutor"
        className={`flex-1 min-h-0 bg-paper rounded-t-[28px] shadow-[0_-8px_30px_rgba(46,42,33,0.25)] flex flex-col px-5 pt-[14px] transition-transform duration-200 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="w-10 h-[5px] rounded-[3px] bg-[#D9CDB2] mx-auto shrink-0" />
        <div className="flex items-center justify-between mt-[14px] shrink-0">
          <div className="flex items-center gap-[10px]">
            <span className="w-9 h-9 rounded-[12px] bg-purple text-white flex items-center justify-center">
              <KaiSpark size={17} />
            </span>
            <div>
              <div className="text-[17px] font-black text-ink">Kai</div>
              <div className="text-[11px] font-extrabold text-[#3A8C4A]">● Knows what you&apos;re learning</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10.5px] font-extrabold text-purple-2 bg-purple-tint rounded-[8px] px-2 py-[3px]">Context: {context}</span>
            <button onClick={close} aria-label="Close" className="text-ink-3 p-1">
              <CloseIcon size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pb-3">
          <div className="mt-[18px] text-[20px] font-black text-ink leading-tight">
            Hey Kway! 👋<br />How can I help you today?
          </div>
          <div className="flex flex-col gap-[9px] mt-4">
            {prompts.map((p) => (
              <button
                key={p}
                onClick={() => send(p)}
                className="bg-card border border-line rounded-[14px] px-[15px] py-3 flex items-center gap-[10px] text-left active:scale-[0.99]"
              >
                <span className="text-orange font-black">＋</span>
                <span className="text-[13.5px] font-extrabold text-ink">{p}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-[10px] mt-[18px]">
            {msgs.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <div className="bg-green-2 text-cream-text rounded-[16px_16px_4px_16px] px-[14px] py-[10px] text-[13.5px] font-bold max-w-[75%]">{m.text}</div>
                </div>
              ) : (
                <div key={i} className="flex gap-[9px]">
                  <span className="w-7 h-7 rounded-[10px] bg-purple text-white flex items-center justify-center shrink-0">
                    <KaiSpark size={13} />
                  </span>
                  <div className="bg-card border border-line rounded-[4px_16px_16px_16px] px-[14px] py-[11px] text-[13.5px] font-semibold text-ink leading-[1.45] max-w-[82%]">
                    {m.text}{" "}
                    {m.lesson && (
                      <Link href={m.lesson.href} className="bg-purple-tint text-purple-2 rounded-[8px] px-2 py-[2px] text-[10.5px] font-extrabold whitespace-nowrap">
                        {m.lesson.label} →
                      </Link>
                    )}
                  </div>
                </div>
              )
            )}
            <div ref={endRef} />
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(draft);
          }}
          className="shrink-0 pb-[calc(40px+env(safe-area-inset-bottom))] sm:pb-10 pt-2"
        >
          <div className="flex items-center gap-[10px] bg-card border-[1.5px] border-line rounded-[16px] px-4 py-3">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask Kai anything…"
              aria-label="Ask Kai"
              className="flex-1 min-w-0 bg-transparent outline-none text-[13.5px] font-bold text-ink placeholder:text-ink-4"
            />
            <button type="submit" aria-label="Send" className="w-8 h-8 rounded-full bg-purple text-white flex items-center justify-center shrink-0 active:scale-95">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 19V5M6 11l6-6 6 6" />
              </svg>
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
