import { getXpLeaderboard } from "@/lib/data-live";
import { XpBoard } from "@/components/belts/XpBoard";

export default async function XpLeaderboardPage() {
  const lb = await getXpLeaderboard();
  return <XpBoard lb={lb} />;
}
