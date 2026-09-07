/**
 * The belt.
 *
 * The belt IS the rank — there are no rank names on top of it. Seven levels across five colours,
 * and a member holds the belt they have passed the test for, not the one their XP would allow.
 * That distinction is the whole point of the object: it is a claim about what someone can do.
 *
 * Drawn as a knot rather than a coloured dot, because a white belt on cream paper is invisible as a
 * dot and the black belt has to feel like the end of something.
 */
import { View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { T } from "./type";
import { tokens } from "../theme/tokens";

export type BeltColor = "white" | "yellow" | "green" | "blue" | "black";

export const BELTS: { level: number; color: BeltColor; label: string; short: string; minXp: number }[] = [
  { level: 1, color: "white", label: "White Belt I", short: "White I", minXp: 0 },
  { level: 2, color: "white", label: "White Belt II", short: "White II", minXp: 150 },
  { level: 3, color: "yellow", label: "Yellow Belt I", short: "Yellow I", minXp: 400 },
  { level: 4, color: "yellow", label: "Yellow Belt II", short: "Yellow II", minXp: 800 },
  { level: 5, color: "green", label: "Green Belt", short: "Green", minXp: 1400 },
  { level: 6, color: "blue", label: "Blue Belt", short: "Blue", minXp: 2200 },
  { level: 7, color: "black", label: "Black Belt", short: "Black", minXp: 3200 },
];

/** The belt a member's XP qualifies them to SIT THE TEST for — never the belt they hold. */
export function eligibleBelt(xp: number) {
  let b = BELTS[0];
  for (const belt of BELTS) if (xp >= belt.minXp) b = belt;
  return b;
}
export const beltAtLevel = (level: number) => BELTS.find((b) => b.level === level) ?? BELTS[0];

const CLOTH: Record<BeltColor, { fill: string; edge: string }> = {
  white: { fill: "#FFFFFF", edge: tokens.line3 },
  yellow: { fill: tokens.gold, edge: "#C79A2E" },
  green: { fill: tokens.green2, edge: tokens.green },
  blue: { fill: "#4E7BA8", edge: "#3A5F84" },
  black: { fill: "#2E2A21", edge: "#14120E" },
};

export function BeltKnot({ color, size = 40 }: { color: BeltColor; size?: number }) {
  const c = CLOTH[color];
  const s = size / 40;
  return (
    <Svg width={size} height={size * 0.6} viewBox="0 0 40 24">
      {/* tails */}
      <Path d="M6 10 L1 21 L7 22 L12 12 Z" fill={c.fill} stroke={c.edge} strokeWidth={1.2 / s} strokeLinejoin="round" />
      <Path d="M34 10 L39 21 L33 22 L28 12 Z" fill={c.fill} stroke={c.edge} strokeWidth={1.2 / s} strokeLinejoin="round" />
      {/* band */}
      <Rect x={0} y={5} width={40} height={7.5} rx={1.5} fill={c.fill} stroke={c.edge} strokeWidth={1.2 / s} />
      {/* knot */}
      <Rect x={14} y={2.5} width={12} height={12.5} rx={2.5} fill={c.fill} stroke={c.edge} strokeWidth={1.4 / s} />
    </Svg>
  );
}

export function BeltBadge({ level, xp }: { level: number; xp: number }) {
  const held = beltAtLevel(level);
  const eligible = eligibleBelt(xp);
  const testWaiting = eligible.level > held.level;
  return (
    <View className="flex-row items-center gap-[10px]">
      <BeltKnot color={held.color} size={38} />
      <View>
        <T size={13.5} weight="black" tone="ink">{held.label}</T>
        {testWaiting
          ? <T size={11.5} weight="bold" tone="orange">{eligible.short} test unlocked</T>
          : <T size={11.5} weight="bold" tone="ink-4">{Math.max(0, nextThreshold(held.level) - xp)} XP to the next test</T>}
      </View>
    </View>
  );
}

const nextThreshold = (level: number) => BELTS.find((b) => b.level === level + 1)?.minXp ?? BELTS[BELTS.length - 1].minXp;
