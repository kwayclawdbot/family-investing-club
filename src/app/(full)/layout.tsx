import { Screen } from "@/components/shell/Phone";
/** Full-screen flows without the tab bar: lesson player, Kai sheet. */
export default function FullLayout({ children }: LayoutProps<"/">) {
  return <Screen>{children}</Screen>;
}
