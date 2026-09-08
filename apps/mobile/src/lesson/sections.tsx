/**
 * The section vocabulary, in React Native.
 *
 * The rule these all obey: no bordered, tinted, rounded rectangle is used to GROUP things. A list of
 * four ideas is a ruled ledger; a sequence is a numbered spine with a rule down the left; the thing
 * you just answered gets a coloured rule, not a panel. Photographs bleed to the screen edges, because
 * a picture inside a padded box inside a section is three frames deep and reads as clip art.
 *
 * Objects with their own identity — a flip card you turn, a path node you press — are still objects.
 * The rule is about containers, not about everything with an edge.
 */
import { useState } from "react";
import { Image } from "expo-image";
import { Pressable, View, useWindowDimensions } from "react-native";
import { Display, Eyebrow, T } from "../ui/type";
import { assetUrl, type CompareStep, type ExplainerStep, type FlipCardsStep, type LessonMedia, type MultipleChoiceStep, type ProcessStep, type TakeawaysStep } from "./schema";
import { cx } from "../ui/cx";

const PAD = 18;

export function SectionMedia({ media, height = 150 }: { media: LessonMedia; height?: number }) {
  const { width } = useWindowDimensions();
  return (
    <View className="mt-3" style={{ marginHorizontal: -PAD }}>
      <Image source={{ uri: assetUrl(media.src) }} style={{ width, height }} contentFit="cover" accessibilityLabel={media.alt} transition={220} />
      {media.caption ? <T size={11} weight="bold" tone="ink-4" className="px-[18px] pt-[6px]">{media.caption}</T> : null}
    </View>
  );
}

export function SectionHead({ label, heading, intro, media }: { label?: string; heading: string; intro?: string; media?: LessonMedia }) {
  return (
    <View>
      {label ? <Eyebrow>{label}</Eyebrow> : null}
      <Display size={21} className="mt-[6px]">{heading}</Display>
      {media ? <SectionMedia media={media} /> : null}
      {intro ? <T size={14} className="mt-2">{intro}</T> : null}
    </View>
  );
}

export function Explainer({ spec }: { spec: ExplainerStep }) {
  return (
    <View>
      <SectionHead label={spec.label} heading={spec.heading ?? ""} media={spec.media} />
      {spec.figure ? (
        /* A stat or a quote, set large against a rule. It is the one thing on the screen that is
           allowed to shout, so it gets scale rather than a box. */
        <View className="mt-[14px] border-l-[3px] border-orange pl-[14px]">
          <T size={26} weight="black" tone="ink" style={{ lineHeight: 30 }}>
            {spec.figure.kind === "quote" ? `\u201C${spec.figure.value}\u201D` : spec.figure.value}
          </T>
          {spec.figure.caption ? <T size={11.5} weight="bold" tone="ink-3" className="mt-[2px]">{spec.figure.caption}</T> : null}
        </View>
      ) : null}
      {spec.body.map((para, i) => (
        <T key={i} size={14.5} className={i === 0 ? "mt-3" : "mt-[10px]"}>{para}</T>
      ))}
    </View>
  );
}

const toneInk = (t: string) => (t === "green" ? "green" : t === "red" ? "red" : "ink") as "green" | "red" | "ink";
const toneDot = (t: string) => (t === "green" ? "bg-green-2" : t === "red" ? "bg-red" : "bg-ink-4");

/** Titles are authored "1 · Work" — the numeral sets as a small figure so four read as an index. */
function splitTitle(title: string) {
  const m = /^(\d+)\s*·\s*(.+)$/.exec(title);
  return m ? { n: m[1], name: m[2] } : { n: null as string | null, name: title };
}

export function Compare({ spec }: { spec: CompareStep }) {
  const ledger = spec.columns.length > 2 || spec.columns.some((c) => c.media);
  return (
    <View>
      <SectionHead label={spec.label} heading={spec.heading} intro={spec.intro} media={spec.media} />
      {ledger ? <CompareLedger spec={spec} /> : <CompareSplit spec={spec} />}
      {spec.note ? (
        <View className="mt-4 border-l-[3px] border-gold pl-[14px]">
          <T size={13} weight="bold" tone="ink">{spec.note}</T>
        </View>
      ) : null}
    </View>
  );
}

function CompareLedger({ spec }: { spec: CompareStep }) {
  return (
    <View className="mt-1">
      {spec.columns.map((col, i) => {
        const { n, name } = splitTitle(col.title);
        const group = col.group && col.group !== spec.columns[i - 1]?.group ? col.group : null;
        return (
          <View key={i}>
            {group ? (
              <View className="flex-row items-center gap-[10px] mt-[18px] mb-[2px]">
                <Eyebrow tone={col.tone === "green" ? "green" : "ink-3"}>{group}</Eyebrow>
                <View className={cx("h-[1.5px] flex-1 rounded-full", col.tone === "green" ? "bg-green-line" : "bg-line-2")} />
              </View>
            ) : null}
            <View className={cx("flex-row gap-[13px] py-[13px]", !group && i > 0 && "border-t border-line-2")}>
              {col.media ? (
                <Image source={{ uri: assetUrl(col.media.src) }} style={{ width: 86, height: 86 }} contentFit="cover" accessibilityLabel={col.media.alt} transition={200} />
              ) : null}
              <View className="flex-1 min-w-0">
                <View className="flex-row items-baseline gap-[7px]">
                  {n ? <T size={10.5} weight="black" tone="ink-4">{n}</T> : null}
                  <T size={15} weight="black" tone={toneInk(col.tone)}>{name}</T>
                </View>
                {col.points.map((p, k) => (
                  <View key={k} className="flex-row gap-[7px] mt-[5px]">
                    <View className={cx("mt-[7px] w-[3px] h-[3px] rounded-full", toneDot(col.tone))} />
                    <T size={k === 0 ? 13 : 12} weight={k === 0 ? "bold" : "semibold"} tone={k === 0 ? "ink" : "ink-2"} className="flex-1">{p}</T>
                  </View>
                ))}
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

function CompareSplit({ spec }: { spec: CompareStep }) {
  return (
    <View className="mt-4 flex-row">
      {spec.columns.map((col, i) => (
        <View key={i} className={cx("flex-1 min-w-0", i > 0 ? "border-l border-line-2 pl-[13px]" : "pr-[13px]")}>
          <View className={cx("h-[3px] w-[24px] rounded-full", col.tone === "green" ? "bg-green-2" : col.tone === "red" ? "bg-red" : "bg-line-3")} />
          <T size={13.5} weight="black" tone={toneInk(col.tone)} className="mt-[8px]">{col.title}</T>
          {col.points.map((p, k) => (
            <View key={k} className="flex-row gap-[7px] mt-[7px]">
              <View className={cx("mt-[7px] w-[4px] h-[4px] rounded-full", toneDot(col.tone))} />
              <T size={12} weight="bold" className="flex-1">{p}</T>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

/** A numbered spine, revealed a move at a time. The rule down the left is what makes it a sequence. */
export function Process({ spec }: { spec: ProcessStep }) {
  const [shown, setShown] = useState(1);
  const all = shown >= spec.moves.length;
  return (
    <View>
      <SectionHead label={spec.label} heading={spec.heading} intro={spec.intro} />
      <View className="mt-4">
        {spec.moves.slice(0, shown).map((m, i) => (
          <View key={i} className="flex-row gap-[13px] pb-[15px]">
            <View>
              <View className="w-[27px] h-[27px] rounded-full bg-orange items-center justify-center">
                <T size={12.5} weight="black" tone="cream">{i + 1}</T>
              </View>
              {i < spec.moves.length - 1 ? <View className="w-[2px] flex-1 bg-line-2 self-center rounded-full mt-[2px]" /> : null}
            </View>
            <View className="flex-1 pt-[2px]">
              <T size={14.5} weight="black" tone="ink">{m.title}</T>
              <T size={13} className="mt-[3px]">{m.body}</T>
            </View>
          </View>
        ))}
      </View>
      {!all ? (
        <Pressable onPress={() => setShown((s) => s + 1)} accessibilityRole="button">
          <T size={13} weight="black" tone="orange">Next step ({shown} of {spec.moves.length}) →</T>
        </Pressable>
      ) : spec.closing ? <T size={13.5} weight="bold" className="mt-1">{spec.closing}</T> : null}
    </View>
  );
}

/** A card you turn over is an object, not a container. It keeps its edge. */
export function FlipCards({ spec }: { spec: FlipCardsStep }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <View>
      <SectionHead label={spec.label} heading={spec.heading} intro={spec.intro} />
      <View className="mt-3 flex-row flex-wrap gap-[10px]">
        {spec.cards.map((c, i) => {
          const on = open === i;
          return (
            <Pressable
              key={i}
              onPress={() => setOpen(on ? null : i)}
              accessibilityRole="button"
              className={cx("rounded-[16px] border px-[13px] py-[12px]", on ? "border-green-line bg-green-tint" : "border-line bg-card")}
              style={{ width: "47.5%", minHeight: 104 }}
            >
              <T size={13} weight="black" tone={on ? "green" : "ink"}>{c.term}</T>
              {on ? <T size={12} className="mt-[5px]">{c.meaning}</T> : <T size={11} weight="bold" tone="ink-4" className="mt-[5px]">Tap to turn</T>}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function MultipleChoice({ spec, onAnswer }: { spec: MultipleChoiceStep; onAnswer: (correct: boolean) => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  const right = picked === spec.correctIndex;
  // One entry per option, in the options' own order — so the feedback answers the mistake made.
  const wrongCopy = picked != null ? spec.wrongFeedback?.[picked]?.text : undefined;

  return (
    <View>
      <Eyebrow tone="orange">{spec.label ?? "KNOWLEDGE CHECK"}</Eyebrow>
      <Display size={19} className="mt-[6px]">{spec.question}</Display>
      <View className="mt-4">
        {spec.options.map((o, i) => {
          const chosen = picked === i;
          const isRight = i === spec.correctIndex;
          const settled = picked != null;
          return (
            <Pressable
              key={i}
              disabled={settled}
              onPress={() => { setPicked(i); onAnswer(i === spec.correctIndex); }}
              accessibilityRole="radio"
              accessibilityState={{ checked: chosen }}
              className={cx(
                "rounded-[14px] border px-[14px] py-[13px] mb-[9px]",
                settled && isRight ? "border-green-line bg-green-tint"
                  : chosen ? "border-[#EDD3CB] bg-[#FBE9E4]"
                    : "border-line bg-card",
              )}
            >
              <T size={13.5} weight="bold" tone={settled && isRight ? "green" : "ink"}>{o}</T>
            </Pressable>
          );
        })}
      </View>
      {picked != null ? (
        <View className={cx("mt-1 border-l-[3px] pl-[14px]", right ? "border-green-2" : "border-red")}>
          <T size={13.5} weight="black" tone={right ? "green" : "red"}>{right ? "That's it" : "Not quite"}</T>
          <T size={13} className="mt-[3px]">{right ? spec.explanation ?? spec.reinforce ?? "" : wrongCopy ?? spec.explanation ?? ""}</T>
        </View>
      ) : null}
    </View>
  );
}

export function Takeaways({ spec }: { spec: TakeawaysStep }) {
  return (
    <View>
      <Eyebrow tone="green">{spec.label ?? "WRAP UP"}</Eyebrow>
      <Display size={21} className="mt-[6px]">{spec.heading}</Display>
      <View className="mt-3">
        {spec.points.map((p, i) => (
          <View key={i} className={cx("flex-row gap-[11px] py-[10px]", i > 0 && "border-t border-line-2")}>
            <T size={11} weight="black" tone="ink-4" style={{ width: 14 }}>{i + 1}</T>
            <T size={13.5} weight="bold" tone="ink" className="flex-1">{p}</T>
          </View>
        ))}
      </View>
      {spec.closing ? <T size={13.5} className="mt-2">{spec.closing}</T> : null}
    </View>
  );
}
