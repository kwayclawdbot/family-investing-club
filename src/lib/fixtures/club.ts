import type { Club, Pick, ClubProposal, ClubPortfolio, ResearchAssignment, ClubActivity, Community, ChildHome, Comment } from "@/lib/types";

const wave = (n: number, start: number, end: number, vol: number, seed = 1) => {
  let x = seed;
  const rnd = () => ((x = (x * 9301 + 49297) % 233280) / 233280 - 0.5) * vol;
  return Array.from({ length: n }, (_, i) => +(start + ((end - start) * i) / (n - 1) + rnd()).toFixed(2));
};

export const club: Club = {
  id: "mensah",
  name: "The Mensah Family Investing Club",
  shortName: "The Mensah Club",
  kind: "family",
  privacy: "private",
  est: "2026",
  inviteCode: "MENSAH-23",
  inviteLink: "fic.club/join/MENSAH-23",
  members: [
    { id: "kway", name: "Kway", initial: "K", color: "bg-green-3", role: "founder", level: "Investor", isYou: true },
    { id: "andwele", name: "Andwele", initial: "A", color: "bg-green-2", role: "member", level: "Builder" },
    { id: "arielle", name: "Arielle", initial: "A", color: "bg-gold", role: "child", level: "Explorer", voteGated: true, gateReason: 'needs the "What is energy?" mini-lesson before her vote counts' },
    { id: "mom", name: "Mom", initial: "M", color: "bg-coral", role: "admin", level: "Investor" },
    { id: "dad", name: "Dad", initial: "D", color: "bg-purple", role: "admin", level: "Investor" },
  ],
  rules: { votes: "majority", kidsCanVote: true, maxWeightPct: 10, weeklyPrompt: "Thu 7 PM" },
  streakWeeks: 23,
  investingNight: { when: "Thu 7 PM", topic: "Costco presentations" },
};
// The artboards say "4 members": Dad is shown as a proposer/voter but not in the avatar row. Treat Dad as Mom's co-admin
// on the same household seat; UI counts `visibleMembers`.
export const visibleMembers = club.members.filter((m) => m.id !== "dad");

const nvdaReplies: Comment[] = [
  { id: "r1", author: "Mom", ago: "1h", text: "Love the company — but what about the price? Aren't we paying a lot for what it earns?" },
  { id: "r2", author: "Dad", ago: "40m", text: "P/E is ~60 vs. 35 for the market. Fast growers can earn it — that's the bet." },
];
export const picks: Pick[] = [
  { id: "andwele-nvda", clubId: "mensah", authorId: "andwele", author: "Andwele", ago: "2h", symbol: "NVDA", name: "NVIDIA Corp.", stance: "buy", reason: "Their chips are in everything AI. Every data center being built needs them.", horizon: "3y", confidence: 3, priceAtPick: 1204, agree: 2, notSure: 1, replies: nvdaReplies, visibility: "club" },
  { id: "andwele-aapl", clubId: "mensah", authorId: "andwele", author: "Andwele", ago: "3d", symbol: "AAPL", name: "Apple Inc.", stance: "buy", reason: "Services money is the quiet giant.", horizon: "5y+", confidence: 4, priceAtPick: 224.1, agree: 1, notSure: 0, replies: [], visibility: "club" },
  { id: "mom-cost", clubId: "mensah", authorId: "mom", author: "Mom", ago: "1w", symbol: "COST", name: "Costco Wholesale", stance: "watch", reason: "Membership renewals at 93% — that's the moat.", horizon: "3y", confidence: 3, priceAtPick: 1071.5, agree: 3, notSure: 0, replies: [], visibility: "club" },
];

export const proposals: ClubProposal[] = [
  {
    id: "add-ceg-4", clubId: "mensah", kind: "resize", symbol: "CEG", name: "Constellation Energy", fromWeightPct: 4, toWeightPct: 8, practiceDollars: 1138,
    by: "Dad", byId: "dad", postedAgo: "Tuesday", endsIn: "2 days",
    rationale: "Nuclear supply deals with data centers keep landing. Our 4% starter position is up 18% and the thesis got stronger.",
    evidence: [{ label: "IDEA: NUCLEAR ENERGY", href: "/club/idea/nuclear-next-decade" }, { label: "MOM'S RESEARCH", href: "/club/research" }],
    sinceBuyPct: 18,
    conceptGate: { concept: "position sizing", minutes: 3, href: "/learn/path/build-a-portfolio" },
    votes: [{ memberId: "kway", vote: null }, { memberId: "andwele", vote: "for" }, { memberId: "mom", vote: "for" }, { memberId: "dad", vote: "for" }, { memberId: "arielle", vote: null }],
    status: "open",
  },
  { id: "voo-core", clubId: "mensah", kind: "add", symbol: "VOO", name: "Vanguard S&P 500 ETF", fromWeightPct: 0, toWeightPct: 40, practiceDollars: 11380, by: "Kway", byId: "kway", postedAgo: "8 months ago", endsIn: "closed", rationale: "Core: own the whole market before we pick anything.", evidence: [], votes: [{ memberId: "kway", vote: "for" }, { memberId: "andwele", vote: "for" }, { memberId: "mom", vote: "for" }, { memberId: "arielle", vote: "for" }], status: "passed" },
  { id: "nvda-12", clubId: "mensah", kind: "add", symbol: "NVDA", name: "NVIDIA Corp.", fromWeightPct: 0, toWeightPct: 12, practiceDollars: 3414, by: "Andwele", byId: "andwele", postedAgo: "5 months ago", endsIn: "closed", rationale: "From Andwele's Pick → Idea → vote 3-1.", evidence: [], votes: [{ memberId: "kway", vote: "for" }, { memberId: "andwele", vote: "for" }, { memberId: "mom", vote: "for" }, { memberId: "arielle", vote: "against" }], status: "passed" },
];

export const clubPortfolio: ClubPortfolio = {
  clubId: "mensah",
  name: "Mensah Club Portfolio",
  value: 28450.75,
  ytdPct: 8.2,
  benchmarkYtdPct: 9.2,
  series: wave(40, 26300, 28450, 320, 71),
  holdings: [
    { symbol: "VOO", name: "S&P 500 ETF", weightPct: 40, returnPct: 9, origin: "Proposal #1 · unanimous", proposalId: "voo-core" },
    { symbol: "NVDA", name: "Nvidia", weightPct: 12, returnPct: 31, origin: "From Andwele's Pick → Idea → vote 3-1", proposalId: "nvda-12" },
    { symbol: "CEG", name: "Constellation", weightPct: 4, returnPct: 2, origin: "Added Tue · from Sarah's public idea" },
    { symbol: "AAPL", name: "Apple", weightPct: 10, returnPct: 6, origin: "Proposal #2 · 4-0" },
    { symbol: "KO", name: "Coca-Cola", weightPct: 8, returnPct: 3, origin: "Mom's dividend pick → vote 4-0" },
    { symbol: "DIS", name: "Disney", weightPct: 6, returnPct: -2, origin: "Arielle's pick → vote 3-1" },
  ],
  journal: [
    { date: "Aug 24", title: "Bought CEG (4%).", believed: "AI data centers need baseload power.", wrongIf: "reactor deals stall.", review: "Nov earnings." },
    { date: "Jul 12", title: "Trimmed NVDA 15%→12%.", learned: "one stock was 15% of us — diversification lesson completed by all 4 members 🎓" },
  ],
};

export const research: ResearchAssignment[] = [
  { id: "ra1", symbol: "COST", name: "Costco Wholesale", assigneeId: "kway", assignee: "you", due: "before Family Night · Thursday 7 PM", status: "open", reason: "Everyone we know shops there" },
  { id: "ra2", symbol: "NVDA", name: "NVIDIA Corp.", assigneeId: "andwele", assignee: "Andwele", due: "Thursday", status: "open", reason: "Their chips are in everything AI" },
  { id: "ra3", symbol: "COST", name: "Costco Wholesale", assigneeId: "mom", assignee: "Mom", due: "done", status: "done", notes: "Membership renewals at 93% — that's the moat.", reason: "Membership economics" },
  { id: "ra4", symbol: "DIS", name: "Disney", assigneeId: "arielle", assignee: "Arielle", due: "Thursday · presents", status: "open", reason: "Arielle's favourite" },
];

export const activity: ClubActivity[] = [
  { id: "a1", actorId: "andwele", actor: "Andwele", ago: "2h", kind: "pick", text: "made a Pick: NVDA · BUY", quote: "their chips are in everything AI", href: "/club/pick/andwele-nvda" },
  { id: "a2", actorId: "mom", actor: "Mom", ago: "5h", kind: "research", text: "finished Costco research", quote: "Membership renewals at 93% — that's the moat.", href: "/club/research" },
  { id: "a3", actorId: "mom", actor: "Mom", ago: "5h", kind: "comment", text: "commented on the Costco research", quote: "membership renewals are the story", href: "/club/research" },
  { id: "a4", actorId: "dad", actor: "Dad", ago: "Tue", kind: "vote", text: "proposed Add CEG +4%", href: "/club/vote/add-ceg-4" },
  { id: "a5", actorId: "arielle", actor: "Arielle", ago: "1d", kind: "lesson", text: "finished Money Basics · Lesson 9", href: "/family/members/arielle" },
];

export const community: Community = {
  trendingIdeas: [{ id: "nuclear-next-decade", title: "Nuclear Energy: The Next Decade", author: "Sarah J.", status: "WATCHING", following: 125, symbols: ["CEG", "VST", "CCJ"] }],
  popularPicks: [
    { symbol: "COST", stance: "buy", quote: "recession-proof", agree: 214 },
    { symbol: "NVDA", stance: "watch", quote: "priced for perfection", agree: 168 },
  ],
  publicClubs: [
    { id: "dividend-beginners", name: "Dividend Beginners", emoji: "💰", members: 640, blurb: "public portfolio +6.1% YTD", portfolioYtdPct: 6.1 },
    { id: "clean-energy-investors", name: "Clean Energy Investors", emoji: "⚡", members: 1200, blurb: "4 active ideas · moderated", activeIdeas: 4, moderated: true },
  ],
  mostResearched: [{ symbol: "NVDA", count: 412 }, { symbol: "CEG", count: 287 }, { symbol: "COST", count: 201 }, { symbol: "AAPL", count: 188 }],
  peopleToFollow: [{ id: "sarah-j", name: "Sarah J.", initial: "S" }, { id: "jordan-p", name: "Jordan P.", initial: "J" }, { id: "coach-tia", name: "Coach Tia", initial: "T" }],
  live: { id: "market-open-talk", title: "Market Open Talk", inRoom: 128 },
  publicPicks: [
    { id: "jordan-cost", clubId: "public", authorId: "jordan-p", author: "Jordan P.", ago: "1h", symbol: "COST", name: "Costco Wholesale", stance: "buy", reason: "Recession-proof memberships.", horizon: "5y+", confidence: 4, priceAtPick: 1088.22, agree: 214, notSure: 12, replies: [], visibility: "public" },
  ],
};

export const childHome: ChildHome = {
  name: "Arielle",
  level: "Explorer",
  streakDays: 4,
  familyRequest: { fromId: "dad", from: "Dad", symbol: "AMZN", name: "Amazon", text: "You use it more than any of us — what do you think?" },
  nextLesson: { path: "MONEY BASICS", title: "What is saving for?", minutes: 5, href: "/lesson/mb-4" },
  practice: { value: 512.4, changePct: 2.5, note: "2 shares DIS · 1 share VOO — both were family votes you joined!" },
  familyVote: { proposalId: "add-ceg-4", text: "Add CEG? Finish the energy mini-lesson to vote", gated: true },
  newBadge: { emoji: "⭐", label: "Quiz Whiz", sub: "10 quiz answers in a row" },
  investingNight: { when: "Thu", text: "you present Disney!" },
};

/** Company-page social layer: who in the club is watching / picked a symbol. */
export const clubWatching: Record<string, string[]> = { AAPL: ["kway", "andwele", "mom"], NVDA: ["andwele", "dad"], COST: ["kway", "mom", "arielle"], CEG: ["dad", "mom"] };
export const costcoQuote = { symbol: "COST", name: "Costco Wholesale", price: 1088.22, changePct: 0.6 };
