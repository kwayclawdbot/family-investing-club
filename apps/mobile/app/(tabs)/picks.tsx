import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, View } from "react-native";
import { Display, Eyebrow, Num, T } from "@/src/ui/type";
import { Rule, Screen } from "@/src/ui/layout";
import { Direction, TickerMark } from "@/src/ui/ticker";
import {
  currentWeek, loadDeskPicks, loadKaiPicks, loadMemberPicks, type Lane, type Pick,
} from "@/src/data/picks";
import { tokens } from "@/src/theme/tokens";

/**
 * The week's picks.
 *
 * Three lanes, never blended, because they are three different kinds of claim: Kai's engine, the
 * club's desk, and members' own calls. The lane is chosen at the top and the list below is a ruled
 * ledger — the ticker mark is the object that carries identity, not a box around each row.
 */
const LANES: { key: Lane; label: string; blurb: string }[] = [
  { key: "kai", label: "Kai", blurb: "What the engine flagged this week. A setup, not advice." },
  { key: "desk", label: "The desk", blurb: "The club's own call, with the reasoning written out." },
  { key: "members", label: "Members", blurb: "Calls members made, and how they turned out." },
];

export default function PicksScreen() {
  const week = useMemo(() => currentWeek(), []);
  const [lane, setLane] = useState<Lane>("kai");
  const [picks, setPicks] = useState<Record<Lane, Pick[]> | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [kai, desk, members] = await Promise.all([loadKaiPicks(week), loadDeskPicks(week), loadMemberPicks(week)]);
      setPicks({ kai, desk, members });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load this week");
    }
  }, [week]);

  useEffect(() => { void load(); }, [load]);
  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);

  const active = LANES.find((l) => l.key === lane)!;
  const rows = picks?.[lane] ?? [];

  return (
    <Screen>
      <View className="px-[18px] pt-[6px] pb-[12px]">
        <Eyebrow>Week of {week.label}</Eyebrow>
        <Display size={26} className="mt-[5px]">This week&apos;s picks</Display>
      </View>

      <View className="flex-row px-[18px] gap-[18px]">
        {LANES.map((l) => {
          const on = l.key === lane;
          return (
            <Pressable key={l.key} onPress={() => setLane(l.key)} accessibilityRole="tab" accessibilityState={{ selected: on }}>
              <T size={14.5} weight="black" tone={on ? "ink" : "ink-4"}>{l.label}</T>
              <View className={on ? "h-[3px] mt-[6px] rounded-full bg-orange" : "h-[3px] mt-[6px]"} />
              {picks ? <T size={10} weight="extrabold" tone="ink-4" className="mt-[3px]">{picks[l.key].length}</T> : null}
            </Pressable>
          );
        })}
      </View>
      <Rule />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.orange} />}
      >
        <T size={12.5} tone="ink-3" className="px-[18px] pt-[12px]">{active.blurb}</T>

        {!picks && !error ? (
          <View className="py-16 items-center"><ActivityIndicator color={tokens.orange} /></View>
        ) : error ? (
          <T size={13} tone="ink-3" className="px-[18px] pt-8 text-center">{error}</T>
        ) : rows.length === 0 ? (
          <EmptyLane lane={lane} />
        ) : (
          <View className="px-[18px] pt-[6px]">
            {rows.map((p, i) => <PickRow key={p.id} pick={p} first={i === 0} />)}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

function PickRow({ pick, first }: { pick: Pick; first: boolean }) {
  const tone = pick.lane === "kai" ? "purple" : pick.lane === "desk" ? "orange" : "green";
  return (
    <View className={first ? "flex-row gap-[13px] py-[14px]" : "flex-row gap-[13px] py-[14px] border-t border-line-2"}>
      <TickerMark symbol={pick.ticker} tone={tone} />
      <View className="flex-1 min-w-0">
        <View className="flex-row items-baseline gap-[8px]">
          <T size={15} weight="black" tone="ink">{pick.ticker}</T>
          <Direction direction={pick.direction} />
          {pick.hits && pick.hits > 1 ? <T size={10.5} weight="extrabold" tone="ink-4">{pick.hits}× this week</T> : null}
          {pick.returnPct != null ? (
            <Num size={12} className={pick.returnPct >= 0 ? "text-green" : "text-red"}>
              {pick.returnPct >= 0 ? "+" : ""}{pick.returnPct.toFixed(1)}%
            </Num>
          ) : null}
        </View>
        <T size={13} weight="bold" tone="ink" className="mt-[2px]">{pick.headline}</T>
        {pick.detail ? <T size={12} tone="ink-2" numberOfLines={3} className="mt-[3px]">{pick.detail}</T> : null}
        <View className="flex-row items-center gap-[8px] mt-[5px]">
          {pick.author ? <T size={10.5} weight="extrabold" tone="ink-4">{pick.author}</T> : null}
          {pick.horizon ? <T size={10.5} weight="bold" tone="ink-4">{pick.horizon}</T> : null}
          {pick.confidence != null ? <T size={10.5} weight="bold" tone="ink-4">confidence {pick.confidence}/5</T> : null}
          {pick.state ? <T size={10.5} weight="extrabold" tone={pick.state === "triggered" ? "green" : "ink-4"}>{pick.state}</T> : null}
          {pick.entry != null ? <T size={10.5} weight="bold" tone="ink-4">entry {pick.entry}</T> : null}
        </View>
      </View>
    </View>
  );
}

/**
 * A blank week must never read as "nothing happened". It says which of the two it is: nobody has
 * posted yet, or the week has not produced one — and what would change that.
 */
function EmptyLane({ lane }: { lane: Lane }) {
  const copy = {
    kai: { head: "Kai has not flagged anything yet this week", body: "The engine posts as setups appear, usually from Monday morning." },
    desk: { head: "The desk has not published this week", body: "A desk pick is written by hand. It arrives when there is something worth writing about." },
    members: { head: "No member calls yet this week", body: "Be the first — post a ticker with your reason and the club sees how it turns out." },
  }[lane];
  return (
    <View className="px-[18px] pt-[26px]">
      <View className="border-l-[3px] border-line-3 pl-[14px]">
        <T size={14} weight="black" tone="ink">{copy.head}</T>
        <T size={12.5} tone="ink-3" className="mt-[4px]">{copy.body}</T>
      </View>
    </View>
  );
}
