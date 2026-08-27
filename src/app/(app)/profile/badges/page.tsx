import { getBadges } from "@/lib/data-live";
import { cx } from "@/components/ui";
import { TopBar } from "@/components/shell/TopBar";

const HOW: Record<string, string> = {
  b1: "Complete your first lesson.", b2: "Place your first practice order.", b3: "Ace a checkpoint quiz.", b4: "Hold 5+ companies across 3 sectors.",
};
const LOCKED = [
  { emoji: "🔥", label: "Streak 30", how: "Keep a 30-day learning streak." },
  { emoji: "👨‍👩‍👧‍👦", label: "Family First", how: "Two family members active in one day." },
  { emoji: "🔬", label: "Researcher", how: "Write a thesis for a Club idea." },
  { emoji: "📉", label: "Chart Reader", how: "Score 8/10 in Chart Practice." },
  { emoji: "🗣️", label: "Debater", how: "Post 10 helpful comments in Club." },
  { emoji: "🧺", label: "Diversified Portfolio", how: "No holding over 25% for 30 days." },
];

export default async function BadgesPage() {
  const badges = await getBadges();
  const earned = badges.filter((b) => b.id !== "b4");
  const locked = [{ ...badges.find((b) => b.id === "b4")!, how: HOW.b4 }, ...LOCKED];
  return (
    <div className="-mx-[18px]">
      <TopBar backHref="/profile" title="Badges" />
      <div className="px-[18px] pb-6">
        <p className="text-[12.5px] font-bold text-ink-3">{earned.length} earned · {locked.length} to go. Badges reward learning, never risk.</p>
        <h2 className="mt-4 mb-2 text-[15px] font-black text-ink">Earned</h2>
        <div className="grid grid-cols-3 gap-3">
          {earned.map((b) => (
            <div key={b.id} className="bg-card border border-line rounded-card px-2 py-3 text-center">
              <span className="mx-auto w-[52px] h-[52px] rounded-full bg-green-tint border-2 border-green-2 flex items-center justify-center text-[22px]">{b.emoji}</span>
              <div className="mt-2 text-[12px] font-black text-ink leading-tight">{b.label}</div>
              <div className="mt-[2px] text-[10px] font-bold text-ink-3 leading-tight">{HOW[b.id]}</div>
            </div>
          ))}
        </div>
        <h2 className="mt-5 mb-2 text-[15px] font-black text-ink">Locked</h2>
        <div className="grid grid-cols-3 gap-3">
          {locked.map((b) => (
            <div key={b.label} className={cx("bg-card border border-line rounded-card px-2 py-3 text-center")}>
              <span className="mx-auto w-[52px] h-[52px] rounded-full bg-line-2 border-2 border-dashed border-[#C9BC9E] flex items-center justify-center text-[22px] grayscale opacity-60">{b.emoji}</span>
              <div className="mt-2 text-[12px] font-black text-ink-2 leading-tight">{b.label}</div>
              <div className="mt-[2px] text-[10px] font-bold text-ink-3 leading-tight">{b.how}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
