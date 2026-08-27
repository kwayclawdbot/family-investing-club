"use client";
import { useEffect, useRef, useState } from "react";

export function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
export function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

/** localStorage-backed state under a `fic.*` key; hydrates after mount. */
export function useStored<T>(key: string, fallback: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(fallback);
  const fb = useRef(fallback);
  useEffect(() => {
    setValue(read(key, fb.current));
  }, [key]);
  const set = (v: T | ((prev: T) => T)) =>
    setValue((prev) => {
      const next = typeof v === "function" ? (v as (p: T) => T)(prev) : v;
      write(key, next);
      return next;
    });
  return [value, set];
}

/** Explanation level as saved by Profile (raw string, not JSON). */
export function readLevel(): "Explorer" | "Builder" | "Investor" | "Trader" {
  try {
    const v = localStorage.getItem("fic.level") ?? "";
    const clean = v.replace(/^"|"$/g, "");
    if (["Explorer", "Builder", "Investor", "Trader"].includes(clean)) return clean as "Explorer";
  } catch {
    /* ignore */
  }
  return "Investor";
}
export function useLevel() {
  const [level, setLevel] = useState<ReturnType<typeof readLevel>>("Investor");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount
    setLevel(readLevel());
  }, []);
  return level;
}

/** Unique id for locally-created objects (kept out of render paths). */
export function newId(prefix = "local") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
