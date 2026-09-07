/**
 * The page furniture: a screen, a rule, a row, a section head.
 *
 * These exist so that no screen reaches for a bordered, rounded, drop-shadowed rectangle to group
 * things. FIC composes with rules, type scale and objects that have identity — a list of four things
 * is a ruled ledger, not four cards. `Rule` and `Row` are what a card would have been.
 */
import { View, type ViewProps } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { Display, Eyebrow, T } from "./type";
import { cx } from "./cx";

export function Screen({ children, className, edges = ["top"], ...rest }: ViewProps & { edges?: Edge[] }) {
  return (
    <SafeAreaView edges={edges} className="flex-1 bg-background">
      <View {...rest} className={cx("flex-1", className)}>{children}</View>
    </SafeAreaView>
  );
}

/** A hairline. The divider that does the job a card border was doing. */
export function Rule({ className }: { className?: string }) {
  return <View className={cx("h-px bg-line-2", className)} />;
}

/** A label with a rule running out to the edge — what separates groups without boxing them. */
export function GroupRule({ label, tone = "ink-3" }: { label: string; tone?: "ink-3" | "green" | "orange" }) {
  return (
    <View className="flex-row items-center gap-[10px] mt-[18px] mb-[2px]">
      <Eyebrow tone={tone === "ink-3" ? "ink-3" : tone}>{label}</Eyebrow>
      <View className={cx("h-[1.5px] flex-1 rounded-full", tone === "green" ? "bg-green-line" : "bg-line-2")} />
    </View>
  );
}

export function SectionHead({ label, heading, intro }: { label?: string; heading: string; intro?: string }) {
  return (
    <View className="px-[18px]">
      {label ? <Eyebrow>{label}</Eyebrow> : null}
      <Display size={21} className="mt-[6px]">{heading}</Display>
      {intro ? <T size={14} className="mt-2">{intro}</T> : null}
    </View>
  );
}
