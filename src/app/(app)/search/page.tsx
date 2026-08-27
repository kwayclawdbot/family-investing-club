import { getCompanies, getClubPortfolio } from "@/lib/data-live";
import { SearchGrouped } from "@/components/markets/v12/SearchGrouped";
/** Search — "Where is X?" grouped results (v12). */
export default async function SearchPage(props: PageProps<"/search">) {
  const sp = await props.searchParams; const q = typeof sp.q === "string" ? sp.q : "";
  const [companies, cp] = await Promise.all([getCompanies(), getClubPortfolio()]);
  return <SearchGrouped key={q} q={q} companies={companies} owned={cp.holdings.map((h) => h.symbol)} />;
}
