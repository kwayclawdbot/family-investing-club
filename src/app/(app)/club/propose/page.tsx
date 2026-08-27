import { getClub, getClubPortfolio, getCompanies, getClubFeed, getProposal, getResearch } from "@/lib/data-live";
import type { Idea } from "@/lib/types";
import { ProposalComposer } from "@/components/club/ProposalComposer";

export default async function ProposePage(props: PageProps<"/club/propose">) {
  const sp = await props.searchParams;
  const [club, portfolio, companies, feed, research, template] = await Promise.all([getClub(), getClubPortfolio(), getCompanies(), getClubFeed(), getResearch(), getProposal("add-ceg-4")]);
  const ideas = feed.flatMap((p) => (p.kind === "idea" ? [p.idea] : [])) as Idea[];
  const symbol = typeof sp.symbol === "string" ? sp.symbol : undefined;
  return <ProposalComposer club={club} portfolio={portfolio} companies={companies} ideas={ideas} research={research} initialSymbol={symbol} template={template!} />;
}
