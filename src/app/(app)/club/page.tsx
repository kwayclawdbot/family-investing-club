import { getClubFeed } from "@/lib/data";
import { ClubFeed } from "@/components/club/ClubFeed";
import { KaiFab } from "@/components/shell/KaiFab";

export default async function ClubPage() {
  const feed = await getClubFeed();
  return (
    <>
      <ClubFeed feed={feed} />
      <KaiFab context="club" />
    </>
  );
}
