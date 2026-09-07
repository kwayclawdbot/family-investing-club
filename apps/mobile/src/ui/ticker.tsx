/**
 * A ticker never appears as bare grey text. It carries a mark — the letters set solid in the lane's
 * colour — so a symbol always reads as a company rather than as a code, and so the eye can find one
 * in a list without reading a word.
 */
import { View } from "react-native";
import { T } from "./type";
import { cx } from "./cx";

export function TickerMark({ symbol, tone = "ink", size = 40 }: { symbol: string; tone?: "ink" | "green" | "orange" | "purple"; size?: number }) {
  const bg = tone === "green" ? "bg-green" : tone === "orange" ? "bg-orange" : tone === "purple" ? "bg-purple" : "bg-ink";
  const letters = symbol.replace(/[^A-Za-z]/g, "").slice(0, 4).toUpperCase();
  return (
    <View className={cx("items-center justify-center rounded-[11px]", bg)} style={{ width: size, height: size }}>
      <T size={letters.length > 3 ? 11 : 13} weight="black" tone="cream">{letters}</T>
    </View>
  );
}

export function Direction({ direction }: { direction: "long" | "short" | "watch" }) {
  const label = direction === "long" ? "LONG" : direction === "short" ? "SHORT" : "WATCH";
  const tone = direction === "long" ? "green" : direction === "short" ? "red" : "ink-4";
  return <T size={9.5} weight="black" tone={tone} style={{ letterSpacing: 0.5 }}>{label}</T>;
}
