/** The handful of icons the ported games use, as inline SVG — FIC doesn't carry an icon library. */
type P = { size?: number; className?: string; strokeWidth?: number };
const svg = (d: string) => function Icon({ size = 18, className, strokeWidth = 2.4 }: P) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden><path d={d} /></svg>;
};
export const Check = svg("M20 6 9 17l-5-5");
export const X = svg("M18 6 6 18M6 6l12 12");
export const ArrowRight = svg("M5 12h14M13 6l6 6-6 6");
export const RefreshCw = svg("M21 12a9 9 0 1 1-2.6-6.4M21 3v6h-6");
export const TrendingUp = svg("M3 17 10 10l4 4 7-7M17 7h4v4");
export const TrendingDown = svg("M3 7l7 7 4-4 7 7M17 17h4v-4");
export const Volume2 = svg("M11 5 6 9H3v6h3l5 4V5ZM16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12");
export const VolumeX = svg("M11 5 6 9H3v6h3l5 4V5ZM17 9l4 6M21 9l-4 6");
