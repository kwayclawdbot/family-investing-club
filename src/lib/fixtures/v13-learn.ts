/** Round 8 (prototype v2) — LEARN+ME lane fixtures. */
export const myPerf = {
  picks: 8, open: 5, resolved: 3, ytdPct: 18.2, benchPct: 6.2,
  tiles: [
    { v: "71%", l: "ACCURACY", s: "5 of 7 resolved +", c: "text-green" },
    { v: "+19.1%", l: "AVG VS S&P", s: "per resolved pick", c: "text-ink" },
    { v: "2.3y", l: "AVG HORIZON", s: "long-term style", c: "text-ink" },
    { v: "78%", l: "CONSISTENCY", s: "thesis follow-through", c: "text-ink" },
  ],
  best: { symbol: "NVDA", pct: 26.4, quote: "chips in everything AI" },
  worst: { symbol: "KO", pct: -2.1, quote: "safe dividend", note: "resolved ✕" },
  stance: { buy: 5, watch: 2, pass: 1 },
  history: [
    { id: "andwele-nvda", symbol: "NVDA", line: "BUY · Mar 14 · 3y · open", sub: "●●●○○ · ✓ verified owner", pct: 26 },
    { id: "mom-cost", symbol: "COST", line: "BUY · Aug 20 · 5y · open", sub: "club discussing · Family Night Thu", pct: 2 },
    { id: "ko", symbol: "KO", line: "BUY · Jun 2 · resolved ✕", sub: "thesis review written · lesson linked", pct: -2.1 },
    { id: "voo", symbol: "VOO", line: "BUY · Jan 9 · 5y · open", sub: "core · ✓ verified owner", pct: 9 },
  ],
  series: [4, 6, 5, 8, 9, 12, 11, 14, 13, 16, 15, 18.2],
};

export const liveNow = { id: "market-open-talk", title: "Market Open Recap — NVDA earnings week", watching: 128, host: "Coach D", hostBelt: "Black Belt", sub: "answers questions live" };
export const upcoming = [
  { id: "reading-a-chart", day: "THU", time: "7 PM", title: "Reading Earnings Reports", sub: "Coach D · 214 enrolled · beginner-friendly" },
  { id: "family-investing-night", day: "SAT", time: "10 AM", title: "Family Investing Workshop", sub: "bring the kids · practice portfolio build-along" },
];
export const recordings = [
  { id: "rec-diversification", title: "Diversification deep-dive", sub: "42 min · 1.8K views" },
  { id: "rec-pe-ratio", title: "How the club voted: CEG case study", sub: "18 min · your club's own decision" },
];

export const continueCourse = { title: "Company Analysis", pct: 60, slug: "company-analysis" };
export const liveThu = { title: "Reading Earnings w/ Coach D", sub: "7 PM · 214 enrolled", id: "reading-a-chart" };

export const scenarioList = [
  { id: "market-crash", emoji: "📉", title: "Market crash — hold or sell?", sub: "with Simbot · 10 min" },
  { id: "earnings-surprise", emoji: "💰", title: "Earnings surprise — react in real time", sub: "uses $NVDA's real Wed report" },
  { id: "hot-tip", emoji: "📱", title: "The hot tip", sub: "a friend swears it'll triple · 5 min" },
];

export const crash = {
  title: "Market crash — hold or sell?",
  steps: [
    { day: 1, breaking: "BREAKING · DAY 1", spx: "S&P −7%", copy: "Markets open sharply lower on virus headlines. Your practice portfolio is down $620.", simbot: "Big red day. Before anything else — did the business you own change today, or just the price?", choices: [{ label: "😱 Sell everything — stop the bleeding", tone: "bad" }, { label: "🧘 Hold — my thesis hasn't changed", sub: "time in the market beats timing the market", tone: "good" }, { label: "🛒 Buy more at a discount", tone: "ok" }] },
    { day: 3, breaking: "BREAKING · DAY 3", spx: "S&P −18%", copy: "Markets plunge for a third day. Your practice portfolio is down $1,840.", simbot: "Your phone is buzzing. Everyone's selling. Your VOO position is solid long-term — what do you do?", choices: [{ label: "😱 Sell everything — stop the bleeding", tone: "bad" }, { label: "🧘 Hold — my thesis hasn't changed", sub: "time in the market beats timing the market", tone: "good" }, { label: "🛒 Buy more at a discount", tone: "ok" }] },
    { day: 4, breaking: "BREAKING · DAY 4", spx: "S&P −12%", copy: "The worst single day since 1987. Circuit breakers halt trading twice.", simbot: "This is the moment most people quit. Nothing about VOO's 500 companies changed overnight. Your call?", choices: [{ label: "😱 Sell now, it's only getting worse", tone: "bad" }, { label: "🧘 Hold and stop checking", sub: "volatility isn't loss until you sell", tone: "good" }, { label: "🛒 Add a little more", tone: "ok" }] },
    { day: 12, breaking: "DAY 12", spx: "S&P −34% from peak", copy: "The bottom — though nobody knows it yet. Headlines say 'a lost decade ahead'.", simbot: "If you held, you're down ~34%. If you sold on day 3, you're down 18% in cash. What now?", choices: [{ label: "Stay in cash until it's 'safe'", tone: "bad" }, { label: "🧘 Keep holding", sub: "the plan is the plan", tone: "good" }, { label: "🛒 Buy — this is the discount", tone: "ok" }] },
    { day: 60, breaking: "DAY 60", spx: "S&P +30% off the low", copy: "A furious rally. Sellers who waited for 'safe' missed the biggest up-days in history.", simbot: "The best 10 days of 2020 all came inside the crash. Missing them halved the year's return.", choices: [{ label: "Continue → what happened next", tone: "good" }] },
    { day: 365, breaking: "ONE YEAR LATER", spx: "S&P +75% from the low", copy: "A year on, the index is at new highs. Holders recovered everything and more; sellers are still waiting.", simbot: "Lesson: the question in a crash is 'did the business change?' — not 'how do I feel?'", choices: [{ label: "Finish · +25 XP", tone: "good" }] },
  ],
};

export const coreCourses = [
  { slug: "money-basics", emoji: "🌱", title: "Money Basics", sub: "12 lessons · 2 checkpoints", pct: 100 },
  { slug: "investing-foundations", emoji: "📈", title: "Investing Foundations", sub: "20 lessons · 3 checkpoints", pct: 35 },
  { slug: "stock-market-101", emoji: "🏛", title: "Stock Market 101", sub: "24 lessons · 3 checkpoints", locked: "finish Foundations first" },
  { slug: "build-a-portfolio", emoji: "🧺", title: "Build a Portfolio", sub: "16 lessons · ETFs & goals", locked: "finish Foundations first" },
];
export const electives = [
  { slug: "company-analysis", emoji: "🔍", title: "Company Analysis", sub: "18 lessons · read a business like a pro" },
  { slug: "crypto-foundations", emoji: "🪙", title: "Crypto Foundations", sub: "10 lessons · elective" },
  { slug: "real-estate", emoji: "🏠", title: "Real Estate", sub: "8 lessons · elective" },
];
