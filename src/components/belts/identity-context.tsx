"use client";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Belt, MemberIdentity } from "@/lib/types";
import { beltFromIdentities } from "@/lib/belts";

/**
 * The signed-in member's club identities (real uuids + lifetime XP), seeded once by the app layout.
 * Belts used to be resolved from a fixture keyed on "kway"/"mom" — real members are uuids, so every
 * chip was either wrong or absent. Client components read the registry instead.
 */
const Ctx = createContext<MemberIdentity[]>([]);

export function IdentityProvider({ identities, children }: { identities: MemberIdentity[]; children: ReactNode }) {
  return <Ctx.Provider value={identities}>{children}</Ctx.Provider>;
}

export function useIdentities(): MemberIdentity[] {
  return useContext(Ctx);
}

/** `const beltOf = useBeltOf()` → belt for a member id or display name, or null when unresolved. */
export function useBeltOf(): (memberIdOrName?: string | null) => Belt | null {
  const ids = useIdentities();
  return useMemo(() => (k?: string | null) => beltFromIdentities(ids, k), [ids]);
}
