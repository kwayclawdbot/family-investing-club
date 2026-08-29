import { NotificationsV3, type NeedsYouItem } from "@/components/profile/NotificationsV3";
import { getNotificationsDetailed } from "@/lib/live/notifications";
import { getProposals } from "@/lib/live/club";
import { getSession } from "@/lib/live/session";

/** Notifications — real rows, with "needs you" derived from what the app is actually waiting on. */
export default async function NotificationsPage() {
  const [rows, proposals, session] = await Promise.all([getNotificationsDetailed(40), getProposals(), getSession()]);
  const items = rows ?? [];

  const needsYou: NeedsYouItem[] = [];
  // An open club vote this member hasn't cast is the one thing the club is literally waiting on.
  for (const p of (proposals ?? []).filter((x) => x.status === "open")) {
    const mine = p.votes.find((v) => v.memberId === session?.user.id);
    if (mine?.vote) continue;
    needsYou.push({
      id: `proposal:${p.id}`, emoji: "🗳", tint: "#EFEBF8",
      title: `Vote on $${p.symbol} ${p.fromWeightPct}% → ${p.toWeightPct}%`,
      sub: `${p.by} proposed · ${p.endsIn === "closed" ? "past its close" : `closes in ${p.endsIn}`} · ${p.votes.filter((v) => v.vote).length} of ${p.votes.length} in`,
      action: { label: "Vote", href: `/club/vote/${p.id}`, tone: "purple" },
    });
  }
  // Unread things a person said to this member.
  for (const n of items.filter((x) => !x.read && ["reply", "mention", "ask", "comment"].includes(x.type))) {
    needsYou.push({
      id: n.id, emoji: "💬", tint: "#EAF2E3", title: n.title, sub: n.body.slice(0, 90),
      action: { label: "Open", href: n.href, tone: "green" },
    });
  }

  return <NotificationsV3 items={items} needsYou={needsYou} />;
}
