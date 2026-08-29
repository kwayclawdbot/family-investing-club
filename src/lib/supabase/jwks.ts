import type { JWK } from "@supabase/supabase-js";

/**
 * Process-level JWKS cache so `auth.getClaims()` verifies the access token LOCALLY (0–1 ms)
 * instead of a GoTrue round-trip on every proxied request. Public data; rotation is safe because
 * getClaims falls through to the live JWKS when a `kid` is unknown. (Ported from fta-dashboard.)
 */
const JWKS_TTL_MS = 10 * 60 * 1000;
let cachedKeys: JWK[] | null = null;
let cachedAt = 0;

export async function getProjectJwks(): Promise<JWK[] | null> {
  const now = Date.now();
  if (cachedKeys && now - cachedAt < JWKS_TTL_MS) return cachedKeys;
  try {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
    if (!base || !anon) return cachedKeys;
    const res = await fetch(`${base}/auth/v1/.well-known/jwks.json`, { headers: { apikey: anon }, cache: "no-store", signal: AbortSignal.timeout(3000) });
    if (!res.ok) return cachedKeys;
    const data = (await res.json()) as { keys?: JWK[] };
    if (!Array.isArray(data.keys) || data.keys.length === 0) return cachedKeys;
    cachedKeys = data.keys;
    cachedAt = now;
    return cachedKeys;
  } catch {
    return cachedKeys;
  }
}
