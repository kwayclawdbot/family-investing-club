"use client";
import Link from "next/link";
import { useState } from "react";
import type { PortfolioTab, VerifiedExposure } from "@/lib/types";
import { cx } from "@/components/ui";
import { VerifiedExposureView } from "@/components/verify/VerifiedExposure";
import { MiniSpark, Panel, SectionLabel, Ticker, pctText } from "./shared";

const HEX: Record<string, string> = { "bg-green-2": "#4C8C4A", "bg-orange": "#E58234", "bg-purple": "#8B7BC7", "bg-gold": "#E9B949", "bg-line-3": "#E4DAC4" };
const EMOJI: Record<string, string> = { "bg-green-2": "🟩", "bg-orange": "🟧", "bg-purple": "🟪", "bg-gold": "🟨", "bg-line-3": "⬜" };

function Donut({ parts, size = 104, stroke = 14, children }: { parts: { pct: number; color: string }[]; size?: number; stroke?: number; children: React.ReactNode }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const segs = parts.reduce<{ color: string; len: number; off: number }[]>((acc, p) => {
    const off = acc.length ? acc[acc.length - 1].off + acc[acc.length - 1].len : 0;
    return [...acc, { color: p.color, len: (c * p.pct) / 100, off }];
  }, []);
  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        {segs.map((s) => (
          <circle key={s.color} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={HEX[s.color] ?? "#A89F8D"} strokeWidth={stroke} strokeDasharray={`${Math.max(0, s.len - 2)} ${c}`} strokeDashoffset={-s.off} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
        ))}
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">{children}</span>
    </span>
  );
}

const tone = (s: string): "paper" | "gold" | "green" | "orange" => (s === "VOO" || s === "KO" ? "orange" : s === "DIS" ? "gold" : "green");

/** Artboard 02 — Portfolio tab: allocation donut, contributor/detractor, proposal-linked holdings, decision journal. */
export function PortfolioPane({ p, exposure, value, ytdPct, initialView = "model" }: { p: PortfolioTab; exposure: VerifiedExposure; value: number; ytdPct: number; initialView?: "model" | "verified" }) {
  const [view, setView] = useState<"model" | "verified">(initialView);
  const [all, setAll] = useState(false);
  const rows = all ? p.holdings : p.holdings.slice(0, 3);
  return (
    <>
      <div className="mt-[11px] flex items-center gap-[10px]">
        <span className="w-[34px] h-[34px] rounded-[11px] bg-green-2 text-cream-text font-black text-[13px] flex items-center justify-center shrink-0">M</span>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-black text-ink">Mensah Club · Portfolio</div>
          <div className="text-[9.5px] font-extrabold text-ink-3">{view === "model" ? "Club Model · practice dollars · updated live" : "Verified Exposure · shared by consenting adults"}</div>
        </div>
        <div className="flex bg-[#EFE7D6] rounded-[9px] p-[2px]" role="tablist" aria-label="Portfolio view">
          {(["model", "verified"] as const).map((v) => (
            <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)} className={cx("rounded-[7px] px-[9px] py-1 text-[9px] font-black", view === v ? "bg-[#FFFDF7] text-ink" : "text-ink-3")}>{v === "model" ? "MODEL" : "VERIFIED"}</button>
          ))}
        </div>
      </div>

      {view === "verified" ? (
        <VerifiedExposureView e={exposure} />
      ) : (
        <>
          <div className="mt-[10px] flex gap-3 items-center">
            <Donut parts={p.allocation}>
              <span className="text-[15px] font-black text-ink">${(value / 1000).toFixed(1)}k</span>
              <span className="text-[8px] font-extrabold text-[#3A8C4A]">{pctText(ytdPct)} YTD</span>
            </Donut>
            <div className="flex-1 text-[10.5px] font-extrabold text-ink-2 leading-[1.9]">
              {p.allocation.map((a, i) => (
                <span key={a.label}>{EMOJI[a.color] ?? "▪"} {a.label} {a.pct}%{i < p.allocation.length - 1 ? (i % 2 === 1 ? <br /> : " · ") : ""}</span>
              ))}
            </div>
          </div>
          <div className="flex gap-[7px] mt-[10px]">
            <div className="flex-1 bg-green-tint border border-green-line rounded-[12px] px-[11px] py-2"><div className="text-[8.5px] font-black text-green">TOP CONTRIBUTOR</div><div className="text-[12px] font-black text-ink mt-[2px]">{p.contributor.symbol} +{p.contributor.pp}pp</div></div>
            <div className="flex-1 bg-[#F7E9E5] border border-[#ECD4CC] rounded-[12px] px-[11px] py-2"><div className="text-[8.5px] font-black text-red">LARGEST DETRACTOR</div><div className="text-[12px] font-black text-ink mt-[2px]">{p.detractor.symbol} −{Math.abs(p.detractor.pp)}pp</div></div>
          </div>

          <SectionLabel>HOLDINGS · {p.holdings.length} · EACH LINKS TO ITS PROPOSAL</SectionLabel>
          <Panel className="px-[13px]">
            {rows.map((h, i) => (
              <div key={h.symbol} className={cx("flex items-center gap-[9px] py-[7px]", (i < rows.length - 1 || !all) && "border-b border-paper-2")}>
                <Ticker symbol={h.symbol} tone={tone(h.symbol)} size={28} />
                <span className="flex-1 text-[11.5px] font-extrabold text-ink">
                  {h.link ? <Link href={h.link.href}>{h.name} · {h.weightPct}% <span className="text-[8.5px] text-purple-2">{h.link.label}</span></Link> : <Link href={`/discover/${h.symbol}`}>{h.name} · {h.weightPct}%</Link>}
                </span>
                <MiniSpark width={40} up={h.returnPct >= 0} />
                <span className={cx("w-11 text-right text-[11px] font-black", h.returnPct >= 0 ? "text-[#3A8C4A]" : "text-red")}>{pctText(h.returnPct)}</span>
              </div>
            ))}
            <button onClick={() => setAll((v) => !v)} className="w-full py-[6px] text-center text-[10px] font-extrabold text-green">{all ? "Show fewer ▴" : `All ${p.holdings.length} holdings ▾`}</button>
          </Panel>

          {p.concentration && (
            <div className="mt-[9px] bg-orange-tint border border-orange-line rounded-[13px] px-[13px] py-[10px] flex gap-[9px] items-center">
              <span className="text-[14px]" aria-hidden>⚠</span>
              <span className="flex-1 text-[11px] font-bold text-ink-2"><b className="text-ink">Concentration:</b> {p.concentration.text} <Link href={p.concentration.href} className="font-black text-green">{p.concentration.lessonLabel} · {p.concentration.minutes} min</Link></span>
            </div>
          )}

          <SectionLabel>DECISION JOURNAL</SectionLabel>
          <div className="bg-card border border-line rounded-[14px] px-[14px] py-[11px] mb-4">
            {p.journal.map((j, i) => {
              const last = i === p.journal.length - 1;
              return (
                <div key={j.date} className="flex gap-[9px]">
                  <div className="flex flex-col items-center">
                    <span className="w-[9px] h-[9px] rounded-full mt-[3px] shrink-0" style={{ background: i === 0 ? "#4C8C4A" : "#E58234" }} />
                    {!last && <span className="flex-1 w-[2px] bg-line my-[3px]" />}
                  </div>
                  <div className={cx("flex-1", !last && "pb-[9px]")}>
                    <div className="text-[11.5px] font-black text-ink">{j.date} — {j.title} <span className="text-[9px] text-ink-3">{[j.by, j.vote].filter(Boolean).map((x) => `· ${x}`).join(" ")}</span></div>
                    <div className="text-[10.5px] font-bold text-ink-2 leading-[1.45]">
                      {j.believed && <>Believed: {j.believed} </>}{j.wrongIf && <>Wrong if: {j.wrongIf} </>}{j.review && <>Review: {j.review} </>}{j.learned && <>Learned: {j.learned} </>}
                      {j.since && <b className="text-[#3A8C4A]">Since: {j.since}</b>}{j.rightCall && <b className="text-[#3A8C4A]">Right call: {j.rightCall}</b>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
