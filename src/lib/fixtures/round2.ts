import type {
  LiveSession, Flashcard, Game, ChartDrill, Scenario, NewsItem, WatchItem, DiscoverCategory, Metric, Order, Comment,
  ModelPortfolio, Group, Challenge, Member, FamilyLearner, Notification, Faq,
} from "@/lib/types";

const wave = (n: number, start: number, end: number, vol: number, seed = 1) => {
  let x = seed;
  const rnd = () => ((x = (x * 9301 + 49297) % 233280) / 233280 - 0.5) * vol;
  return Array.from({ length: n }, (_, i) => +(start + ((end - start) * i) / (n - 1) + rnd()).toFixed(2));
};

export const liveSessions: LiveSession[] = [
  { id: "market-open-talk", title: "Market Open Talk", instructor: "Coach Tia", level: "All", startsAt: "2026-08-27T13:30:00Z", minutes: 30, status: "live", watching: 128, concepts: ["Market participants", "Volatility"], blurb: "What moved overnight, in plain language, and one concept to watch today." },
  { id: "family-investing-night", title: "Family Investing Night: Pick a company you use", instructor: "Coach Marcus", level: "Explorer", startsAt: "2026-08-28T23:00:00Z", minutes: 45, status: "upcoming", pathSlug: "money-basics", concepts: ["Ownership", "Revenue"], blurb: "Bring the kids. We'll research one household brand together, step by step." },
  { id: "reading-a-chart", title: "Reading a Chart Without Fear", instructor: "Coach Tia", level: "Investor", startsAt: "2026-08-30T17:00:00Z", minutes: 40, status: "upcoming", pathSlug: "stock-market-101", concepts: ["Trends", "Support & resistance"], blurb: "Lines, candles, volume — what actually matters for a beginner." },
  { id: "rec-diversification", title: "Diversification in 20 Minutes", instructor: "Coach Marcus", level: "Investor", startsAt: "2026-08-20T17:00:00Z", minutes: 22, status: "recorded", pathSlug: "build-a-portfolio", concepts: ["Diversification", "ETFs"], blurb: "Why one great stock isn't a plan." },
  { id: "rec-pe-ratio", title: "Is It Expensive? The P/E Ratio", instructor: "Coach Tia", level: "Investor", startsAt: "2026-08-13T17:00:00Z", minutes: 18, status: "recorded", pathSlug: "company-analysis", concepts: ["Valuation", "P/E ratio"], blurb: "One number, explained with pizza." },
  { id: "rec-what-is-a-stock", title: "What Is a Stock, Really?", instructor: "Coach Marcus", level: "Explorer", startsAt: "2026-08-06T17:00:00Z", minutes: 15, status: "recorded", pathSlug: "investing-foundations", concepts: ["Ownership"], blurb: "A slice of a business — with a lemonade stand." },
];

export const flashcards: Flashcard[] = [
  { id: "f1", term: "Dividend", definition: "A slice of a company's profit paid to shareholders.", concept: "Dividends", pathSlug: "investing-foundations" },
  { id: "f2", term: "Diversification", definition: "Spreading money across many investments so one bad result can't sink you.", concept: "Diversification", pathSlug: "build-a-portfolio" },
  { id: "f3", term: "P/E ratio", definition: "Price divided by earnings per share — how many years of profit you're paying for.", concept: "Valuation", pathSlug: "company-analysis" },
  { id: "f4", term: "Compounding", definition: "Earning returns on your returns, so growth speeds up over time.", concept: "Compounding", pathSlug: "investing-foundations" },
  { id: "f5", term: "ETF", definition: "A fund you can buy like a stock that holds many investments at once.", concept: "ETFs", pathSlug: "build-a-portfolio" },
  { id: "f6", term: "Market order", definition: "An order to buy or sell right now at the best available price.", concept: "Orders", pathSlug: "stock-market-101" },
  { id: "f7", term: "Inflation", definition: "Prices rising over time, so each dollar buys a little less.", concept: "Inflation", pathSlug: "money-basics" },
  { id: "f8", term: "Index", definition: "A basket of stocks used to measure a slice of the market, like the S&P 500.", concept: "Indexes", pathSlug: "stock-market-101" },
];

export const games: Game[] = [
  { id: "term-match", title: "Term Match", kind: "recognition", skill: "Vocabulary", level: "Explorer+", minutes: 3, best: 8, blurb: "Match the term to its plain-language meaning before the clock runs out.", emoji: "🧩" },
  { id: "higher-lower", title: "Higher or Lower", kind: "chart", skill: "Chart reading", level: "Investor", minutes: 4, best: 6, blurb: "See a chart, call the next move, learn why.", emoji: "📈" },
  { id: "budget-builder", title: "Budget Builder", kind: "decision", skill: "Money basics", level: "Explorer+", minutes: 5, blurb: "Split a paycheck across needs, wants and investing.", emoji: "🧮" },
  { id: "risk-or-reward", title: "Risk or Reward?", kind: "decision", skill: "Risk & return", level: "Builder+", minutes: 4, best: 9, blurb: "Rank investments from safest to riskiest.", emoji: "⚖️" },
  { id: "family-brand-hunt", title: "Brand Hunt", kind: "family", skill: "Ownership", level: "All", minutes: 10, blurb: "Which companies made the things in your kitchen? Play together.", emoji: "🏠" },
  { id: "diversify-it", title: "Diversify It", kind: "decision", skill: "Diversification", level: "Investor", minutes: 5, blurb: "Build a portfolio that survives a bad year.", emoji: "🧺" },
];

export const termPairs = [
  { term: "Dividend", meaning: "A share of profit paid to owners" },
  { term: "ETF", meaning: "One fund, many investments" },
  { term: "Inflation", meaning: "Prices rising over time" },
  { term: "Compounding", meaning: "Returns earning returns" },
  { term: "Index", meaning: "A basket that measures the market" },
  { term: "Market order", meaning: "Buy or sell right now" },
];

export const chartDrills: ChartDrill[] = [
  { id: "d1", symbol: "AAPL", series: wave(30, 210, 226, 3, 31), reveal: wave(10, 226, 231, 2, 32), prompt: "The price has climbed steadily for six weeks on rising volume. What's the most reasonable expectation for the next two weeks?", options: ["Trend likely continues, but with pullbacks", "It must fall — it went up too much", "It will double", "Nothing can be inferred"], answerIdx: 0, explanation: "Trends tend to persist until something changes, but nothing goes straight up. Expecting continuation *with* pullbacks is the sober read.", concept: "Trends" },
  { id: "d2", symbol: "KO", series: wave(30, 72, 66, 1.2, 41), reveal: wave(10, 66, 67, 0.8, 42), prompt: "Price has drifted down to a level it bounced from twice before. What is this level called?", options: ["Support", "Resistance", "A dividend", "A split"], answerIdx: 0, explanation: "A price area where buyers have stepped in before is called support. It can hold or break — it's a place to watch, not a promise.", concept: "Support & resistance" },
  { id: "d3", symbol: "NVDA", series: wave(30, 150, 182, 8, 51), reveal: wave(10, 182, 168, 5, 52), prompt: "A stock jumps 30% in three weeks after big news. A beginner buys at the top. What concept explains the risk?", options: ["Chasing / buying after a spike", "Dividends", "Index rebalancing", "Inflation"], answerIdx: 0, explanation: "Buying after a sharp spike is 'chasing'. It can work, but the odds of a pullback are higher — patience and position sizing matter here.", concept: "Behavioural finance" },
];

export const scenarios: Scenario[] = [
  {
    id: "first-drawdown", title: "Your first 15% drop", blurb: "The market falls hard. What do you do with the practice portfolio you built?", minutes: 6,
    steps: [
      { id: "s1", text: "It's Monday. Your $10,000 practice portfolio is now worth $8,500 after a rough two weeks. Headlines say 'Worst month in years'. What's your first move?", choices: [
        { label: "Sell everything before it gets worse", next: "sell" },
        { label: "Check whether anything about my companies actually changed", next: "check" },
        { label: "Buy more of the same companies", next: "buy" },
      ] },
      { id: "sell", text: "You sell. Two weeks later the market has recovered 10% and you're sitting in cash, unsure when to get back in.", choices: [{ label: "What did I miss?", next: "lesson", outcome: "Selling in a panic locks in losses. Volatility is the price of admission for long-term returns.", good: false }] },
      { id: "check", text: "You read the news for each holding. Apple and VOO reported nothing new — the whole market fell. Coca-Cola actually raised its dividend.", choices: [
        { label: "Hold, and keep to my plan", next: "lesson", outcome: "Nothing changed about the businesses — only the prices. Holding through noise is how compounding works.", good: true },
        { label: "Sell anyway, it feels bad", next: "sell" },
      ] },
      { id: "buy", text: "You add $500 more to VOO. It's a diversified fund, so you're not concentrating risk. Six months later it's up.", choices: [{ label: "Why did that work?", next: "lesson", outcome: "Adding to a diversified fund on a broad decline is reasonable — but only with money you won't need soon.", good: true }] },
      { id: "lesson", text: "Lesson: volatility isn't loss until you sell. The question to ask in a drop is 'did the business change?' — not 'how do I feel?'", choices: [] },
    ],
  },
  {
    id: "hot-tip", title: "The hot tip", blurb: "A friend swears a tiny stock will triple. Your family portfolio has $2,000 free.", minutes: 5,
    steps: [
      { id: "s1", text: "Your cousin texts: 'Put everything in ZAPP, it's going to triple next month.' What do you do?", choices: [
        { label: "Put all $2,000 in — don't miss it", next: "allin" },
        { label: "Look up what ZAPP actually does first", next: "research" },
      ] },
      { id: "allin", text: "ZAPP falls 60% in three weeks. Nobody could explain what the company sells.", choices: [{ label: "Ouch. What's the lesson?", next: "lesson", outcome: "A thesis you can't explain isn't a thesis. Concentrated bets on tips are how beginners lose the most.", good: false }] },
      { id: "research", text: "ZAPP has no revenue and lots of debt. You put $100 in as a 'learning position' and keep $1,900 diversified.", choices: [{ label: "Good call?", next: "lesson", outcome: "Sizing a speculative idea small keeps the lesson cheap. You still learn — without risking the family plan.", good: true }] },
      { id: "lesson", text: "Lesson: write the thesis before you buy. If you can't say how the company makes money, you're gambling, not investing.", choices: [] },
    ],
  },
];

export const news: NewsItem[] = [
  { id: "n1", headline: "NVIDIA jumps 4% after data-center demand beats forecasts", source: "Market wire", ago: "2h ago", symbols: ["NVDA"], whyItMatters: "When a company sells more than analysts expected, its future profits look bigger — and stock prices follow expected profits.", concepts: ["Earnings", "Expectations"], body: "NVIDIA reported quarterly revenue ahead of estimates, driven by orders for AI data-center chips. Management raised its outlook for the year. Shares rose in early trading as investors revised their profit expectations upward." },
  { id: "n2", headline: "Fed holds rates steady, signals patience", source: "Economy desk", ago: "5h ago", symbols: ["VOO"], whyItMatters: "Interest rates are the 'price of money'. When they stay put, borrowing costs don't change — a calm signal for most companies.", concepts: ["Interest rates", "Inflation"], body: "The Federal Reserve left its benchmark rate unchanged, citing cooling inflation and a steady jobs market. Broad index funds were little changed on the news." },
  { id: "n3", headline: "Coca-Cola raises dividend for the 63rd straight year", source: "Company news", ago: "1d ago", symbols: ["KO"], whyItMatters: "A rising dividend is a company telling you it expects steady profits. Long streaks are rare and prized by income investors.", concepts: ["Dividends"], body: "Coca-Cola's board approved a 5% increase to its quarterly dividend, extending one of the longest streaks of annual increases among large U.S. companies." },
  { id: "n4", headline: "Apple unveils new iPhone lineup; shares flat", source: "Tech desk", ago: "1d ago", symbols: ["AAPL"], whyItMatters: "Big product news that was already expected often doesn't move a stock — the market had 'priced it in'.", concepts: ["Expectations", "Revenue"], body: "Apple introduced its annual iPhone refresh with modest hardware changes. Analysts said the lineup matched expectations; the stock closed roughly unchanged." },
];

export const watchlist: WatchItem[] = [
  { symbol: "NVDA", name: "NVIDIA Corp.", reason: "Learning how AI demand shows up in earnings", list: "personal" },
  { symbol: "CEG", name: "Constellation Energy", reason: "From the nuclear idea in Club", list: "personal", ideaId: "nuclear-next-decade" },
  { symbol: "KO", name: "Coca-Cola Co.", reason: "Family research: brands we use every day", list: "family" },
  { symbol: "AAPL", name: "Apple Inc.", reason: "Arielle's pick — 'everyone has one'", list: "family" },
];

export const discover: DiscoverCategory[] = [
  { id: "everyday-brands", title: "Brands you use every day", blurb: "Start with companies you already understand.", emoji: "🛒", symbols: ["AAPL", "KO"], why: "Household names with simple business models." },
  { id: "the-whole-market", title: "Own the whole market", blurb: "Index funds that hold hundreds of companies at once.", emoji: "🧺", symbols: ["VOO"], why: "One purchase, instant diversification." },
  { id: "dividend-payers", title: "Steady dividend payers", blurb: "Companies that share profit with owners every quarter.", emoji: "💸", symbols: ["KO"], why: "Long dividend streaks signal steady profits." },
  { id: "ai-infrastructure", title: "Building the AI boom", blurb: "The picks-and-shovels of artificial intelligence.", emoji: "🤖", symbols: ["NVDA"], why: "Fast-growing, but volatile — a lesson in risk and reward." },
];

export const metrics: Record<string, Metric[]> = {
  AAPL: [
    { key: "mcap", label: "Market cap", value: "$3.4T", definition: "What the whole company is worth at today's price: share price × number of shares.", lessonHref: "/learn/path/stock-market-101" },
    { key: "pe", label: "P/E ratio", value: "31.2", definition: "Price divided by earnings per share — how many years of profit you're paying for.", lessonHref: "/learn/path/company-analysis" },
    { key: "div", label: "Dividend yield", value: "0.4%", definition: "Yearly dividend as a percent of the price — the 'cash rent' the stock pays you.", lessonHref: "/learn/path/investing-foundations" },
    { key: "range", label: "52-week range", value: "$164 – $237", definition: "The lowest and highest price in the last year — a feel for how much it swings.", lessonHref: "/learn/path/stock-market-101" },
    { key: "vol", label: "Volume", value: "48.2M", definition: "How many shares changed hands today. High volume = lots of interest.", lessonHref: "/learn/path/stock-market-101" },
  ],
};
const generic = (sym: string): Metric[] => [
  { key: "mcap", label: "Market cap", value: { VOO: "$1.2T fund", KO: "$302B", NVDA: "$4.4T" }[sym] ?? "—", definition: "What the whole company is worth at today's price: share price × number of shares.", lessonHref: "/learn/path/stock-market-101" },
  { key: "pe", label: "P/E ratio", value: { VOO: "24.1", KO: "26.4", NVDA: "48.9" }[sym] ?? "—", definition: "Price divided by earnings per share — how many years of profit you're paying for.", lessonHref: "/learn/path/company-analysis" },
  { key: "div", label: "Dividend yield", value: { VOO: "1.2%", KO: "3.0%", NVDA: "0.03%" }[sym] ?? "—", definition: "Yearly dividend as a percent of the price — the 'cash rent' the stock pays you.", lessonHref: "/learn/path/investing-foundations" },
  { key: "range", label: "52-week range", value: { VOO: "$470 – $620", KO: "$58 – $74", NVDA: "$86 – $190" }[sym] ?? "—", definition: "The lowest and highest price in the last year — a feel for how much it swings.", lessonHref: "/learn/path/stock-market-101" },
];
export const metricsFor = (sym: string) => metrics[sym] ?? generic(sym);

export const orders: Order[] = [
  { id: "o1", symbol: "AAPL", side: "buy", shares: 2, price: 221.4, at: "2026-08-04T14:31:00Z", thesis: "Brand I understand; long-term hold", status: "filled" },
  { id: "o2", symbol: "VOO", side: "buy", shares: 1, price: 598.1, at: "2026-08-06T15:02:00Z", thesis: "Own the whole market", status: "filled" },
  { id: "o3", symbol: "KO", side: "buy", shares: 3, price: 69.8, at: "2026-08-11T13:45:00Z", thesis: "Dividend streak", status: "filled" },
];

export const ideaComments: Record<string, Comment[]> = {
  "nuclear-next-decade": [
    { id: "c1", author: "Michael T.", role: "Member", ago: "1h ago", text: "How long before new reactors actually earn money? Feels like a 10-year story.", concept: "Time horizon", replies: [
      { id: "c1r1", author: "Sarah J.", role: "Idea owner", ago: "50m ago", text: "Agreed — that's why CEG (existing plants) is the safer leg and SMR is the speculative one." },
    ] },
    { id: "c2", author: "Coach Tia", role: "Educator", ago: "40m ago", text: "Good thesis structure. For beginners: notice how the risks section is as long as the opportunity. That's healthy.", concept: "Risk" },
    { id: "c3", author: "Kway M.", role: "Member", ago: "12m ago", text: "Added CEG to my watchlist to follow along. What's a reasonable position size for a practice portfolio?" },
  ],
};

export const modelPortfolios: ModelPortfolio[] = [
  {
    id: "fic-growth", name: "FIC Growth Portfolio", ytdPct: 14.8, benchmarkYtdPct: 11.2, followers: 347, series: wave(40, 100, 114.8, 2.2, 61),
    blurb: "An educational model portfolio: no real money, every holding has a written thesis, every change has a rationale.",
    holdings: [
      { symbol: "VOO", name: "Vanguard S&P 500 ETF", weightPct: 30, changePct: 0.9, thesis: "Core: own the whole market", addedAgo: "8 months ago" },
      { symbol: "AAPL", name: "Apple Inc.", weightPct: 15, changePct: 1.7, thesis: "Durable brand, huge cash flow", addedAgo: "8 months ago" },
      { symbol: "NVDA", name: "NVIDIA Corp.", weightPct: 12, changePct: 4.2, thesis: "AI infrastructure leader — sized for volatility", addedAgo: "5 months ago" },
      { symbol: "KO", name: "Coca-Cola Co.", weightPct: 10, changePct: -0.4, thesis: "Dividend growth, defensive", addedAgo: "8 months ago" },
      { symbol: "CEG", name: "Constellation Energy", weightPct: 8, changePct: 2.1, thesis: "Nuclear baseload for AI power demand", addedAgo: "2 weeks ago" },
    ],
    proposals: [
      { id: "p1", kind: "add", symbol: "CCJ", by: "Sarah J.", ago: "2d ago", rationale: "Uranium supply is the bottleneck for the nuclear thesis; Cameco is the largest Western producer.", votesFor: 41, votesAgainst: 9, status: "open" },
      { id: "p2", kind: "resize", symbol: "NVDA", by: "Michael T.", ago: "5d ago", rationale: "Trim from 12% to 8% after the run-up; concentration risk.", votesFor: 27, votesAgainst: 22, status: "open" },
      { id: "p3", kind: "add", symbol: "CEG", by: "Sarah J.", ago: "2w ago", rationale: "From the Nuclear Energy idea after Watching stage.", votesFor: 58, votesAgainst: 6, status: "passed" },
    ],
    history: [
      { ago: "2w ago", text: "Added CEG at 8% (proposal passed 58–6)" },
      { ago: "5 months ago", text: "Added NVDA at 12%" },
      { ago: "8 months ago", text: "Portfolio launched with VOO / AAPL / KO" },
    ],
  },
];

export const groups: Group[] = [
  { id: "mensah-family", name: "The Mensah Family", kind: "family", members: 4, blurb: "Our private household club.", emoji: "👨‍👩‍👧‍👦", pinned: ["This week: research one company we use every day", "Family Investing Night — Thursday 7pm"], joined: true },
  { id: "beginners-circle", name: "Beginners Circle", kind: "topic", members: 1240, blurb: "No question is too basic. Educators answer daily.", emoji: "🌱", pinned: ["Read first: how to ask a good question", "Glossary: 20 terms every beginner needs"], joined: true },
  { id: "dividend-club", name: "Dividend Club", kind: "topic", members: 612, blurb: "Companies that pay you to own them.", emoji: "💸", pinned: ["Dividend streak leaderboard (educational)"], joined: false },
  { id: "ms-rivera-period-3", name: "Ms. Rivera — Period 3", kind: "class", members: 28, blurb: "Lincoln High personal finance.", emoji: "🏫", pinned: ["Assignment due Fri: Money Basics checkpoint"], joined: false },
  { id: "ai-infrastructure", name: "AI Infrastructure", kind: "topic", members: 890, blurb: "Chips, power, data centers — and the risks.", emoji: "🤖", pinned: ["Idea: Nuclear Energy — The Next Decade"], joined: false },
];

export const challenges: Challenge[] = [
  { id: "family-brand-research", title: "Research one company our family uses every day", kind: "family", blurb: "Pick a brand from your kitchen, find out how it makes money, and share one surprising fact at dinner.", steps: ["Pick a brand together", "Find the company on Markets", "Answer: how does it make money?", "Share one surprising fact"], xp: 60, due: "Sunday", progress: 50, participants: 4 },
  { id: "diversify-under-constraints", title: "Build a diversified $10k portfolio", kind: "individual", blurb: "No holding over 25%, at least 3 sectors, one fund.", steps: ["Open Practice", "Place at least 4 orders", "Check the diversification insight", "Write your thesis"], xp: 80, due: "In 6 days", progress: 25, participants: 212 },
  { id: "explain-it-to-a-kid", title: "Explain compounding to a 10-year-old", kind: "individual", blurb: "Record or write a 3-sentence explanation. Educators give feedback.", steps: ["Review the Compounding lesson", "Write 3 sentences", "Post in Beginners Circle"], xp: 40, due: "In 10 days", progress: 0, participants: 96 },
  { id: "class-market-week", title: "Market Week: track one stock for 5 days", kind: "class", blurb: "Log the price and one headline each day.", steps: ["Choose a stock", "Log daily", "Present on Friday"], xp: 50, due: "Friday", progress: 0, participants: 28 },
];

export const members: Member[] = [
  { id: "sarah-j", name: "Sarah J.", role: "Member · Idea owner", level: "Trader", bio: "Energy analyst turned educator. I write theses so beginners can follow the reasoning.", badges: ["🧠", "📈", "🔬"], favorites: ["CEG", "CCJ"], ideas: 6, comments: 142, joined: "Jan 2026" },
  { id: "michael-t", name: "Michael T.", role: "Member", level: "Investor", bio: "Dad of two, learning alongside my kids.", badges: ["🌱", "🧺"], favorites: ["VOO", "KO"], ideas: 1, comments: 58, joined: "Mar 2026" },
  { id: "coach-tia", name: "Coach Tia", role: "Educator", level: "Trader", bio: "FIC coach. Live every weekday at market open.", badges: ["🎓", "📈", "⭐"], favorites: ["VOO"], ideas: 3, comments: 410, joined: "Nov 2025" },
  { id: "arielle-m", name: "Arielle M.", role: "Young learner", level: "Builder", bio: "12. I like companies that make snacks.", badges: ["🌱", "⭐"], favorites: ["KO"], ideas: 0, comments: 4, joined: "Jun 2026", ageBadge: "Under 13" },
];

export const learners: FamilyLearner[] = [
  { id: "kway", name: "Kway", role: "parent", level: "Investor", pathTitle: "Investing Foundations", pathProgress: 35, streak: 12, weekXp: 430, needs: [], tasks: [{ title: "Pick a brand for this week's challenge", done: true }], lastActive: "Today", color: "bg-green-3" },
  { id: "andwele", name: "Andwele", role: "teen", level: "Investor", pathTitle: "Stock Market 101", pathProgress: 60, streak: 9, weekXp: 385, needs: ["Orders & prices"], tasks: [{ title: "Find the company on Markets", done: true }, { title: "Answer: how does it make money?", done: false }], lastActive: "Today", color: "bg-green-3" },
  { id: "arielle", name: "Arielle", role: "child", level: "Builder", pathTitle: "Money Basics", pathProgress: 80, streak: 5, weekXp: 240, needs: ["Interest", "Inflation"], tasks: [{ title: "Share one surprising fact", done: false }], lastActive: "Yesterday", color: "bg-gold" },
  { id: "mom", name: "Mom", role: "parent", level: "Investor", pathTitle: "Money Basics", pathProgress: 25, streak: 2, weekXp: 120, needs: ["Saving vs. investing"], tasks: [], lastActive: "3 days ago", color: "bg-coral" },
];

export const notifications: Notification[] = [
  { id: "nt1", kind: "family", title: "Andwele finished Lesson 12 🎉", body: "Your family streak is now 12 days.", ago: "1h ago", href: "/family", read: false },
  { id: "nt2", kind: "live", title: "Market Open Talk is live", body: "Coach Tia · 128 watching", ago: "2h ago", href: "/live/market-open-talk", read: false },
  { id: "nt3", kind: "club", title: "Sarah J. replied to your comment", body: "\"…that's why CEG is the safer leg…\"", ago: "50m ago", href: "/club/idea/nuclear-next-decade/discuss", read: false },
  { id: "nt4", kind: "lesson", title: "Review time: 3 concepts are fading", body: "Dividends, P/E ratio, Compounding", ago: "Yesterday", href: "/learn/review", read: true },
  { id: "nt5", kind: "system", title: "Your family plan renews in 7 days", body: "No action needed.", ago: "2d ago", href: "/profile/billing", read: true },
];

export const faqs: Faq[] = [
  { q: "Is any of the money real?", a: "No. Practice portfolios, family portfolios and Club model portfolios use virtual money only. FIC is an education product, not a brokerage." },
  { q: "How do I add a family member?", a: "Profile → The Mensah Family → Invite, or share your family code. Children get an age-appropriate profile you can manage." },
  { q: "What's an explanation level?", a: "The same concept explained four ways: Explorer (young learners), Builder (older kids), Investor (adult beginners), Trader (advanced). Change yours in Profile." },
  { q: "Does Kai give financial advice?", a: "No. Kai is a tutor — it explains, quizzes and helps you research. It never tells you what to buy." },
  { q: "How do streaks work?", a: "Complete any lesson, review or practice activity to keep your daily streak. Family streaks count when 2+ members are active in a day." },
  { q: "Can I cancel anytime?", a: "Yes, from Profile → Billing. You keep access until the end of the period." },
];

export const referral = { code: "KWAY-FIC", link: "https://family-investing-club.vercel.app/welcome?ref=KWAY-FIC", invited: 5, joined: 2, xpEarned: 200, rewards: [{ at: 1, label: "50 XP", done: true }, { at: 3, label: "Family badge", done: false }, { at: 5, label: "1 month free", done: false }] };

export const subscription = { plan: "Family", price: "$14.99 / mo", renews: "Sep 3, 2026", seats: { used: 4, max: 6 }, features: ["All learning paths", "Family group & shared streak", "Practice portfolios for everyone", "Club ideas & model portfolios", "Live classes & recordings"], free: ["Money Basics path", "1 practice portfolio", "Read-only Club"] };
