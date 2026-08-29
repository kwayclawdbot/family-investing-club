import { notFound } from "next/navigation";
import { getCompanies } from "@/lib/data-live";
import { themeOf } from "@/lib/content/themes";
import { getThemeStats } from "@/lib/live/discover";
import { ThemeView } from "@/components/markets/v13/ThemeView";

/** Theme — curated companies and case; every number priced live or shown as "—". */
export default async function ThemePage(props: PageProps<"/theme/[id]">) {
  const { id } = await props.params;
  const t = themeOf(id);
  if (!t) notFound();
  const symbols = t.companies.map((c) => c.symbol);
  const [stats, companies] = await Promise.all([getThemeStats(symbols), getCompanies(symbols)]);
  const quotes = Object.fromEntries(companies.map((c) => [c.symbol, { price: c.price, changePct: c.changePct }]));
  return <ThemeView t={t} stats={stats} quotes={quotes} />;
}
