/** Brand colours for ticker tiles — design config, not data. Anything unlisted falls back to FIC green. */
export const BRAND: Record<string, string> = {
  COST: "#E31837", DIS: "#113CCF", VOO: "#96151D", AAPL: "#555555", MSFT: "#0078D4", NVDA: "#76B900", TSLA: "#CC0000",
  CEG: "#0057B8", VST: "#00A9E0", CCJ: "#5C6670", SMR: "#1B7A43", AMZN: "#FF9900", KO: "#F40009", QQQ: "#0B3D91", GOOGL: "#4285F4",
};
export const brandOf = (s: string) => BRAND[s.toUpperCase()] ?? "#3A6B3E";
