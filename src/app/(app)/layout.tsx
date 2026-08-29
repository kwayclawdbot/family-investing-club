import { redirect } from "next/navigation";
import { Screen, Content } from "@/components/shell/Phone";
import { BottomNav } from "@/components/shell/BottomNav";
import { PlusFab } from "@/components/shell/PlusFab";
import { IdentityProvider } from "@/components/belts/identity-context";
import { getClub, getIdentities } from "@/lib/data-live";
import { getSession, isChild, needsOnboarding } from "@/lib/live/session";

/** Member shell. The child tab bar and the onboarding gate come from the profile (server), never localStorage.
 *  Club identities are seeded once here so every belt chip below resolves against real members, not a fixture. */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const s = await getSession();
  if (s && needsOnboarding(s)) redirect("/onboarding/who");
  const [identities, club] = await Promise.all([getIdentities(), getClub()]);
  return (
    <IdentityProvider identities={identities}>
      <Screen>
        <Content>{children}</Content>
        <PlusFab clubName={club.shortName} />
        <BottomNav child={s ? isChild(s) : undefined} />
      </Screen>
    </IdentityProvider>
  );
}
