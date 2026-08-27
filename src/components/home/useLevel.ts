"use client";
import { useEffect, useState } from "react";
import type { ExplanationLevel } from "@/lib/types";

const LEVELS: ExplanationLevel[] = ["Explorer", "Builder", "Investor", "Trader"];

/** Explanation level from localStorage (`fic.level`), hydrated after mount. */
export function useLevel(fallback: ExplanationLevel = "Investor") {
  const [level, setLevel] = useState<ExplanationLevel>(fallback);
  useEffect(() => {
    try {
      const v = localStorage.getItem("fic.level");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount
      if (v && LEVELS.includes(v as ExplanationLevel)) setLevel(v as ExplanationLevel);
    } catch { /* storage unavailable */ }
  }, []);
  return level;
}
export const isYouth = (l: ExplanationLevel) => l === "Explorer" || l === "Builder";
