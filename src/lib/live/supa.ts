import "server-only";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createClient as createSupabase, type SupabaseClient } from "@supabase/supabase-js";

/** User-scoped client (cookie session, RLS). Never use for cross-club aggregates. */
export async function userClient(): Promise<SupabaseClient> {
  return createServerSupabase();
}

/** Service-role client — ONLY for cross-club aggregates (see admin.ts) and smoke tooling. */
export function adminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createSupabase(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export type LiveError = { code?: string; message?: string };

/** True when the error means the table/view/function doesn't exist yet (migration not applied). */
export function isMissingRelation(err: unknown): boolean {
  const e = err as LiveError | null;
  const c = e?.code ?? "";
  const m = (e?.message ?? "").toLowerCase();
  return c === "42P01" || c === "PGRST205" || c === "PGRST202" || c === "42883" || m.includes("does not exist") || m.includes("could not find the table") || m.includes("could not find the function");
}

/** Run a live read; any throw or Supabase error → null (fixture fallback). Missing relations are logged once, quietly. */
export async function safe<T>(label: string, fn: () => Promise<T | null>): Promise<T | null> {
  try {
    return await fn();
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      const e = err as LiveError;
      const why = isMissingRelation(err) ? "table missing" : e?.message ?? String(err);
      if (!seen.has(label + why)) { seen.add(label + why); console.warn(`[live] ${label}: ${why}`); }
    }
    return null;
  }
}
const seen = new Set<string>();

/** Throw a Supabase `{error}` so `safe` can classify it. */
export function must<T>(res: { data: T | null; error: LiveError | null }): T {
  if (res.error) throw res.error;
  return res.data as T;
}

export function ago(iso: string | null | undefined): string {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return `${Math.floor(d / 7)}w`;
}

export function endsIn(iso: string | null | undefined): string {
  if (!iso) return "";
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "closed";
  const h = Math.floor(ms / 3600000);
  if (h < 24) return `${Math.max(1, h)} hours`;
  return `${Math.floor(h / 24)} days`;
}

export function hoursLeft(iso: string | null | undefined): number {
  if (!iso) return 0;
  return Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / 3600000));
}

const PALETTE = ["bg-green-3", "bg-coral", "bg-gold", "bg-purple", "bg-orange", "bg-green-2"];
export function colorFor(id: string): string {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
export function initialOf(name: string | null | undefined): string {
  return (name ?? "?").trim().slice(0, 1).toUpperCase() || "?";
}
export function firstName(name: string | null | undefined, email?: string | null): string {
  const n = (name ?? "").trim();
  if (n) return n.split(/\s+/)[0];
  return (email ?? "Member").split("@")[0];
}
