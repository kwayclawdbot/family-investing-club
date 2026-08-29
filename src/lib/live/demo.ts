/**
 * Demo/fixture policy. Safe to import from the proxy (no server-only, no Node APIs).
 * - demoAllowed(): signed-out visitors may browse the fixture demo (preview deploys, local dev,
 *   or FIC_DEMO=1). Production with no flag → protected routes redirect to /login.
 * - strictLive(): a live reader returning null throws instead of silently rendering a fixture.
 *   Off by default until every domain is ported; `npm run smoke:live` turns it on.
 */
export function demoAllowed(): boolean {
  const flag = process.env.FIC_DEMO;
  if (flag === "1" || flag === "true") return true;
  if (flag === "0" || flag === "false") return false;
  return process.env.VERCEL_ENV === "preview" || process.env.NODE_ENV !== "production";
}

export function strictLive(): boolean {
  const flag = process.env.FIC_STRICT_LIVE;
  return flag === "1" || flag === "true";
}
