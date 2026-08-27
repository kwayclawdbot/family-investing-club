import { redirect } from "next/navigation";
/** The club's own portfolio now lives in the workspace Portfolio tab (Model | Verified). */
export default async function ClubPortfolioPage(props: PageProps<"/club/portfolio">) {
  const sp = await props.searchParams;
  redirect(sp.view === "verified" ? "/club?tab=portfolio&view=verified" : "/club?tab=portfolio");
}
