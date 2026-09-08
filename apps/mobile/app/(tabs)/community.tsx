import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, View } from "react-native";
import { Display, Eyebrow, Num, T } from "@/src/ui/type";
import { Rule, Screen } from "@/src/ui/layout";
import { BeltKnot, beltAtLevel } from "@/src/ui/belt";
import { loadFeed, loadStandings, type Post, type Standing } from "@/src/data/community";
import { currentWeek } from "@/src/data/picks";
import { tokens } from "@/src/theme/tokens";

/**
 * The club: what people are saying, and who is doing the work.
 *
 * The standings are this week's XP rather than all time, so a member who joins on a Tuesday can
 * still be on the board by Friday. XP is participation, so the board says who showed up.
 */
export default function CommunityScreen() {
  const week = useMemo(() => currentWeek(), []);
  const [tab, setTab] = useState<"feed" | "standings">("feed");
  const [feed, setFeed] = useState<Post[] | null>(null);
  const [standings, setStandings] = useState<Standing[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [f, s] = await Promise.all([loadFeed(), loadStandings(week.start)]);
      setFeed(f); setStandings(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the club");
    }
  }, [week.start]);

  useEffect(() => { void load(); }, [load]);
  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);

  return (
    <Screen>
      <View className="px-[18px] pt-[6px] pb-[12px]">
        <Eyebrow tone="green">The club</Eyebrow>
        <Display size={26} className="mt-[5px]">Everyone else</Display>
      </View>

      <View className="flex-row px-[18px] gap-[18px]">
        {(["feed", "standings"] as const).map((k) => (
          <Pressable key={k} onPress={() => setTab(k)} accessibilityRole="tab" accessibilityState={{ selected: tab === k }}>
            <T size={14.5} weight="black" tone={tab === k ? "ink" : "ink-4"}>{k === "feed" ? "Talk" : "This week"}</T>
            <View className={tab === k ? "h-[3px] mt-[6px] rounded-full bg-orange" : "h-[3px] mt-[6px]"} />
          </Pressable>
        ))}
      </View>
      <Rule />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.orange} />}
      >
        {error ? <T size={13} tone="ink-3" className="px-[18px] pt-8 text-center">{error}</T>
          : !feed || !standings ? <View className="py-16 items-center"><ActivityIndicator color={tokens.orange} /></View>
            : tab === "feed" ? <Feed posts={feed} />
              : <Standings rows={standings} label={week.label} />}
      </ScrollView>
    </Screen>
  );
}

function Feed({ posts }: { posts: Post[] }) {
  if (!posts.length) {
    return (
      <View className="px-[18px] pt-[26px]">
        <View className="border-l-[3px] border-line-3 pl-[14px]">
          <T size={14} weight="black" tone="ink">Nobody has posted yet</T>
          <T size={12.5} tone="ink-3" className="mt-[4px]">The club talks here — a question, a chart, what you did this week.</T>
        </View>
      </View>
    );
  }
  return (
    <View className="px-[18px]">
      {posts.map((p, i) => (
        <View key={p.id} className={i === 0 ? "py-[15px]" : "py-[15px] border-t border-line-2"}>
          {p.activity ? (
            /* An achievement is a one-line event, not a post. It gets the club's green and no
               author line, because the sentence already says who. */
            <View className="flex-row items-center gap-[8px]">
              <T size={13} weight="bold" tone="green" className="flex-1">{p.activity.sentence}</T>
              <T size={10.5} weight="bold" tone="ink-4">{ago(p.at)}</T>
            </View>
          ) : (
          <>
          <View className="flex-row items-center gap-[8px]">
            <T size={12} weight="black" tone="ink">{p.author ?? "Member"}</T>
            {p.pinned ? <T size={9.5} weight="black" tone="orange" style={{ letterSpacing: 0.5 }}>PINNED</T> : null}
            <T size={10.5} weight="bold" tone="ink-4">{ago(p.at)}</T>
          </View>
          {p.title ? <T size={14.5} weight="black" tone="ink" className="mt-[4px]">{p.title}</T> : null}
          {p.body ? <T size={13} tone="ink-2" className="mt-[3px]">{p.body}</T> : null}
          </>
          )}
          <View className="flex-row items-center gap-[10px] mt-[7px]">
            {p.tickers.slice(0, 4).map((t) => (
              <T key={t} size={11} weight="black" tone="green">${t}</T>
            ))}
            {p.likes > 0 ? <T size={11} weight="extrabold" tone="ink-4">{p.likes} liked</T> : null}
          </View>
        </View>
      ))}
    </View>
  );
}

function Standings({ rows, label }: { rows: Standing[]; label: string }) {
  if (!rows.length) {
    return (
      <View className="px-[18px] pt-[26px]">
        <View className="border-l-[3px] border-line-3 pl-[14px]">
          <T size={14} weight="black" tone="ink">Nobody has earned XP yet this week</T>
          <T size={12.5} tone="ink-3" className="mt-[4px]">Finish a lesson and you are on the board.</T>
        </View>
      </View>
    );
  }
  return (
    <View className="px-[18px]">
      <T size={11.5} weight="extrabold" tone="ink-4" className="pt-[12px]">Week of {label}</T>
      {rows.map((r, i) => (
        <View key={r.userId} className={i === 0 ? "flex-row items-center gap-[12px] py-[12px]" : "flex-row items-center gap-[12px] py-[12px] border-t border-line-2"}>
          <Num size={13} className="w-[20px] text-ink-4">{r.rank}</Num>
          <BeltKnot color={beltAtLevel(r.beltLevel).color} size={30} />
          <T size={14} weight="black" tone="ink" className="flex-1" numberOfLines={1}>{r.name}</T>
          <Num size={14}>{r.xp.toLocaleString()}</Num>
          <T size={10.5} weight="extrabold" tone="ink-4">XP</T>
        </View>
      ))}
    </View>
  );
}

function ago(iso: string) {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.round(hrs / 24)}d`;
}
