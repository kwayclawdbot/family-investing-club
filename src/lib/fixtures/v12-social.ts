/** v11/v12 social layer fixtures: circles rail, main feed with artifacts, circle rooms, private club chat, notifications. */
import type { BeltColor } from "@/lib/types";

export type Circle = { id: string; emoji: string; name: string; daysLeft: number; people: number; color: string; tint: string; symbol?: string; context?: string; consensus?: string };
export const circles: Circle[] = [
  { id: "nvda-earnings", emoji: "📊", name: "NVDA Earnings", daysLeft: 12, people: 842, color: "#4C8C4A", tint: "#EAF2E3", symbol: "NVDA", context: "earnings Wed 4:30 PM", consensus: "FIC consensus 🟢 68% Buy · your club owns 12%" },
  { id: "fed-decision", emoji: "🏛", name: "Fed Decision", daysLeft: 5, people: 1400, color: "#E58234", tint: "#FBEDD9", context: "FOMC decision Wed 2:00 PM", consensus: "1,204 poll votes · 64% expect a cut" },
  { id: "apple-event", emoji: "🍎", name: "Apple Event", daysLeft: 21, people: 534, color: "#8B7BC7", tint: "#F5F0E4", symbol: "AAPL", context: "keynote Sep 9 · 1:00 PM", consensus: "FIC consensus 🟢 61% Buy" },
  { id: "ai-infra", emoji: "🤖", name: "AI Infra", daysLeft: 28, people: 306, color: "#6B5CA8", tint: "#EFEBF8", context: "theme circle · chips, power, data centers", consensus: "3 clubs researching" },
  { id: "uranium", emoji: "⚡", name: "Uranium", daysLeft: 17, people: 189, color: "#E9B949", tint: "#FFFDF4", symbol: "CCJ", context: "riding the Nuclear idea", consensus: "287 research notes this week" },
];
export const circleById = (id: string) => circles.find((c) => c.id === id);
export const fmtPeople = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K` : String(n));

export type FeedAuthor = { name: string; initial: string; bg: string; belt: BeltColor | null; beltLabel?: string };
export type FeedPost =
  | { kind: "text"; id: string; author: FeedAuthor; ago: string; text: string; pick?: { symbol: string; name: string; stance: "BUY" | "WATCH" | "PASS"; sincePct: number; spark: number[] }; replies: number; likes: number; reposts: number }
  | { kind: "poll"; id: string; author: FeedAuthor; ago: string; question: string; options: { label: string; pct: number }[]; votes: number; circleId: string; circleLabel: string }
  | { kind: "kai"; id: string; ago: string; text: string; circleId: string };

export const SARAH: FeedAuthor = { name: "Sarah J.", initial: "S", bg: "bg-coral", belt: "blue", beltLabel: "Blue" };
export const MARCUS: FeedAuthor = { name: "Marcus T.", initial: "T", bg: "bg-green-3", belt: "black", beltLabel: "Black" };

export const mainFeed: FeedPost[] = [
  { kind: "text", id: "p1", author: SARAH, ago: "12m", text: "AMZN ad revenue grew 24% — the quiet business nobody prices in. Full thesis in my research note 👇", pick: { symbol: "AMZN", name: "Amazon", stance: "BUY", sincePct: 18.7, spark: [12, 10, 13, 7, 9, 3] }, replies: 34, likes: 87, reposts: 12 },
  { kind: "poll", id: "p2", author: MARCUS, ago: "40m", question: "Poll: does the Fed cut this month?", options: [{ label: "Yes, 25bps", pct: 64 }, { label: "Hold", pct: 36 }], votes: 1204, circleId: "fed-decision", circleLabel: "🏛 Fed Decision" },
  { kind: "kai", id: "p3", ago: "1h", text: "Today's NVDA debate in 3 lines: bulls cite data-center backlog, bears cite 60× P/E, and 4 clubs opened research.", circleId: "nvda-earnings" },
];

export type CircleMessage =
  | { kind: "msg"; id: string; author: FeedAuthor; text: string; chart?: { label: string; points: number[]; color: string } }
  | { kind: "mine"; id: string; text: string }
  | { kind: "kai"; id: string; text: string; detail: string };
export const circleMessages: Record<string, CircleMessage[]> = {
  "nvda-earnings": [
    { kind: "msg", id: "m1", author: { name: "Miguel", initial: "M", bg: "bg-[#B08968]", belt: "purple", beltLabel: "Purple" }, text: "Whisper numbers are way above guidance. Data-center backlog is the whole story." },
    { kind: "msg", id: "m2", author: { name: "Jen", initial: "J", bg: "bg-coral", belt: "yellow", beltLabel: "Yellow II" }, text: "@Miguel at 60× earnings the beat is already priced in, no?", chart: { label: "P/E vs 5-yr avg", points: [4, 7, 5, 10, 9, 13], color: "#C96A57" } },
    { kind: "mine", id: "m3", text: "Our club trimmed at 15% → 12% in July exactly for this reason. Decision journal says review after earnings." },
    { kind: "kai", id: "m4", text: "247 messages today · 58% lean bullish · top risk cited: valuation · 3 research notes shared.", detail: "Bull case (58%): data-center backlog through 2027, whisper numbers above guidance. Bear case (42%): 60× P/E already prices the beat; hyperscalers designing their own chips. Most-shared research: Sarah's valuation note, Miguel's backlog tracker, the Mensah Club decision journal. Watch: guidance for next quarter, gross margin." },
  ],
  "fed-decision": [
    { kind: "msg", id: "f1", author: MARCUS, text: "Poll's at 64% cut. Bond market says 70%. Someone's wrong." },
    { kind: "kai", id: "f2", text: "1,204 poll votes · 64% expect a 25bps cut · top argument: cooling inflation print.", detail: "The circle leans cut. Hold voters cite sticky services inflation. What a cut means for beginners: borrowing gets cheaper, bond yields fall, growth stocks usually cheer." },
  ],
};

export type ClubChat = { id: string; author: { name: string; initial: string; bg: string; belt: BeltColor; child?: boolean }; text: string; artifact?: { symbol: string; line: string }; readBy?: number; system?: string };
export const clubChat: ClubChat[] = [
  { id: "c1", author: { name: "Dad", initial: "D", bg: "bg-[#B08968]", belt: "yellow" }, text: "Everyone see the CEG contract news? Thesis is playing out faster than I hoped 👀" },
  { id: "c2", author: { name: "Andwele", initial: "A", bg: "bg-green-3", belt: "yellow" }, text: "Called it 🔥 voting yes tonight", artifact: { symbol: "CEG", line: "+18% since we bought" } },
  { id: "c3", author: { name: "Kway", initial: "K", bg: "bg-green-2", belt: "purple" }, text: "Arielle finishes the energy lesson tonight — then it's 4/4. Full family vote 🎉", readBy: 3 },
  { id: "c4", author: { name: "Arielle 🎓", initial: "A", bg: "bg-gold", belt: "white", child: true }, text: "Done!! Quiz 10/10 ⭐ voting after dinner", system: "⭐ Arielle earned voting rights on this proposal · +20 XP" },
];

export type NeedsYou = { id: string; icon: { emoji?: string; tint?: string; avatar?: { initial: string; bg: string; belt: BeltColor } }; title: string; sub: string; action: { label: string; href: string; tone: "purple" | "green" | "orange" } };
export const needsYou: NeedsYou[] = [
  { id: "n1", icon: { emoji: "🗳", tint: "#EFEBF8" }, title: "Vote on CEG closes in 8 hours", sub: "you're the last adult vote", action: { label: "Vote", href: "/club/vote/add-ceg-4", tone: "purple" } },
  { id: "n2", icon: { avatar: { initial: "S", bg: "bg-coral", belt: "blue" } }, title: "Sarah replied to your COST pick", sub: "“what about e-commerce margin…”", action: { label: "Reply", href: "/club/pick/mom-cost", tone: "green" } },
  { id: "n3", icon: { emoji: "🔍", tint: "#FBEDD9" }, title: "Your AMZN research is due Thursday", sub: "60% complete · Family Night presentation", action: { label: "Continue", href: "/club/research", tone: "orange" } },
];
export type Update = { id: string; icon: { emoji?: string; tint?: string; avatar?: { initial: string; bg: string; belt: BeltColor } }; who?: string; text: string; ago: string; href: string };
export const updates: Update[] = [
  { id: "u1", icon: { avatar: { initial: "A", bg: "bg-green-3", belt: "yellow" } }, who: "Andwele", text: " made a pick: NVDA · Buy", ago: "2h", href: "/club/pick/andwele-nvda" },
  { id: "u2", icon: { emoji: "🏁", tint: "#EAF2E3" }, text: "Club hit this week's 500 XP goal 🎉", ago: "5h", href: "/club/xp" },
  { id: "u3", icon: { emoji: "📊", tint: "#FBEDD9" }, who: "NVDA Earnings", text: " circle opened · 842 already in", ago: "1d", href: "/circle/nvda-earnings" },
  { id: "u4", icon: { avatar: { initial: "D", bg: "bg-[#B08968]", belt: "yellow" } }, who: "Dad", text: " earned Yellow Belt II", ago: "1d", href: "/club?tab=members" },
];
