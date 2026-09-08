/**
 * Streak, XP and belt, as the strip that sits above the path.
 *
 * Three figures, separated by rules rather than sitting in three boxes. Tabular figures so the
 * numbers do not jitter when they change.
 */
import { View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Num, T } from "./type";
import { BeltKnot, beltAtLevel } from "./belt";
import { tokens } from "../theme/tokens";

const Flame = ({ lit }: { lit: boolean }) => (
  <Svg width={17} height={17} viewBox="0 0 24 24">
    <Path
      d="M12 2c1 4-3 5-3 9a3 3 0 006 0c0-1.5-.6-2.4-.6-2.4C17 10 19 12.5 19 15a7 7 0 01-14 0C5 9.5 10.5 7.5 12 2z"
      fill={lit ? tokens.orange : tokens.line3}
    />
  </Svg>
);

export function StatStrip({ streak, xp, beltLevel }: { streak: number; xp: number; beltLevel: number }) {
  return (
    <View className="flex-row items-center px-[18px] py-[10px]">
      <View className="flex-row items-center gap-[6px]">
        <Flame lit={streak > 0} />
        <Num size={15}>{streak}</Num>
        <T size={11} weight="extrabold" tone="ink-4">day{streak === 1 ? "" : "s"}</T>
      </View>
      <View className="w-px h-[18px] bg-line-2 mx-[14px]" />
      <View className="flex-row items-center gap-[6px]">
        <Num size={15}>{xp.toLocaleString()}</Num>
        <T size={11} weight="extrabold" tone="ink-4">XP</T>
      </View>
      <View className="flex-1" />
      <BeltKnot color={beltAtLevel(beltLevel).color} size={30} />
    </View>
  );
}
