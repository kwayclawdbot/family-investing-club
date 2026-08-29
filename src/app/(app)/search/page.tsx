import { getCompanies, getClubPortfolio, getClub, getPaths } from "@/lib/data-live";
import { getCircles } from "@/lib/live/community";
import { SearchGrouped } from "@/components/markets/v12/SearchGrouped";
import { beltFor } from "@/lib/belts";
import { getIdentities } from "@/lib/data-live";

/** Search — "Where is X?" across live quotes, the club's circles, its members and the curriculum. */
export default async function SearchPage(props: PageProps<"/search">) {
  const sp = await props.searchParams; const q = typeof sp.q === "string" ? sp.q : "";
  const [companies, cp, circles, club, identities, paths] = await Promise.all([
    getCompanies(), getClubPortfolio(), getCircles(), getClub(), getIdentities(), getPaths(),
  ]);
  return (
    <SearchGrouped
      key={q} q={q} companies={companies} owned={cp.holdings.map((h) => h.symbol)}
      allCircles={(circles ?? []).map((c) => ({ id: c.id, slug: c.slug, name: c.name, emoji: c.emoji, line: `${c.daysLeft}d left · ${c.people} in` }))}
      allPeople={club.members.map((m) => {
        const belt = beltFor(identities.find((i) => i.memberId === m.id)?.lifetimeXp ?? 0);
        return { id: m.id, name: m.name, initial: m.name.charAt(0).toUpperCase(), color: "#4C8C4A", belt: belt.short, beltColor: belt.color, line: `${club.shortName}${m.isYou ? " · you" : ""}` };
      })}
      allContent={paths.map((p) => ({ title: p.title, line: `${p.lessons} lessons`, emoji: "📚", href: `/learn/path/${p.slug}` }))}
    />
  );
}
