/**
 * The path node — the single most recognisable object in the app.
 *
 * Duolingo's idea, in FIC's material: a raised disc you press, sitting on a winding trail, with the
 * one you are up to called out. A disc is an object with its own identity, not a container that
 * groups other things, so it does not fall under the no-cards rule — the rule exists to stop four
 * ideas being put in four boxes, which is a different move entirely.
 *
 * The press is physical: 3px of bottom edge that the node sinks into when you touch it. That edge is
 * what makes it read as a button carved out of paper rather than a coloured circle.
 */
import { Pressable, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useState } from "react";
import { T } from "./type";
import { cx } from "./cx";
import { tokens } from "../theme/tokens";
import type { NodeKind, NodeStatus } from "../data/learn";

const FACE: Record<NodeStatus, { bg: string; edge: string; mark: string }> = {
  completed: { bg: tokens.green2, edge: tokens.green, mark: tokens.creamText },
  in_progress: { bg: tokens.orange, edge: tokens.orange3, mark: tokens.creamText },
  available: { bg: tokens.orange, edge: tokens.orange3, mark: tokens.creamText },
  locked: { bg: tokens.line2, edge: tokens.line3, mark: tokens.ink4 },
};

const Tick = ({ c }: { c: string }) => (
  <Svg width={26} height={26} viewBox="0 0 24 24"><Path d="M20 6L9 17l-5-5" stroke={c} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" fill="none" /></Svg>
);
const Book = ({ c }: { c: string }) => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M12 5.5C10 4 7 4 4.5 4.5v15C7 19 10 19 12 20.5c2-1.5 5-1.5 7.5-1v-15C17 4 14 4 12 5.5z" stroke={c} strokeWidth={2.2} strokeLinejoin="round" />
    <Path d="M12 5.5v15" stroke={c} strokeWidth={2.2} />
  </Svg>
);
const Star = ({ c }: { c: string }) => (
  <Svg width={25} height={25} viewBox="0 0 24 24"><Path d="M12 3l2.6 5.6 6 .8-4.4 4.2 1.1 6L12 16.8 6.7 19.6l1.1-6L3.4 9.4l6-.8z" fill={c} /></Svg>
);
const Lock = ({ c }: { c: string }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M6 10h12v9H6z" stroke={c} strokeWidth={2.4} strokeLinejoin="round" />
    <Path d="M9 10V7a3 3 0 016 0v3" stroke={c} strokeWidth={2.4} strokeLinecap="round" />
  </Svg>
);

const SIZE = 66;

export function PathNodeDisc({ status, kind, onPress }: { status: NodeStatus; kind: NodeKind; onPress?: () => void }) {
  const [down, setDown] = useState(false);
  const f = FACE[status];
  const locked = status === "locked";
  const sunk = down && !locked;

  const icon =
    status === "completed" ? <Tick c={f.mark} />
      : locked ? <Lock c={f.mark} />
        : kind === "checkpoint" ? <Star c={f.mark} />
          : <Book c={f.mark} />;

  return (
    <Pressable
      disabled={locked}
      onPressIn={() => setDown(true)}
      onPressOut={() => setDown(false)}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ disabled: locked }}
      style={{ width: SIZE, height: SIZE + 5 }}
    >
      <View style={{ position: "absolute", top: 5, width: SIZE, height: SIZE, borderRadius: SIZE / 2, backgroundColor: f.edge }} />
      <View
        style={{
          position: "absolute", top: sunk ? 5 : 0, width: SIZE, height: SIZE, borderRadius: SIZE / 2,
          backgroundColor: f.bg, alignItems: "center", justifyContent: "center",
        }}
      >
        {icon}
      </View>
    </Pressable>
  );
}

/** The "you are here" flag. Only ever one on screen — it is what stops the path being a list. */
export function HerePin({ label }: { label: string }) {
  return (
    <View className="items-center mb-[6px]">
      <View className="rounded-[13px] border-2 border-line bg-card px-[13px] py-[6px]">
        <T size={11.5} weight="black" tone="orange">{label}</T>
      </View>
      <View className="w-[10px] h-[10px] -mt-[5px] rotate-45 border-b-2 border-r-2 border-line bg-card" />
    </View>
  );
}

/** How far a node sits off the centre line. A trail, not a column. */
export function serpentineOffset(i: number): number {
  const wave = [0, 46, 68, 46, 0, -46, -68, -46];
  return wave[i % wave.length];
}

export function TrailSegment({ from, to }: { from: number; to: number }) {
  return (
    <View className="h-[26px] items-center justify-center" style={{ width: "100%" }}>
      <View
        className={cx("bg-line-2 rounded-full")}
        style={{
          width: 6, height: 30,
          transform: [{ translateX: (from + to) / 2 }, { rotate: `${Math.atan2(30, to - from) - Math.PI / 2}rad` }],
        }}
      />
    </View>
  );
}
