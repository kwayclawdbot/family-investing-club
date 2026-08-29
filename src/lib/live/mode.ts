import "server-only";
import { getSession } from "./session";
import { demoAllowed } from "./demo";

export type DataMode = "live" | "demo" | "guest";

/**
 * live  — signed in: every read hits Supabase under RLS.
 * demo  — signed out where the fixture demo is allowed (preview / local / FIC_DEMO=1).
 * guest — signed out in production; the proxy has already redirected member routes to /login,
 *         so only public screens see this. Fixtures still render (nothing else to show).
 */
export async function dataMode(): Promise<DataMode> {
  if (await getSession()) return "live";
  return demoAllowed() ? "demo" : "guest";
}

export { demoAllowed, strictLive } from "./demo";
