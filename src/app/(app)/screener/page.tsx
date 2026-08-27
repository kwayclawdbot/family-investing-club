import { getCompanies } from "@/lib/data-live";
import { Screener } from "@/components/markets/v13/Screener";

export default async function ScreenerPage() {
  const companies = await getCompanies();
  const quotes = Object.fromEntries(companies.map((c) => [c.symbol, { price: c.price, changePct: c.changePct }]));
  return <Screener quotes={quotes} />;
}
