import { getPromotion, beltStatus } from "@/lib/data-live";
import { Promotion } from "@/components/belts/Promotion";

/**
 * The belt page — what you hold, and what stands between you and the next one.
 *
 * XP does not promote anyone. It unlocks the right to SIT the next belt test; passing it is what
 * awards the belt (`fic_belt_awards`). So this page shows one of two things: a test that is ready to
 * sit, or the XP still to earn before one is.
 */
export default async function BeltPromotionPage() {
  const p = await getPromotion();
  const xp = p.lifetimeXp ?? p.belt.minXp;
  const status = beltStatus(xp, p.belt.level);
  const goal = status.testReady ?? status.working;
  return (
    <Promotion
      p={{
        ...p,
        belt: status.belt,
        lifetimeXp: xp,
        toNext: status.testReady ? 0 : status.xpToGo || undefined,
        nextLabel: goal?.short,
        testReady: !!status.testReady,
      }}
    />
  );
}
