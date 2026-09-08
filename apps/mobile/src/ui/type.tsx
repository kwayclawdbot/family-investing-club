/**
 * FIC's typographic voice, as components.
 *
 * The web app carries its type in Tailwind classes on every element. Repeating that here would put
 * the same decision in three hundred places, so the scale lives in one file: `<T>` for prose,
 * `<Display>` for the thing a screen is about, `<Eyebrow>` for the small caps label above it.
 * Nunito, black weights, tight tracking on display sizes — the same voice as the web build.
 */
import { Text, type TextProps } from "react-native";
import { cx } from "./cx";

type Weight = "regular" | "semibold" | "bold" | "extrabold" | "black";
const FACE: Record<Weight, string> = {
  regular: "font-nunito", semibold: "font-nunito-semibold", bold: "font-nunito-bold",
  extrabold: "font-nunito-extrabold", black: "font-nunito-black",
};

export type TProps = TextProps & {
  size?: number;
  weight?: Weight;
  tone?: "ink" | "ink-2" | "ink-3" | "ink-4" | "green" | "orange" | "red" | "cream";
  className?: string;
};

const TONE = {
  ink: "text-ink", "ink-2": "text-ink-2", "ink-3": "text-ink-3", "ink-4": "text-ink-4",
  green: "text-green", orange: "text-orange", red: "text-red", cream: "text-cream-text",
} as const;

export function T({ size = 14, weight = "semibold", tone = "ink-2", className, style, ...rest }: TProps) {
  return (
    <Text
      {...rest}
      className={cx(FACE[weight], TONE[tone], className)}
      style={[{ fontSize: size, lineHeight: Math.round(size * 1.5) }, style]}
    />
  );
}

/** What the screen is about. Tracking tightens as it grows — display type reads loose at 0. */
export function Display({ size = 24, className, style, ...rest }: TProps) {
  return (
    <Text
      {...rest}
      className={cx("font-nunito-black text-ink", className)}
      style={[{ fontSize: size, lineHeight: Math.round(size * 1.18), letterSpacing: -size * 0.022 }, style]}
    />
  );
}

/** The small caps label that names a section without taking a heading's weight. */
export function Eyebrow({ tone = "orange", className, ...rest }: TProps) {
  return (
    <Text
      {...rest}
      className={cx("font-nunito-black uppercase", TONE[tone], className)}
      style={{ fontSize: 10.5, letterSpacing: 0.55 }}
    />
  );
}

/** Figures that must not jitter as they count: XP, streaks, prices, percentages. */
export function Num({ size = 14, className, style, ...rest }: TProps) {
  return (
    <Text
      {...rest}
      className={cx("font-nunito-black text-ink", className)}
      style={[{ fontSize: size, fontVariant: ["tabular-nums"] }, style]}
    />
  );
}
