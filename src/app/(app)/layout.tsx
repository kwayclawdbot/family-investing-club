import { Screen, Content } from "@/components/shell/Phone";
import { BottomNav } from "@/components/shell/BottomNav";

/** Tabbed member shell: Home · Learn · Markets · Club · Profile (plan §4). */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <Screen>
      <Content>{children}</Content>
      <BottomNav />
    </Screen>
  );
}
