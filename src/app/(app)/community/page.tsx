import { redirect } from "next/navigation";
import { getCommunity, getCommunityPosts, getCommunityChats, getCommunityClubs, getCommunityLive, getGroups } from "@/lib/data-live";
import { CommunityHub, type Tab } from "@/components/community/CommunityHub";

/** v11: the Main Feed lives on Home. `/community` keeps only Clubs and Live as drill-ins; everything else goes home. */
export default async function CommunityPage(props: PageProps<"/community">) {
  const sp = await props.searchParams;
  const t = sp.tab;
  if (t !== "clubs" && t !== "live") redirect("/home");
  const [network, posts, chats, clubs, live, groups] = await Promise.all([getCommunity(), getCommunityPosts(), getCommunityChats(), getCommunityClubs(), getCommunityLive(), getGroups()]);
  return <CommunityHub tab={t as Tab} posts={posts} chats={chats} clubs={clubs} live={live} network={network} groupIds={groups.map((g) => g.id)} />;
}
