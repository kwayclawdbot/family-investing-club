import { getClub, getLeaderboards } from "@/lib/data";
import { Leaderboards } from "@/components/club/Leaderboards";

export default async function LeaderboardsPage() {
  const [club, lb] = await Promise.all([getClub(), getLeaderboards()]);
  return <Leaderboards club={club} lb={lb} />;
}
