/** One-line, plain-language definitions for concept chips used across Markets. */
export const CONCEPTS: Record<string, { definition: string; lessonHref: string }> = {
  Earnings: { definition: "The profit a company made in a period. Stock prices follow where earnings are expected to go.", lessonHref: "/learn/path/company-analysis" },
  Expectations: { definition: "What investors already assume will happen. News only moves a stock when it's different from what was expected.", lessonHref: "/learn/path/stock-market-101" },
  "Interest rates": { definition: "The price of borrowing money. Higher rates make borrowing costlier and cash more attractive than stocks.", lessonHref: "/learn/path/money-basics" },
  Inflation: { definition: "Prices rising over time, so each dollar buys a little less.", lessonHref: "/learn/path/money-basics" },
  Dividends: { definition: "A slice of a company's profit paid to shareholders — like a thank-you check for owning the stock.", lessonHref: "/learn/path/investing-foundations" },
  Revenue: { definition: "All the money a company brings in from sales, before any costs.", lessonHref: "/learn/path/company-analysis" },
  Valuation: { definition: "Working out whether a stock's price is cheap or expensive compared with what the business earns.", lessonHref: "/learn/path/company-analysis" },
  Sectors: { definition: "Groups of companies in the same kind of business — tech, energy, healthcare and so on.", lessonHref: "/learn/path/stock-market-101" },
  Diversification: { definition: "Spreading money across many investments so one bad result can't sink you.", lessonHref: "/learn/path/build-a-portfolio" },
  Volatility: { definition: "How much and how fast a price swings. More swing = more risk (and more opportunity).", lessonHref: "/learn/path/investing-foundations" },
};
export const conceptOf = (name: string) => CONCEPTS[name] ?? { definition: `${name} — a concept we'll explain in an upcoming lesson.`, lessonHref: "/learn/library" };
