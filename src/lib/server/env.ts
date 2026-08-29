import "server-only";
import { NextResponse } from "next/server";

/**
 * Fail-closed secrets for the platform lane (push, crons, Stripe, Kai, marketing).
 *
 * FIC runs locally without most third-party secrets. Every route that needs one
 * must refuse with a clear JSON error and log `[not-configured] <ENV>` rather
 * than throwing a bare `undefined` into fetch(). The lead maintains
 * `.env.local.example`; every name used through here is listed in the lane report.
 */
export class NotConfiguredError extends Error {
  readonly env: string;
  constructor(env: string) {
    super(`[not-configured] ${env}`);
    this.name = "NotConfiguredError";
    this.env = env;
  }
}

const warned = new Set<string>();
export function logNotConfigured(name: string): void {
  if (warned.has(name)) return;
  warned.add(name);
  console.warn(`[not-configured] ${name}`);
}

/** Trimmed env value or null (deployed keys can carry trailing newlines). */
export function envOrNull(name: string): string | null {
  const v = process.env[name]?.trim();
  return v ? v : null;
}

/** Trimmed env value; throws NotConfiguredError (and logs once) when absent. */
export function requireEnv(name: string): string {
  const v = envOrNull(name);
  if (!v) {
    logNotConfigured(name);
    throw new NotConfiguredError(name);
  }
  return v;
}

/** 503 JSON response for a missing secret. Logs `[not-configured] NAME` once per process. */
export function notConfigured(name: string, status = 503): NextResponse {
  logNotConfigured(name);
  return NextResponse.json({ error: `${name} is not configured`, not_configured: name }, { status });
}

/** Map a thrown NotConfiguredError to its 503; rethrow anything else. */
export function notConfiguredResponse(err: unknown): NextResponse | null {
  if (err instanceof NotConfiguredError) return notConfigured(err.env);
  return null;
}
