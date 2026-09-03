# The Belt Curriculum — White → Yellow → Green → Blue → Black

The learning spine of the app. Five belt courses take a member from "I don't know what a stock is"
to trade-ready, and the belt they wear is the belt they earned — there is no separate rank name.

Every lesson below traces to material the family already owns. Nothing here is invented curriculum:
the adult line follows the **Intro to Stocks** textbook (194 pp, 8 chapters) chapter by chapter, and
the kids line follows the **Foundations of Investing** workbook (Grades 6–10, chapters 1–8), the
**Learn 2 Earn** workshop deck, and the **Parent & Teacher Guide**, with the FTA orientation deck
supplying the kid voice. Page references are given so an author can open the book to the right spread.

---

## 0. One thing to settle first: the ladder says Purple, not Green

The shipped ladder in `src/lib/belts.ts` is **7 levels across 5 colours**, and the fifth colour is
purple, not green:

| Level | Shipped today | Min XP |
|---:|---|---:|
| 1 | White Belt I | 0 |
| 2 | White Belt II | 150 |
| 3 | Yellow Belt I | 400 |
| 4 | Yellow Belt II | 800 |
| 5 | **Blue Belt** | 1,400 |
| 6 | **Purple Belt** | 2,200 |
| 7 | Black Belt | 3,200 |

You asked for White → Yellow → **Green** → **Blue** → Black. That is not a bigger ladder, it is the
same seven levels with two colours changed and swapped: level 5 becomes **Green**, level 6 becomes
**Blue**. The XP thresholds do not move and nobody's belt is taken away.

**Recommendation: make the change.** Beyond matching what you asked for, purple is already spoken
for — it is Kai's colour everywhere in the app (`--purple` is the assistant and club accent, used on
the Kai spark, the guide line, and every Kai surface). A purple belt puts the assistant's identity on
a member's chest. Green is free, and it already reads as "growing" in this palette.

The edit is two lines in `src/lib/belts.ts` plus dropping `"purple"` from `BeltColor` in
`src/lib/types.ts`. **This document is written against the corrected ladder.**

| Level | Belt | Min XP | Course | Lessons |
|---:|---|---:|---|---:|
| 1 | White I | 0 | **White Belt** | 4 |
| 2 | White II | 150 | | 4 |
| 3 | Yellow I | 400 | **Yellow Belt** | 5 |
| 4 | Yellow II | 800 | | 10 |
| 5 | Green | 1,400 | **Green Belt** | 12 |
| 6 | Blue | 2,200 | **Blue Belt** | 16 |
| 7 | Black | 3,200 | **Black Belt** | 12 + exam |

**XP does not promote anyone.** Lifetime XP unlocks the *right to sit* the next belt test; passing
the test is what awards the belt (`fic_belt_awards`, added 2026-09-03). A member on 3,000 XP who has
not sat the Green test is still a Yellow Belt, and the app tells them a test is waiting rather than
quietly moving them up. Belts are sat in order — only ever one test offered at a time — and the pass
mark is the platform's usual 70%. Members holding a belt under the old XP-derived model were
grandfathered, so nobody lost a belt they were already wearing.

**59 lessons.** At the shipped XP rates (`LESSON 50`, `QUIZ_PASS 30`, `QUIZ_PERFECT_BONUS 20`) a
lesson pays 50–100 XP, so the ladder tops out around 4,000–5,000 XP earned against a 3,200 XP black
belt — a member can miss a few quizzes and still arrive. That headroom is deliberate: the belt should
be earned by finishing the work, not by being perfect at it.

---

## 1. How to read a lesson plan

Each lesson names **the one question it answers** — if a lesson answers two, it is two lessons. The
**section plan** lists the step types from the FTA University vocabulary
(`src/components/lesson/sections.tsx`) in the order they run, so an author knows the shape before
writing a word. **Source** is the page or chapter to open.

Section types available: `explainer` · `anatomy` · `compare` · `process` · `annotated_values` ·
`flip_cards` · `build_candle` · `ratio_explorer` · `multiple_choice` · `true_false` · `match_pairs` ·
`prediction` · `real_world` · `takeaways`.

**Two audiences, not three.** Adults and teens share one lesson (`audience: ["adult","teen"]`); kids
8–12 get their own (`audience: ["kid"]`) covering the *same concept*, redesigned rather than shrunk —
per the curriculum master, a kid never loses a concept, they get its core idea, a story and a game.
The kid column below names the canon device each lesson uses.

**Teaching rule that governs every lesson here:** the plain mechanics come first and the analogy
closes. The tug-of-war, the pizza slice and the green team are *closers*, never openers.

---

## 2. WHITE BELT — *"You know what you own."*

**The promise:** by the end you can say what a stock is, why anyone buys one, and what makes the
price move — in your own words, to someone else.

**Prerequisite:** none. This is the front door.

**Adult source:** textbook Ch1 (Why Invest p5; Key Terms p6–7), Ch2 (The Stock Market p11–12;
Indices p14), Ch3 (What Is a Stock p21–24; Reading a Stock Quote p69).
**Kids source:** Learn 2 Earn deck; workbook Ch1–3; PTG Quick Reference; lesson plans Unit 1.

### Module 1 — Money that works (White I · 4 lessons · 0→150 XP)

| # | Lesson | The one question | Section plan | Source |
|---|---|---|---|---|
| W1.1 | The four ways to make money | Where does money actually come from? | explainer → compare (work vs business vs investing vs trading) → flip_cards → multiple_choice → takeaways | Ch1 p5; L2E; orientation ACT 1 |
| W1.2 | Compounding — why starting early beats starting big | Why does time matter more than the amount? | explainer → process (how one year feeds the next) → annotated_values (a balance over 10 years) → multiple_choice → takeaways | Ch1 p5 |
| W1.3 | Inflation — the reason saving alone loses | If my money is safe in the bank, what is the problem? | explainer → compare (same money, two years) → true_false → takeaways | Ch1 p5–7 |
| W1.4 | What a stock actually is | What am I buying when I buy a share? | explainer → compare (own a slice vs lend money) → flip_cards (share, dividend, ETF, bond) → multiple_choice → takeaways | Ch3 p21–24 |

*Kids:* W1.1 four-ways with the job/lemonade-stand/slice/tug-of-war set · W1.2 the money tree ·
W1.3 the shrinking candy bar · W1.4 owning a slice of the pizza (Roblox & Nike).

### Module 2 — The market (White II · 4 lessons · 150→400 XP)

| # | Lesson | The one question | Section plan | Source |
|---|---|---|---|---|
| W2.1 | How the market works | Who is on the other side when I buy? | explainer → process (an order finds a match) → compare (buyer's view / seller's view) → multiple_choice → takeaways | Ch2 p11–12 |
| W2.2 | What moves a price | Why did it go up today? | explainer → ratio_explorer (demand vs supply pressure) → prediction → takeaways | Ch2 p11–12, p15 |
| W2.3 | Tickers, exchanges and indices | What is the S&P 500 and why does everyone quote it? | explainer → flip_cards (ticker, exchange, index, ETF) → match_pairs (company → ticker) → multiple_choice → takeaways | Ch2 p14 |
| W2.4 | Reading a stock quote | What are all these numbers on the screen? | explainer → annotated_values (a real live quote, tap each field) → real_world (add one company to your watchlist) → takeaways | Ch3 p69 |

*Kids:* W2.1 the tug-of-war on a rope · W2.2 more pullers on one side · W2.3 the market is a store,
the ticker is the price tag · W2.4 reading the price tag together.

**Promotion — White Belt.** Ten mixed questions drawn from the eight lessons plus one real-world
action already completed (a company on the watchlist). No new teaching in a test.

---

## 3. YELLOW BELT — *"You can read a chart."*

**The promise:** you can open any chart, on any timeframe, and say what happened and who is winning —
without an indicator on the screen.

**Prerequisite:** White Belt.

**Adult source:** textbook Ch5 first half — Technical Analysis p93; Candlesticks p94–97; Support &
Resistance p98–99; Timeframes p100; Trendlines p101–103; Volume p117. Trend structure Ch2 p15–19.
**Kids source:** workbook Ch4–5 + the candle activity; orientation deck Lesson Zero LZ-3…LZ-8.

### Module 1 — The candle (Yellow I · 5 lessons · 400→800 XP)

| # | Lesson | The one question | Section plan | Source |
|---|---|---|---|---|
| Y1.1 | Technical analysis — the big idea | Why would anyone read a picture of a price? | explainer → compare (what the chart knows / what it cannot know) → multiple_choice → takeaways | Ch5 p93 |
| Y1.2 | **Candlestick anatomy (OHLC)** ✅ **BUILT** | What are the four numbers behind every candle? | explainer → anatomy → compare → process → annotated_values → flip_cards → build_candle → explainer → ratio_explorer → multiple_choice ×2 → takeaways | Ch5 p94–97 |
| Y1.3 | Reading a candle — who won? | Looking at one candle, who was in control? | explainer → anatomy (three candles, same close) → prediction → multiple_choice → takeaways | Ch5 p94; workbook candle activity |
| Y1.4 | The candles worth knowing | Which shapes actually say something? | explainer → compare (doji / hammer / engulfing) → flip_cards → match_pairs → takeaways | Ch5 p94–97 |
| Y1.5 | Chart types and timeframes | Why does the same stock look different on two screens? | explainer → compare (line vs candle) → process (choosing a timeframe) → multiple_choice → takeaways | Ch5 p100 |

*Kids:* one candle = one battle · green team won / red team won · the wick is how far the fight
swung · a chart is battles in a row.

### Module 2 — Structure (Yellow II · 5 lessons · 800→1,100 XP)

| # | Lesson | The one question | Section plan | Source |
|---|---|---|---|---|
| Y2.1 | Trend structure — higher highs, higher lows | What makes it an uptrend rather than a good week? | explainer → process (mark the swings) → prediction → multiple_choice → takeaways | Ch2 p15–19 |
| Y2.2 | Downtrends and ranges | What is it doing when it is not trending? | explainer → compare (uptrend / downtrend / range) → prediction → takeaways | Ch2 p15–19 |
| Y2.3 | Support and resistance | Why does price keep stopping at the same place? | explainer → anatomy (a level touched four times) → process (drawing one) → multiple_choice → takeaways | Ch5 p98–99 |
| Y2.4 | When levels break — role reversal | What happens after the floor gives way? | explainer → compare (before the break / after) → prediction → takeaways | Ch5 p98–99 |
| Y2.5 | Trendlines and channels | How do I draw a line that is actually useful? | explainer → process (two touches, then a third) → compare (a good line / a forced one) → multiple_choice → takeaways | Ch5 p101–103 |

### Module 3 — Confirmation (Yellow II · 5 lessons · 1,100→1,400 XP)

| # | Lesson | The one question | Section plan | Source |
|---|---|---|---|---|
| Y3.1 | Volume — the size of the crowd | What does volume add that price does not say? | explainer → annotated_values (price and volume on one day) → multiple_choice → takeaways | Ch5 p117 |
| Y3.2 | Volume confirmation — real break or fake | How do I tell a breakout from a bait? | explainer → compare (break on volume / break on nothing) → prediction → takeaways | Ch5 p117; p98–99 |
| Y3.3 | Multi-timeframe — one chart, three answers | Which timeframe is telling the truth? | explainer → compare (daily / hourly / 5-minute of the same move) → process (top-down reading) → multiple_choice → takeaways | Ch5 p100 |
| Y3.4 | Reading any chart in four steps | What is my routine, every single time? | process (the four steps) → annotated_values (run it on a real chart) → takeaways | Ch5 p93–118 synthesis |
| Y3.5 | Yellow belt drill — ten charts | Can I do it without help? | prediction ×10 (call the trend, name the level) → takeaways | authored drill |

**Promotion — Yellow Belt.** Fifteen questions plus the ten-chart drill at 70%.

---

## 4. GREEN BELT — *"You can judge a company and a setup."*

**The promise:** you can look at a business and a chart and say, in one paragraph each, whether this
is a good company and whether this is a good moment.

**Prerequisite:** Yellow Belt.

**Adult source:** textbook Ch4 (Fundamentals p73–78; P/E and valuation p89), Ch5 second half (Chart
Patterns p105–107, p138; Indicators — MA/EMA/Golden Cross p117–118; MACD/RSI/Stochastic/Bollinger/ADX
p115–116).
**Kids source:** workbook Ch5–6; PTG Quick Reference (RSI as a hot/cold meter, P/E).

### Module 1 — What a company is worth (5 lessons · 1,400→1,700 XP)

| # | Lesson | The one question | Section plan | Source |
|---|---|---|---|---|
| G1.1 | Fundamental and technical — two questions, not two camps | Which one is right? | explainer → compare (what each answers) → multiple_choice → takeaways | Ch4 p73 |
| G1.2 | Revenue, expenses, profit | How does a company actually make money? | explainer → annotated_values (a real income statement, tap each line) → flip_cards → takeaways | Ch4 p73–78 |
| G1.3 | Reading an earnings report | What am I looking for on earnings day? | explainer → process (four things, in order) → annotated_values → multiple_choice → takeaways | Ch4 p73–78 |
| G1.4 | P/E — what "expensive" means | Is this stock cheap or dear? | explainer → compare (two companies, same price, different P/E) → ratio_explorer (price against earnings) → multiple_choice → takeaways | Ch4 p89 |
| G1.5 | Catalysts — why stocks move on news | Why did good news send it down? | explainer → compare (expected / surprise) → prediction → takeaways | Ch4 p89 |

*Kids:* strong company = one people keep coming back to · revenue in, expenses out, profit left over ·
picking companies your family already uses.

### Module 2 — Patterns (4 lessons · 1,700→1,950 XP)

| # | Lesson | The one question | Section plan | Source |
|---|---|---|---|---|
| G2.1 | What a chart pattern actually is | Why would a shape repeat? | explainer → compare (a pattern / a coincidence) → multiple_choice → takeaways | Ch5 p105 |
| G2.2 | Continuation — flags, wedges, cup and handle | What does a pause inside a trend look like? | explainer → anatomy (a flag, part by part) → prediction → flip_cards → takeaways | Ch5 p105–107 |
| G2.3 | Reversal — head and shoulders, double top and bottom | What does a trend look like when it is ending? | explainer → anatomy → compare (top / bottom) → prediction → takeaways | Ch5 p105–107 |
| G2.4 | The breakout lifecycle | What happens between the level and the move? | process (build-up → break → retest → run or fail) → prediction → takeaways | Ch5 p138 |

### Module 3 — Indicators (3 lessons · 1,950→2,200 XP)

| # | Lesson | The one question | Section plan | Source |
|---|---|---|---|---|
| G3.1 | Moving averages and the golden cross | What is an average doing on a price chart? | explainer → annotated_values (price, 50, 200) → compare (cross up / cross down) → multiple_choice → takeaways | Ch5 p117–118 |
| G3.2 | RSI — the hot/cold meter | What does "overbought" actually mean? | explainer → ratio_explorer (0 to 100, commentary by band) → compare (overbought in a range / in a trend) → multiple_choice → takeaways | Ch5 p115–116 |
| G3.3 | MACD and Bollinger Bands — what they add, and what they don't | Do I need more indicators? | explainer → compare (what each is derived from) → true_false → takeaways | Ch5 p115–116 |

**Promotion — Green Belt.** A written call: one company, one chart, a paragraph on each, graded
against a rubric. First belt that asks for judgement rather than recall.

---

## 5. BLUE BELT — *"You can size it, protect it and place it."*

**The promise:** you can take a setup you like and turn it into an order with a size, a stop and a
target — and you know what it costs you when it goes wrong.

**Prerequisite:** Green Belt.

**Adult source:** textbook Ch7 (Risk Management p163–165; Diversification & Position Sizing
p167–170), Ch6 (Options p141–146; Key Terms p142; Calls/Puts p143–144; Strategies p161), Ch8
(Brokerage p173–175; Order Types p181–182; Stock Dashboard p183–184; SEC Filings p185–188; Taxes
p189; Accounts p191).
**Kids source:** workbook Ch6–8; PTG Ch8 "Getting Started" (Roth IRA, fractional shares, index ETF
first, reputable brokerages).

### Module 1 — Risk first (6 lessons · 2,200→2,550 XP)

| # | Lesson | The one question | Section plan | Source |
|---|---|---|---|---|
| B1.1 | Why risk management is the first skill | Why does this come before picking winners? | explainer → compare (two traders, same wins, different sizing) → multiple_choice → takeaways | Ch7 p163–165 |
| B1.2 | Position sizing and the 1–2% rule | How much do I actually buy? | explainer → process (account → risk → stop distance → size) → build_candle-style calculator → multiple_choice → takeaways | Ch7 p167–170 |
| B1.3 | Stop losses — where, and why not tighter | Where does the stop go? | explainer → anatomy (structure stop vs arbitrary stop) → compare → prediction → takeaways | Ch7 p163–165 |
| B1.4 | Risk-to-reward | Is this trade worth taking at all? | explainer → ratio_explorer (1:1 → 1:5, win rate needed) → multiple_choice → takeaways | Ch7 p167–170 |
| B1.5 | Diversification and its limits | How many is enough, and when does it stop helping? | explainer → compare (concentrated / diversified / diworsified) → true_false → takeaways | Ch7 p167–170 |
| B1.6 | Psychology and the journal | Why do I keep doing the thing I said I wouldn't? | explainer → compare (the gambler hopes / the trader plans) → process (a journal entry) → real_world (log one) → takeaways | Ch7 p163–171; House Rules |

*Kids:* the five House Rules · small losses are wins · practice before we play.

### Module 2 — Options foundations (5 lessons · 2,550→2,850 XP)

| # | Lesson | The one question | Section plan | Source |
|---|---|---|---|---|
| B2.1 | What an option actually is | What am I buying if not the stock? | explainer → compare (owning shares / owning the right) → flip_cards → multiple_choice → takeaways | Ch6 p141–142 |
| B2.2 | Calls — the right to buy | When would I want one? | explainer → annotated_values (a real chain row) → prediction → takeaways | Ch6 p143 |
| B2.3 | Puts — the right to sell | How do I profit when it falls, or protect what I hold? | explainer → compare (speculation / insurance) → prediction → takeaways | Ch6 p144 |
| B2.4 | Strike, premium, expiry — and time decay | Why is it worth less than yesterday when nothing moved? | explainer → ratio_explorer (time to expiry against premium) → annotated_values → multiple_choice → takeaways | Ch6 p142, p145–146 |
| B2.5 | Why beginners wait | Should I be doing this yet? | explainer → compare (what has to be true first) → true_false → takeaways | Ch6 p161 |

*Kids:* the "peek" module only — what an option is, in one story. No Greeks, no chains.

### Module 3 — Getting real (5 lessons · 2,850→3,200 XP)

| # | Lesson | The one question | Section plan | Source |
|---|---|---|---|---|
| B3.1 | Choosing a brokerage | Where does the money actually live? | explainer → compare (three brokers on the things that matter) → multiple_choice → takeaways | Ch8 p173–175 |
| B3.2 | Account types — taxable, Roth, custodial | Which account should this go in? | explainer → compare → match_pairs (goal → account) → takeaways | Ch8 p191; PTG Ch8 |
| B3.3 | Order types — market, limit, stop, trailing | Which button do I press? | explainer → compare (market vs limit on a fast move) → process → multiple_choice → takeaways | Ch8 p181–182 |
| B3.4 | Your dashboard, and what a filing tells you | What am I looking at after I own it? | explainer → annotated_values (a position row) → flip_cards (10-K, 10-Q, 8-K) → takeaways | Ch8 p183–188 |
| B3.5 | Tax, in structure not numbers | What does the tax man take? | explainer → compare (short-term / long-term) → true_false → takeaways | Ch8 p189 |

> **Authoring note.** Ch8 has no Knowledge Knockout quiz, and the book's tax and broker specifics are
> stated "as of 2021". Teach the *structure* (0/15/20% long-term against ordinary short-term); never
> state a threshold, contribution limit or broker feature as current fact. Mark any such line
> `[VERIFY-BEFORE-PUBLISH]`.

**Promotion — Blue Belt.** A complete paper trade: thesis, size, stop, target, and the journal entry
after it resolves. Graded on the process, not the outcome.

---

## 6. BLACK BELT — *Trade Ready*

**The promise:** you can execute a defined model on a live chart, and you have proved it on a fresh
one under observation.

**Prerequisite:** Blue Belt. This is the FTA program (`program = 'fta'`, `min_tier = academy`) — the
existing `fta-trade-ready` course, which today has all twelve lesson rows and no content behind any
of them. This belt IS that course, filled in.

**Source:** the FTA 6-week ICT program and the beta-cohort decks already taught (W1 candles/trends,
W2 support/resistance/trendlines, W3 patterns + breakout lifecycle, W4 the ORB framework on real
Tesla data). Convert the decks; do not start from scratch.

| Week | # | Lesson | The one question | Section plan |
|---|---|---|---|---|
| 1 | K1.1 | Market structure — who really moves the price | Where is the money that moves this? | explainer → anatomy (structure on a real chart) → process → prediction → takeaways |
| 1 | K1.2 | Drill: map the structure on three charts | Can I mark it unaided? | prediction ×3 → takeaways |
| 2 | K2.1 | Supply and demand zones | What is a zone that a line is not? | explainer → compare (level / zone) → anatomy → prediction → takeaways |
| 2 | K2.2 | Drill: draw three zones on real charts | Do my zones hold? | prediction ×3 → takeaways |
| 3 | K3.1 | Liquidity sweeps — the bait and the grab | Why did it stop me out and then go? | explainer → anatomy (equal lows, then the sweep) → process → prediction → takeaways |
| 3 | K3.2 | Drill: find equal lows, predict the sweep | Can I see it before it happens? | prediction ×3 → takeaways |
| 4 | K4.1 | Fair value gaps | What is the gap price keeps coming back to? | explainer → anatomy → compare (filled / unfilled) → prediction → takeaways |
| 4 | K4.2 | Drill: mark three gaps and watch the fill | Does it behave as taught? | prediction ×3 → takeaways |
| 5 | K5.1 | The opening range breakout | What is the plan at the bell? | explainer → process (the ORB framework) → annotated_values (real session) → prediction → takeaways |
| 5 | K5.2 | Drill: replay three ORB days | Can I run it under time pressure? | prediction ×3 → takeaways |
| 6 | K6.1 | The full execution model | How do the five pieces become one routine? | process (entry → invalidation → target → management) → compare → takeaways |
| 6 | K6.2 | **Trade Ready exam** — fresh chart, paper trade | Can I do it on a chart I have never seen? | real_world (submit a full plan) → graded by rubric |

*Kids:* concept-awareness only, per the curriculum master. Kids do not take this belt.

---

## 7. Build order

1. **Fix the ladder** (`belts.ts`, `types.ts`) — two lines, do it before anything references Green.
2. **Yellow 1.2 is already built and approved.** It is the reference implementation; every lesson
   below is written against its section vocabulary.
3. **Black Belt first among the unbuilt.** Twelve lessons, decks already taught, and it is the only
   course a paying academy member can open today and find empty. It is also the $2,997 product.
4. **White Belt next** — it is the front door and the shortest course (8 lessons).
5. **Yellow, then Green, then Blue.** Yellow is 14 lessons past the one already built.
6. **Kids variants after each adult belt lands**, not in parallel — a kid version of an unproven
   lesson is two lessons to rewrite instead of one.

## 8. Database shape

Five new `courses` rows, additive, no changes to existing content:

| slug | title | program | min_tier | modules | lessons |
|---|---|---|---|---:|---:|
| `belt-white` | White Belt — What You Own | fic | challenge | 2 | 8 |
| `belt-yellow` | Yellow Belt — Reading the Chart | fic | challenge | 3 | 15 |
| `belt-green` | Green Belt — Company and Setup | fic | challenge | 3 | 12 |
| `belt-blue` | Blue Belt — Size, Protect, Place | fic | challenge | 3 | 16 |
| `belt-black` | Black Belt — Trade Ready | fta | academy | 6 | 12 |

Kids courses mirror White/Yellow with `audience: ["kid"]` in the lesson JSON; the existing
`fic-kids-corner` (12 lessons, complete) already covers the White + Yellow concept set in kid voice
and should be **re-sequenced into `belt-white` and `belt-yellow` kid tracks rather than rewritten**.

Existing `fta-trade-ready` becomes `belt-black` — same twelve lesson rows, same ids, content added.
The three existing Foundations courses stay exactly as they are; they are the 6-week cohort product,
and the belts are the self-paced spine. A lesson may be referenced by both.
