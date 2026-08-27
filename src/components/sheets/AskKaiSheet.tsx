"use client";
import { Suspense, useEffect, useState } from "react";
import { kai } from "@/lib/data";
import { kaiNvda } from "@/lib/fixtures/v13-club";
import { KaiSheet } from "@/components/kai/KaiSheet";

/** Kai as a sheet: "● knows what you're looking at: NVDA" — prototype `kai`. Deep link stays at /kai. */
export function AskKaiSheet({ onClose, context }: { onClose: () => void; context?: string }) {
  const sym = (context ?? "").replace(/^symbol:/, "").toUpperCase();
  const nvda = !sym || sym === "NVDA" || sym === "HOME";
  const [price, setPrice] = useState<string | null>(null);
  useEffect(() => {
    const s = nvda ? "NVDA" : sym;
    fetch(`/api/market/quote?symbols=${s}`).then((r) => r.json()).then((j) => { const q = j?.quotes?.[s]; if (q) setPrice(`$${q.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}`); }).catch(() => {});
  }, [sym, nvda]);
  const ctx = `${price ? price + " · " : ""}knows what you're looking at: ${nvda ? "NVDA" : sym}`;
  return (
    <Suspense fallback={null}>
      <KaiSheet embedded onClose={onClose} contextOverride={ctx} prompts={nvda ? kaiNvda.prompts : kai.prompts} sample={nvda ? kaiNvda.sample : kai.sample} />
    </Suspense>
  );
}
