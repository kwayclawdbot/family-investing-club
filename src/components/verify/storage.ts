"use client";
import { useEffect, useState } from "react";
import type { SharingLevel } from "@/lib/types";

/** Brokerage link state — `fic.brokerage` or absent. Read-only by design; never a password, never money movement. */
export type StoredBrokerage = { id: string; name: string; last4: string; connectedAt: string };
export type Sharing = { club: SharingLevel; publicBadge: boolean };

export const BROKERAGE_KEY = "fic.brokerage";
export const SHARING_KEY = "fic.sharing";
export const PROMPTED_KEY = "fic.connectPrompted";
/** Defaults are always the most private. */
export const DEFAULT_SHARING: Sharing = { club: "private", publicBadge: false };
export const SAMPLE_BROKERAGE: StoredBrokerage = { id: "fidelity", name: "Fidelity", last4: "8214", connectedAt: "sample" };

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
export function writeJSON(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
}
export function removeKey(key: string) {
  try { localStorage.removeItem(key); } catch { /* storage unavailable */ }
}

export function connectSample() {
  writeJSON(BROKERAGE_KEY, SAMPLE_BROKERAGE);
  // Artboard 05 default once connected: positions only + public badge on.
  writeJSON(SHARING_KEY, { club: "positions", publicBadge: true } satisfies Sharing);
}
export function disconnectBrokerage() {
  removeKey(BROKERAGE_KEY);
  const s = readJSON<Sharing>(SHARING_KEY, DEFAULT_SHARING);
  writeJSON(SHARING_KEY, { ...s, publicBadge: false });
}

/**
 * Brokerage state with an optional render override (`?connected=1|0` on proof routes).
 * Override affects rendering only — storage is untouched.
 */
export function useBrokerage(override?: boolean): { brokerage: StoredBrokerage | null; ready: boolean; setBrokerage: (b: StoredBrokerage | null) => void } {
  const [stored, setStored] = useState<StoredBrokerage | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount
    setStored(readJSON<StoredBrokerage | null>(BROKERAGE_KEY, null));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- same hydration
    setReady(true);
  }, []);
  const brokerage = override === true ? (stored ?? SAMPLE_BROKERAGE) : override === false ? null : stored;
  return { brokerage, ready, setBrokerage: setStored };
}

export function useSharing(override?: boolean): [Sharing, (s: Sharing) => void] {
  const [sharing, setSharing] = useState<Sharing>(DEFAULT_SHARING);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from localStorage after mount
    setSharing(readJSON<Sharing>(SHARING_KEY, override === true ? { club: "positions", publicBadge: true } : DEFAULT_SHARING));
  }, [override]);
  const set = (s: Sharing) => { setSharing(s); writeJSON(SHARING_KEY, s); };
  return [sharing, set];
}

export const SHARING_LABEL: Record<SharingLevel, string> = { private: "Private", positions: "Positions only", allocation: "Allocation only", full: "Full transparency" };
