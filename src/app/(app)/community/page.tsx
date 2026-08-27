import { getCommunity, getCommunityPosts, getCommunityChats, getCommunityClubs, getCommunityLive, getGroups } from "@/lib/data";
import { CommunityHub, type Tab } from "@/components/community/CommunityHub";

const TABS: Tab[] = ["feed", "chats", "clubs", "live"];

/** Community — the public FIC network as a destination (canvas v9, artboard 05). */
export default async function CommunityPage(props: PageProps<"/community">) {
  const sp = await props.searchParams;
  const t = typeof sp.tab === "string" && TABS.includes(sp.tab as Tab) ? (sp.tab as Tab) : "feed";
  const [network, posts, chats, clubs, live, groups] = await Promise.all([getCommunity(), getCommunityPosts(), getCommunityChats(), getCommunityClubs(), getCommunityLive(), getGroups()]);
  return <CommunityHub tab={t} posts={posts} chats={chats} clubs={clubs} live={live} network={network} groupIds={groups.map((g) => g.id)} />;
}
