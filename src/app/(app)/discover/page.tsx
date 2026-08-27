import { getCompanies } from "@/lib/data-live";
import { DiscoverV13 } from "@/components/markets/v13/DiscoverV13";

/** Discover — prototype v2: signals + one visual stream; the screener lives behind 🔬. */
export default async function DiscoverPage() {
  const companies = await getCompanies();
  const quotes = Object.fromEntries(companies.map((c) => [c.symbol, { price: c.price, changePct: c.changePct }]));
  return <DiscoverV13 quotes={quotes} />;
}
