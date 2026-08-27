import { getClub, getMyPortfolio } from "@/lib/data-live";
import { PrivacySharing } from "@/components/verify/PrivacySharing";

const flag = (v: string | string[] | undefined) => (v === "1" ? true : v === "0" ? false : undefined);

export default async function PrivacyPage(props: PageProps<"/profile/privacy">) {
  const [sp, club, p] = await Promise.all([props.searchParams, getClub(), getMyPortfolio()]);
  const preview = club.members.find((m) => m.id === "andwele")?.name ?? "Andwele";
  return <PrivacySharing clubName={club.shortName} previewMember={preview} holdings={p.holdings} portfolioValue={p.value} connected={flag(sp.connected)} first={sp.first === "1"} />;
}
