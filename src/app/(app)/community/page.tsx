import { getCommunity, getClubFeed, getGroups } from "@/lib/data";
import { CommunityView } from "@/components/club/CommunityView";

export default async function CommunityPage() {
  const [c, feed, groups] = await Promise.all([getCommunity(), getClubFeed(), getGroups()]);
  return <CommunityView c={c} feed={feed} groupIds={groups.map((g) => g.id)} />;
}
