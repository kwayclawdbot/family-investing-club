/**
 * Who is signed in.
 *
 * The gate has one rule: a member is either signed in or looking at sign-in. There is never a third
 * state that says "your session expired" with nowhere to go — that dead end is the specific bug this
 * app was told to never ship, so a failed refresh signs out and the router sends them to the door.
 */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

type SessionState = { session: Session | null; userId: string | null; loading: boolean };
const Ctx = createContext<SessionState>({ session: null, userId: null, loading: true });

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);

  const value = useMemo(() => ({ session, userId: session?.user.id ?? null, loading }), [session, loading]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useSession = () => useContext(Ctx);
