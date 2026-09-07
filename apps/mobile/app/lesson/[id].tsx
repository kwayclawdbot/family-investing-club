import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { useAudioPlayer } from "expo-audio";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Display, Eyebrow, T } from "@/src/ui/type";
import { Screen } from "@/src/ui/layout";
import { Compare, Explainer, FlipCards, MultipleChoice, Process, SectionMedia, Takeaways } from "@/src/lesson/sections";
import { assetUrl, type LessonJSON, type StepSpec } from "@/src/lesson/schema";
import { supabase } from "@/src/lib/supabase";
import { useSession } from "@/src/state/session";
import { tokens } from "@/src/theme/tokens";

/**
 * The lesson.
 *
 * It opens on a prologue rather than dropping straight into section one: what the lesson is, what is
 * in it as ruled rows, and the choice of how to take it. "Play it to me" is also the gesture that
 * earns the app the right to make a sound at all.
 *
 * Narration is one file per cue, already rendered and committed on the web side, so a section and
 * its audio cannot drift — sync is a fact rather than a calculation. Sound off downloads nothing.
 */
export default function LessonScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId } = useSession();
  const router = useRouter();

  const [lesson, setLesson] = useState<LessonJSON | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [voice, setVoice] = useState(true);
  const [i, setI] = useState(0);
  const [correct, setCorrect] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data, error: err } = await supabase.from("lessons").select("title, steps, est_minutes, lesson_xp").eq("id", id).maybeSingle();
      if (!alive) return;
      if (err) { setError(err.message); return; }
      const steps = (data as { steps: unknown } | null)?.steps as LessonJSON | null;
      if (!steps?.steps?.length) { setError("This lesson has no content yet."); return; }
      setLesson({ ...steps, title: steps.title ?? (data as { title: string }).title });
    })();
    return () => { alive = false; };
  }, [id]);

  const step: StepSpec | null = lesson?.steps[i] ?? null;
  const cueUrl = voice && step?.audio?.main ? assetUrl(step.audio.main.url) : null;
  const player = useAudioPlayer(cueUrl ? { uri: cueUrl } : null);

  useEffect(() => { if (cueUrl) player.play(); }, [cueUrl, player]);

  const finish = useCallback(async () => {
    if (userId && lesson) {
      await supabase.from("lesson_progress").upsert(
        { user_id: userId, lesson_id: id, status: "completed", progress_pct: 100, completed_at: new Date().toISOString() },
        { onConflict: "user_id,lesson_id" },
      );
      await supabase.from("xp_events").insert({ user_id: userId, amount: lesson.xp ?? 50, kind: "lesson", ref_id: id });
    }
    router.back();
  }, [userId, lesson, id, router]);

  if (error) {
    return (
      <Screen edges={["top", "bottom"]} className="items-center justify-center px-10">
        <T size={14} weight="black" tone="ink" className="text-center">{error}</T>
        <Pressable onPress={() => router.back()} className="mt-4"><T size={13} weight="black" tone="orange">Go back</T></Pressable>
      </Screen>
    );
  }
  if (!lesson) return <Screen className="items-center justify-center"><ActivityIndicator color={tokens.orange} /></Screen>;

  if (!started) {
    return (
      <Prologue
        lesson={lesson}
        onStart={(withVoice) => { setVoice(withVoice); setStarted(true); }}
        onClose={() => router.back()}
      />
    );
  }

  const last = i === lesson.steps.length - 1;

  return (
    <Screen edges={["top", "bottom"]}>
      <View className="flex-row items-center gap-[12px] px-[18px] py-[8px]">
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Close lesson">
          <T size={19} weight="black" tone="ink-4">✕</T>
        </Pressable>
        <View className="flex-1 h-[9px] rounded-full bg-line-2 overflow-hidden">
          <View className="h-full rounded-full bg-green-2" style={{ width: `${((i + 1) / lesson.steps.length) * 100}%` }} />
        </View>
        <T size={11} weight="extrabold" tone="ink-4">{i + 1}/{lesson.steps.length}</T>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 30 }} key={i}>
        <StepView step={step!} onAnswer={(ok) => ok && setCorrect((c) => c + 1)} />
      </ScrollView>

      <View className="px-[18px] pb-[10px]">
        {cueUrl ? (
          <View className="flex-row items-center gap-[10px] pb-[10px]">
            <Pressable onPress={() => (player.playing ? player.pause() : player.play())} accessibilityRole="button">
              <T size={12} weight="black" tone="orange">{player.playing ? "Pause" : "Play"} narration</T>
            </Pressable>
            <Pressable onPress={() => setVoice(false)} accessibilityRole="button">
              <T size={11.5} weight="bold" tone="ink-4">Sound off</T>
            </Pressable>
          </View>
        ) : null}
        <Pressable
          onPress={() => (last ? finish() : setI((n) => n + 1))}
          accessibilityRole="button"
          className="rounded-[16px] bg-orange py-[15px] items-center"
        >
          <T size={15.5} weight="black" tone="cream">{last ? `Finish · +${lesson.xp ?? 50} XP` : "Got it → Continue"}</T>
        </Pressable>
      </View>
    </Screen>
  );
}

function StepView({ step, onAnswer }: { step: StepSpec; onAnswer: (ok: boolean) => void }) {
  switch (step.type) {
    case "explainer": return <Explainer spec={step as never} />;
    case "compare": return <Compare spec={step as never} />;
    case "process": return <Process spec={step as never} />;
    case "flip_cards": return <FlipCards spec={step as never} />;
    case "multiple_choice": return <MultipleChoice spec={step as never} onAnswer={onAnswer} />;
    case "takeaways": return <Takeaways spec={step as never} />;
    default:
      // Stated, not blank. A member should never be looking at an empty screen wondering.
      return (
        <View className="border-l-[3px] border-line-3 pl-[14px]">
          <T size={14} weight="black" tone="ink">This part needs the full app</T>
          <T size={12.5} tone="ink-3" className="mt-[4px]">
            “{step.type}” is a step type the phone player does not draw yet. Nothing is missing from your progress.
          </T>
        </View>
      );
  }
}

function Prologue({ lesson, onStart, onClose }: { lesson: LessonJSON; onStart: (voice: boolean) => void; onClose: () => void }) {
  const sections = useMemo(
    () => lesson.steps.map((s) => ({ label: s.label, heading: (s as { heading?: string; question?: string }).heading ?? (s as { question?: string }).question ?? "" })),
    [lesson.steps],
  );
  const narrated = lesson.steps.some((s) => s.audio?.main);

  return (
    <Screen edges={["top", "bottom"]}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 24 }}>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
          <T size={19} weight="black" tone="ink-4">✕</T>
        </Pressable>
        <Eyebrow>Before you start</Eyebrow>
        <Display size={26} className="mt-[6px]">{lesson.title}</Display>
        {lesson.cover ? <SectionMedia media={lesson.cover} height={162} /> : null}
        {lesson.guide?.intro ? <T size={15} className="mt-[14px]">{lesson.guide.intro}</T> : null}

        <View className="mt-[16px]">
          {sections.map((s, n) => (
            <View key={n} className={n > 0 ? "flex-row items-baseline gap-[10px] py-[7px] border-t border-line-2" : "flex-row items-baseline gap-[10px] py-[7px]"}>
              <T size={10} weight="black" tone="ink-4" style={{ width: 14 }}>{n + 1}</T>
              <T size={12.5} weight="extrabold" tone="ink-2" className="flex-1">{s.heading}</T>
              {s.label ? <T size={8.5} weight="black" tone="ink-4">{s.label}</T> : null}
            </View>
          ))}
        </View>
      </ScrollView>

      <View className="px-[18px] pb-[10px]">
        <View className="flex-row items-center gap-[7px] pb-[9px]">
          <T size={11} weight="extrabold" tone="ink-4">{lesson.duration_minutes ?? 10} min</T>
          <T size={11} weight="extrabold" tone="ink-4">·</T>
          <T size={11} weight="extrabold" tone="ink-4">+{lesson.xp ?? 50} XP</T>
          {narrated ? <><T size={11} weight="extrabold" tone="ink-4">·</T><T size={11} weight="extrabold" tone="ink-4">narrated</T></> : null}
        </View>
        {narrated ? (
          <Pressable onPress={() => onStart(true)} accessibilityRole="button" className="rounded-[16px] bg-orange py-[15px] items-center">
            <T size={15.5} weight="black" tone="cream">Play it to me</T>
          </Pressable>
        ) : null}
        <Pressable
          onPress={() => onStart(false)}
          accessibilityRole="button"
          className={narrated ? "rounded-[16px] border border-line bg-card py-[13px] items-center mt-[10px]" : "rounded-[16px] bg-orange py-[15px] items-center"}
        >
          <T size={narrated ? 13.5 : 15.5} weight="black" tone={narrated ? "ink-2" : "cream"}>
            {narrated ? "I'll read it myself" : "Start the lesson"}
          </T>
        </Pressable>
      </View>
    </Screen>
  );
}
