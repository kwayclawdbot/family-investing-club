import { notFound } from "next/navigation";
import { getCompany } from "@/lib/data-live";
import { themes } from "@/lib/fixtures/v13-discover";
import { ThemeView } from "@/components/markets/v13/ThemeView";

export default async function ThemePage(props: PageProps<"/theme/[id]">) {
  const { id } = await props.params;
  const t = themes[id];
  if (!t) notFound();
  const quotes = Object.fromEntries((await Promise.all(t.companies.map(async (c) => [c.symbol, await getCompany(c.symbol)] as const))).map(([s, c]) => [s, c ? { price: c.price, changePct: c.changePct } : undefined]));
  return <ThemeView t={t} quotes={quotes} />;
}
