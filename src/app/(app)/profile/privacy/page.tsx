import { getClub, getMyPortfolio, getUser } from "@/lib/data-live";
import { PrivacySharing } from "@/components/verify/PrivacySharing";

const flag = (v: string | string[] | undefined) => (v === "1" ? true : v === "0" ? false : undefined);

export default async function PrivacyPage(props: PageProps<"/profile/privacy">) {
  const [sp, club, p, user] = await Promise.all([props.searchParams, getClub(), getMyPortfolio(), getUser()]);
  // "What a club-mate would see" — an actual other member of this club, or nobody yet.
  const preview = club.members.find((m) => !m.isYou)?.name ?? "a club-mate";
  return <PrivacySharing clubName={club.shortName} previewMember={preview} you={user.firstName} holdings={p.holdings} portfolioValue={p.value} connected={flag(sp.connected)} first={sp.first === "1"} />;
}
