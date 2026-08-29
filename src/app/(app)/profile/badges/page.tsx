import { cx } from "@/components/ui";
import { EmptyState } from "@/components/ui/extras";
import { TopBar } from "@/components/shell/TopBar";
import { getMyBadges } from "@/lib/live/family";

/** Badges on FTA `badges` + `badge_awards` (the live award table). Badges reward learning, never risk. */
export default async function BadgesPage() {
  const b = await getMyBadges();
  return (
    <div className="-mx-[18px]">
      <TopBar backHref="/profile" title="Badges" />
      <div className="px-[18px] pb-6">
        {!b ? <EmptyState emoji="🏅" title="Sign in to see your badges" action="Sign in" href="/login?next=/profile/badges" /> : (
          <>
            <p className="text-[12.5px] font-bold text-ink-3">{b.earned.length} earned · {b.locked.length} to go. Badges reward learning, never risk.</p>
            <h2 className="mt-4 mb-2 text-[15px] font-black text-ink">Earned</h2>
            {b.earned.length === 0 ? <EmptyState emoji="🌱" title="No badges yet" body="Finish your first lesson to earn one." action="Start learning" href="/learn" /> : (
              <div className="grid grid-cols-3 gap-3">
                {b.earned.map((x) => (
                  <div key={x.id} className="bg-card border border-line rounded-card px-2 py-3 text-center">
                    <span className="mx-auto w-[52px] h-[52px] rounded-full bg-green-tint border-2 border-green-2 flex items-center justify-center text-[22px]">{x.emoji}</span>
                    <div className="mt-2 text-[12px] font-black text-ink leading-tight">{x.label}</div>
                    <div className="mt-[2px] text-[10px] font-bold text-ink-3 leading-tight">{new Date(x.awardedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</div>
                  </div>
                ))}
              </div>
            )}
            {b.locked.length > 0 && (
              <>
                <h2 className="mt-5 mb-2 text-[15px] font-black text-ink">Locked</h2>
                <div className="grid grid-cols-3 gap-3">
                  {b.locked.map((x) => (
                    <div key={x.id} className={cx("bg-card border border-line rounded-card px-2 py-3 text-center")}>
                      <span className="mx-auto w-[52px] h-[52px] rounded-full bg-line-2 border-2 border-dashed border-[#C9BC9E] flex items-center justify-center text-[22px] grayscale opacity-60">{x.emoji}</span>
                      <div className="mt-2 text-[12px] font-black text-ink-2 leading-tight">{x.label}</div>
                      <div className="mt-[2px] text-[10px] font-bold text-ink-3 leading-tight">{x.how}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
