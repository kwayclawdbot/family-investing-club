import { getClub, getMyPortfolio } from "@/lib/data";
import { MyPortfolioView } from "@/components/verify/MyPortfolioView";

const flag = (v: string | string[] | undefined) => (v === "1" ? true : v === "0" ? false : undefined);

export default async function MyPortfolioPage(props: PageProps<"/profile/portfolio">) {
  const [sp, club, p] = await Promise.all([props.searchParams, getClub(), getMyPortfolio()]);
  return <MyPortfolioView p={p} clubName={club.shortName} connected={flag(sp.connected)} />;
}
