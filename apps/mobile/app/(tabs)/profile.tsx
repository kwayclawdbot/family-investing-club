import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { Display, Eyebrow, Num, T } from "@/src/ui/type";
import { Rule, Screen } from "@/src/ui/layout";
import { BELTS, BeltKnot, beltAtLevel, eligibleBelt } from "@/src/ui/belt";
import { loadLearnerState, type LearnerState } from "@/src/data/learn";
import { useSession } from "@/src/state/session";
import { supabase } from "@/src/lib/supabase";
import { tokens } from "@/src/theme/tokens";

/**
 * You.
 *
 * The ladder is shown whole, with the belts held marked and the rest ahead, because a rank you
 * cannot see the shape of is just a word. The distinction the app is built on is stated plainly
 * here: XP unlocks the test, the test awards the belt.
 */
export default function ProfileScreen() {
  const { userId, session } = useSession();
  const [state, setState] = useState<LearnerState | null>(null);

  const load = useCallback(async () => {
    if (!userId) return;
    setState(await loadLearnerState(userId));
  }, [userId]);
  useEffect(() => { void load(); }, [load]);

  if (!state) return <Screen className="items-center justify-center"><ActivityIndicator color={tokens.orange} /></Screen>;

  const held = beltAtLevel(state.beltLevel);
  const eligible = eligibleBelt(state.xp);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="px-[18px] pt-[6px]">
          <Eyebrow>Your rank</Eyebrow>
          <Display size={26} className="mt-[5px]">{held.label}</Display>
          <T size={13} tone="ink-3" className="mt-[3px]">
            {session?.user.email ?? "Signed in"}
          </T>
        </View>

        <View className="flex-row px-[18px] py-[16px]">
          <Stat label="XP" value={state.xp.toLocaleString()} />
          <View className="w-px bg-line-2 mx-[16px]" />
          <Stat label={`day${state.streak === 1 ? "" : "s"} running`} value={String(state.streak)} />
          <View className="w-px bg-line-2 mx-[16px]" />
          <Stat label="today" value={`+${state.todayXp}`} />
        </View>
        <Rule />

        <View className="px-[18px] pt-[16px]">
          <Eyebrow tone="green">The ladder</Eyebrow>
          <T size={12.5} tone="ink-3" className="mt-[5px]">
            XP unlocks the test. Passing the test awards the belt — so the belt is always something you did,
            not something that accumulated.
          </T>
        </View>

        <View className="px-[18px] mt-[10px]">
          {BELTS.map((b, i) => {
            const holds = state.beltLevel >= b.level;
            const canSit = !holds && state.xp >= b.minXp;
            return (
              <View key={b.level} className={i === 0 ? "flex-row items-center gap-[13px] py-[12px]" : "flex-row items-center gap-[13px] py-[12px] border-t border-line-2"}>
                <View style={{ opacity: holds || canSit ? 1 : 0.32 }}><BeltKnot color={b.color} size={36} /></View>
                <View className="flex-1">
                  <T size={14} weight="black" tone={holds ? "ink" : canSit ? "orange" : "ink-4"}>{b.label}</T>
                  <T size={11.5} weight="bold" tone="ink-4">
                    {holds ? "Earned" : canSit ? "Test unlocked" : `${b.minXp.toLocaleString()} XP`}
                  </T>
                </View>
                {canSit ? <T size={10.5} weight="black" tone="orange" style={{ letterSpacing: 0.5 }}>SIT IT</T> : null}
              </View>
            );
          })}
        </View>

        {eligible.level > held.level ? (
          <View className="px-[18px] mt-[8px]">
            <View className="border-l-[3px] border-gold pl-[14px]">
              <T size={13.5} weight="black" tone="ink">There is a test waiting</T>
              <T size={12.5} tone="ink-2" className="mt-[3px]">
                Your XP qualifies you for {eligible.short}. You hold {held.short} until you sit it.
              </T>
            </View>
          </View>
        ) : null}

        <Pressable onPress={() => supabase.auth.signOut()} className="px-[18px] mt-[26px]" accessibilityRole="button">
          <T size={13} weight="black" tone="ink-4">Sign out</T>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Num size={22}>{value}</Num>
      <T size={10.5} weight="extrabold" tone="ink-4" className="mt-[2px]">{label}</T>
    </View>
  );
}
