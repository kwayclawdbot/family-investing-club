"use client";
import { Suspense, useEffect, useState } from "react";
import { KaiSheet } from "@/components/kai/KaiSheet";

/** Kai as a sheet, with the live price of whatever the member is looking at in the context chip.
 *  Prompts are generated for that symbol; the answers come from /api/kai/chat, not a script. */
export function AskKaiSheet({ onClose, context }: { onClose: () => void; context?: string }) {
  const sym = (context ?? "").replace(/^symbol:/, "").toUpperCase();
  const symbol = sym && sym !== "HOME" ? sym : null;
  const [price, setPrice] = useState<string | null>(null);
  useEffect(() => {
    if (!symbol) return;
    let alive = true;
    fetch(`/api/market/quote?symbols=${symbol}`).then((r) => r.json()).then((j) => {
      const q = j?.quotes?.[symbol];
      if (alive && q) setPrice(`$${q.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
    }).catch(() => {});
    return () => { alive = false; };
  }, [symbol]);
  const ctx = symbol ? `${price ? price + " · " : ""}knows what you're looking at: ${symbol}` : "Home";
  const prompts = symbol
    ? [`Explain ${symbol}'s valuation like I'm 10`, `What's the bull and bear case on ${symbol}?`, `How does ${symbol} make money?`]
    : ["Explain P/E ratio like I'm 10", "What moved the market today?", "Quiz me on dividend investing"];
  return (
    <Suspense fallback={null}>
      <KaiSheet embedded onClose={onClose} contextOverride={ctx} prompts={prompts} />
    </Suspense>
  );
}
