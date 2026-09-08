import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, View } from "react-native";
import { useRouter } from "expo-router";
import { Display, Eyebrow, T } from "@/src/ui/type";
import { Screen, Rule } from "@/src/ui/layout";
import { StatStrip } from "@/src/ui/stats";
import { HerePin, PathNodeDisc, serpentineOffset } from "@/src/ui/path";
import { loadLearnerState, loadPaths, type LearnerState, type LearningPath, type PathNode } from "@/src/data/learn";
import { useSession } from "@/src/state/session";
import { tokens } from "@/src/theme/tokens";

/**
 * The path.
 *
 * One screen, scrolled downward, that a member can point at and say "I am here". The unit headings
 * are ruled labels rather than boxes; the nodes are the objects. Everything past the node they are
 * up to is shut, because a path where everything is open is a menu.
 */
export default function LearnScreen() {
  const { userId } = useSession();
  const router = useRouter();
  const [paths, setPaths] = useState<LearningPath[] | null>(null);
  const [state, setState] = useState<LearnerState | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [p, s] = await Promise.all([
        loadPaths(userId),
        userId ? loadLearnerState(userId) : Promise.resolve({ xp: 0, streak: 0, todayXp: 0, beltLevel: 1 }),
      ]);
      setPaths(p);
      setState(s);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your path");
    }
  }, [userId]);

  useEffect(() => { void load(); }, [load]);

  const onRefresh = useCallback(async () => { setRefreshing(true); await load(); setRefreshing(false); }, [load]);

  if (!paths || !state) {
    return (
      <Screen className="items-center justify-center">
        {error ? <T size={13.5} tone="ink-3" className="px-10 text-center">{error}</T> : <ActivityIndicator color={tokens.orange} />}
      </Screen>
    );
  }

  const current = paths[0];
  const here = current?.next ?? null;

  return (
    <Screen>
      <StatStrip streak={state.streak} xp={state.xp} beltLevel={state.beltLevel} />
      <Rule />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 48 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={tokens.orange} />}
      >
        {paths.map((path) => (
          <View key={path.id} className="mt-[22px]">
            <View className="px-[18px]">
              <Eyebrow tone={path.slug.startsWith("belt-") ? "green" : "orange"}>
                {path.done} of {path.total} done
              </Eyebrow>
              <Display size={22} className="mt-[5px]">{path.title}</Display>
              {path.blurb ? <T size={13} tone="ink-3" className="mt-[3px]">{path.blurb}</T> : null}
            </View>

            {path.units.map((unit) => (
              <View key={unit.id} className="mt-[18px]">
                <View className="flex-row items-center gap-[10px] px-[18px]">
                  <Eyebrow tone="ink-3">{unit.title}</Eyebrow>
                  <View className="h-[1.5px] flex-1 rounded-full bg-line-2" />
                </View>

                <View className="items-center mt-[14px]">
                  {unit.nodes.map((node, i) => (
                    <NodeOnTrail
                      key={node.id}
                      node={node}
                      offset={serpentineOffset(i)}
                      isHere={here?.id === node.id}
                      onPress={() => router.push(`/lesson/${node.id}`)}
                    />
                  ))}
                </View>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

function NodeOnTrail({ node, offset, isHere, onPress }: { node: PathNode; offset: number; isHere: boolean; onPress: () => void }) {
  return (
    <View className="items-center" style={{ transform: [{ translateX: offset }], marginBottom: 16 }}>
      {isHere ? <HerePin label={node.status === "in_progress" ? "CONTINUE" : "START"} /> : null}
      <PathNodeDisc status={node.status} kind={node.kind} onPress={onPress} />
      <T
        size={11.5}
        weight={node.status === "locked" ? "bold" : "extrabold"}
        tone={node.status === "locked" ? "ink-4" : "ink-2"}
        numberOfLines={2}
        className="mt-[7px] text-center"
        style={{ maxWidth: 150 }}
      >
        {node.title}
      </T>
    </View>
  );
}
