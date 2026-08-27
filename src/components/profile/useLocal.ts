"use client";
import { useEffect, useState } from "react";

/** Hydration-safe localStorage state under a `fic.*` key. */
export function useLocal<T>(key: string, initial: T): [T, (v: T | ((p: T) => T)) => void, boolean] {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount
      if (raw != null) setValue(JSON.parse(raw) as T);
    } catch { /* storage unavailable */ }
    setReady(true);
  }, [key]);
  const set = (v: T | ((p: T) => T)) => {
    setValue((prev) => {
      const next = typeof v === "function" ? (v as (p: T) => T)(prev) : v;
      try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  };
  return [value, set, ready];
}

export function useShare(text: string, copyValue = text) {
  const [copied, setCopied] = useState(false);
  async function share() {
    try {
      if (typeof navigator !== "undefined" && navigator.share) { await navigator.share({ text }); return; }
      await navigator.clipboard.writeText(copyValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch { /* cancelled */ }
  }
  return { share, copied };
}
