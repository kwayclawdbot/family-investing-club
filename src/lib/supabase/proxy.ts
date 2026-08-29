import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getProjectJwks } from "@/lib/supabase/jwks";
import { demoAllowed } from "@/lib/live/demo";

/** First-touch referral cookie (any URL carrying ?ref=CODE). Same 90-day semantics as FTA's `fta_ref`. */
export const REF_COOKIE = "fic_ref";
export const REF_COOKIE_MAX_AGE = 60 * 60 * 24 * 90;

/** Member-only route prefixes. Everything else (welcome, auth, market API, static) is public. */
export const PROTECTED_PREFIXES = [
  "/home", "/club", "/discover", "/learn", "/profile", "/family", "/community", "/practice", "/live",
  "/screener", "/search", "/theme", "/circle", "/kai", "/lesson", "/onboarding", "/admin",
  "/api/club", "/api/onboarding", "/api/family", "/api/notifications", "/api/practice", "/api/learn", "/api/community", "/api/admin", "/api/kai", "/api/billing",
];
/** Server-to-server routes: verified by their own secret (CRON_SECRET, Stripe signature, push secret), never by a cookie. */
export const SERVICE_PREFIXES = ["/api/cron", "/api/stripe", "/api/shop/webhook", "/api/push", "/api/marketing", "/api/drips"];
const AUTH_PAGES = ["/login", "/signup"];

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

/**
 * Refresh the Supabase session cookie and apply the two auth redirects. Verification is local
 * (JWKS); pages and routes still resolve the member themselves under RLS — this only decides
 * whether to redirect. Signed-out visitors keep the fixture demo ONLY where `demoAllowed()`
 * (preview deploys / FIC_DEMO=1); in production they go to /login.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(), process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim(), {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const jwks = await getProjectJwks();
  const { data } = await supabase.auth.getClaims(undefined, jwks ? { jwks: { keys: jwks } } : undefined);
  const userId = data?.claims?.sub ?? null;
  const { pathname } = request.nextUrl;

  if (!userId && isProtectedPath(pathname) && !demoAllowed()) {
    const url = request.nextUrl.clone();
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    url.pathname = "/login";
    url.search = pathname === "/home" ? "" : `?next=${encodeURIComponent(pathname + request.nextUrl.search)}`;
    return NextResponse.redirect(url);
  }
  if (userId && AUTH_PAGES.includes(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const ref = request.nextUrl.searchParams.get("ref");
  if (ref && !request.cookies.get(REF_COOKIE)) {
    response.cookies.set(REF_COOKIE, ref.trim().toUpperCase(), { maxAge: REF_COOKIE_MAX_AGE, httpOnly: true, sameSite: "lax", path: "/", secure: process.env.NODE_ENV === "production" });
  }
  return response;
}
