import { getClub, getCompanies, costcoQuote } from "@/lib/data";
import { PickComposer } from "@/components/club/PickComposer";

export default async function NewPickPage(props: PageProps<"/club/pick/new">) {
  const sp = await props.searchParams;
  const [club, companies] = await Promise.all([getClub(), getCompanies()]);
  const symbol = typeof sp.symbol === "string" ? sp.symbol : undefined;
  return <PickComposer club={club} companies={companies} costco={costcoQuote} initialSymbol={symbol} />;
}
