import { redirect } from "next/navigation";
import { Screen, Content } from "@/components/shell/Phone";
import { BottomNav } from "@/components/shell/BottomNav";
import { PlusFab } from "@/components/shell/PlusFab";
import { getSession, isChild, needsOnboarding } from "@/lib/live/session";

/** Member shell. The child tab bar and the onboarding gate come from the profile (server), never localStorage. */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const s = await getSession();
  if (s && needsOnboarding(s)) redirect("/onboarding/who");
  return (
    <Screen>
      <Content>{children}</Content>
      <PlusFab />
      <BottomNav child={s ? isChild(s) : undefined} />
    </Screen>
  );
}
