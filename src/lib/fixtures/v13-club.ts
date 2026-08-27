/** Round 8 — prototype v2 (home · clubchat · clubperf · clubdec · wheel · pick · kai) lane fixtures. */
export type TradeIdea = { id: string; symbol: string; tag: string; tagTone: "club" | "kai"; title: string; sub: string; meta: string; href?: string; kaiContext?: string };
export const tradeIdeas: TradeIdea[] = [
  { id: "ceg", symbol: "CEG", tag: "🔒 CLUB · VOTING", tagTone: "club", title: "Add $CEG +4%", sub: "AI baseload thesis · 8h left", meta: "+18% since idea", href: "/club?tab=decisions" },
  { id: "cost", symbol: "COST", tag: "✦ KAI SPOTTED", tagTone: "kai", title: "$COST dip = entry?", sub: "fits Mom's research · earnings Thu", meta: "watch level $980", kaiContext: "COST" },
];
export const performanceCenter = { picksYtd: "+18.2%", accuracy: "71%" };

/** Holdings origin lines + since-add (prototype clubperf). */
export const holdingsMeta: Record<string, { origin: string; sinceAdd: string }> = {
  VOO: { origin: "core · proposal #1 · voted 4-0", sinceAdd: "+9.0%" },
  NVDA: { origin: "Andwele's pick · voted 3-1 · trimmed Jul", sinceAdd: "+31%" },
  CEG: { origin: "⚡ Nuclear idea · Sarah's public thesis · voted 4-0", sinceAdd: "+18%" },
  AAPL: { origin: "proposal #2 · voted 4-0", sinceAdd: "+6%" },
  KO: { origin: "Mom's dividend pick · voted 4-0", sinceAdd: "+3%" },
  DIS: { origin: "Arielle's pick · voted 3-1", sinceAdd: "−2%" },
};

export const decisionChips = [{ label: "🗳 Open", n: 2 }, { label: "🔎 In research", n: 2 }, { label: "📓 Decided", n: 8 }];
export const publicPoll = { id: "fed-cut", circle: "Fed Decision", emoji: "🏛", question: "Fed cut this month?", votes: 1204, yesPct: 64, closes: "closes Wed" };
export const decisionRecord = {
  votesCast: 9, agedWellPct: 78, avgOutcome: "+11%",
  rows: [{ symbol: "CEG", text: "You voted YES · add 4% · Aug 24", outcome: "+18%" }, { symbol: "TSLA", text: "You voted NO · Aug 2", outcome: "right call · −9%" }],
};

export const kaiNvda = {
  context: "NVDA",
  prompts: ["Explain NVDA's valuation like I'm 10", "Summarize the bull & bear debate", "Quiz me before the club vote"],
  sample: { question: "Is 60× P/E crazy?", answer: "It's high — you're paying $60 for each $1 of earnings. But if earnings double, that 60× becomes 30× overnight. The question is whether +94% growth continues.", lessonLabel: "LESSON: VALUATION", lessonHref: "/lesson/valuation" },
};

/** Sarah's shared thesis artifact inside the club chat (prototype clubchat). */
export const sarahAmznMsg = { id: "s-amzn", name: "Sarah", belt: "blue" as const, text: "Sharing my $AMZN thesis here too — ads are the quiet business 👇", artifact: { symbol: "AMZN", line: "BUY · +18.7% since pick", href: "/discover/AMZN" } };
