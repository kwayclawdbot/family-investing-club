import { getCompanies, getPaths, getFlashcards, getClubFeed } from "@/lib/data-live";
import { SearchView } from "@/components/markets/SearchView";

export default async function SearchPage(props: PageProps<"/search">) {
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const [companies, paths, flashcards, feed] = await Promise.all([getCompanies(), getPaths(), getFlashcards(), getClubFeed()]);
  const ideas = feed.flatMap((p) => (p.kind === "idea" ? [p.idea] : []));
  return (
    <div className="pt-[14px] pb-6">
      <SearchView key={q} initialQ={q} companies={companies} paths={paths} flashcards={flashcards} ideas={ideas} />
    </div>
  );
}
