import { Screen, Content } from "@/components/shell/Phone";
import { BottomNav } from "@/components/shell/BottomNav";
import { PlusFab } from "@/components/shell/PlusFab";

/** Member shell (nav v3): Home · Club · Discover · Learn · Community + the universal ＋. */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <Screen>
      <Content>{children}</Content>
      <PlusFab />
      <BottomNav />
    </Screen>
  );
}
