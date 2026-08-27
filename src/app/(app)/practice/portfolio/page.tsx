import { getPortfolio, getOrders, getCompanies } from "@/lib/data-live";
import { PracticePortfolio } from "@/components/markets/PracticePortfolio";
export default async function PracticePortfolioPage() {
  const [portfolio, orders, companies] = await Promise.all([getPortfolio(), getOrders(), getCompanies()]);
  return <div className="pt-[14px] pb-6"><PracticePortfolio portfolio={portfolio} orders={orders} companies={companies} /></div>;
}
