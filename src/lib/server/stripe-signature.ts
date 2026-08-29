import crypto from "crypto";

/**
 * Stripe webhook signature check, by hand (no stripe SDK) — ported verbatim from
 * FTA's two webhook routes and shared by both. `Stripe-Signature: t=<unix>,v1=<hex>`;
 * the signed payload is `${t}.${rawBody}` under the endpoint secret, 10-minute
 * tolerance. Dependency-free so scripts/platform-smoke.mjs can unit-test it.
 */
export const STRIPE_SIG_TOLERANCE_SEC = 600;

export function verifyStripeSignature(
  payload: string,
  header: string | null | undefined,
  secret: string,
  nowSec: number = Date.now() / 1000
): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(header.split(",").map((kv) => kv.split("=") as [string, string]));
  const t = parts["t"];
  const v1 = parts["v1"];
  if (!t || !v1) return false;
  if (Math.abs(nowSec - Number(t)) > STRIPE_SIG_TOLERANCE_SEC) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${t}.${payload}`).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
  } catch {
    return false;
  }
}

/** Build a `Stripe-Signature` header for a payload — test helper (never used in prod paths). */
export function signStripePayload(payload: string, secret: string, tSec: number = Math.floor(Date.now() / 1000)): string {
  const v1 = crypto.createHmac("sha256", secret).update(`${tSec}.${payload}`).digest("hex");
  return `t=${tSec},v1=${v1}`;
}
