import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { adminClient } from "@/lib/live/supa";
import { NotConfiguredError, logNotConfigured } from "./env";

/**
 * Service-role client for the platform lane (webhooks, crons, push dispatch, Kai).
 * Same shape as FTA's `@/lib/supabase/admin` so ported code keeps `createAdminClient()`;
 * backed by FIC's `adminClient()` and fail-closed when SUPABASE_SERVICE_ROLE_KEY is absent.
 * These routes authenticate with their own secrets (see SERVICE_PREFIXES in src/lib/supabase/proxy.ts).
 */
export function createAdminClient(): SupabaseClient {
  const c = adminClient();
  if (!c) {
    const missing = process.env.NEXT_PUBLIC_SUPABASE_URL ? "SUPABASE_SERVICE_ROLE_KEY" : "NEXT_PUBLIC_SUPABASE_URL";
    logNotConfigured(missing);
    throw new NotConfiguredError(missing);
  }
  return c;
}
