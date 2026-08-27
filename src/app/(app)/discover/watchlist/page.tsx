import { getWatchlist, getCompanies, getResearch, getClub, clubVisibleMembers } from "@/lib/data-live";
import { WatchlistView } from "@/components/markets/WatchlistView";

export default async function WatchlistPage() {
  const [base, companies, research, club] = await Promise.all([getWatchlist(), getCompanies(), getResearch(), getClub()]);
  const you = club.members.find((m) => m.isYou)?.name ?? "You";
  return (
    <div className="pt-[14px] pb-6">
      <WatchlistView base={base} companies={companies} research={research} members={clubVisibleMembers} clubName={club.shortName} you={you} />
    </div>
  );
}
