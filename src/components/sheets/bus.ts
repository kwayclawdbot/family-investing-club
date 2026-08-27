"use client";
import { useSyncExternalStore } from "react";

/** Tiny client-side sheet bus: any client component can open a sheet without prop drilling. */
export type SheetKind = "pick" | "ask" | "vote" | "invite" | "kai" | "compose";
export type SheetState = { kind: SheetKind; payload?: Record<string, unknown> } | null;

let state: SheetState = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function openSheet(kind: SheetKind, payload?: Record<string, unknown>) { state = { kind, payload }; emit(); }
export function closeSheet() { state = null; emit(); }
export const openVoteSheet = (proposalId: string) => openSheet("vote", { proposalId });
export function useSheet(): SheetState {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => state, () => null);
}

/* ── Ephemeral "+N XP" toast (XP is ambient) ─────────────────────── */
type Toast = { id: number; xp: number } | null;
let toast: Toast = null;
const tl = new Set<() => void>();
let seq = 0;
export function showXp(xp: number) {
  toast = { id: ++seq, xp }; tl.forEach((l) => l());
  const mine = toast.id;
  setTimeout(() => { if (toast?.id === mine) { toast = null; tl.forEach((l) => l()); } }, 1300);
}
export function useXpToast(): Toast {
  return useSyncExternalStore((l) => { tl.add(l); return () => tl.delete(l); }, () => toast, () => null);
}
