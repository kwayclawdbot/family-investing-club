import { getPromotion, identityOf, beltFor, nextBelt } from "@/lib/data-live";
import { Promotion } from "@/components/belts/Promotion";

/** Belt promotion ceremony (prototype v2: Purple Belt · 2,640 lifetime XP · level 6 of 7 · 560 to Black). */
export default async function BeltPromotionPage() {
  const p = await getPromotion();
  const xp = identityOf("kway")?.lifetimeXp ?? p.belt.minXp;
  const belt = beltFor(xp); const next = nextBelt(xp);
  return <Promotion p={{ ...p, belt, lifetimeXp: xp, toNext: next ? next.minXp - xp : undefined, nextLabel: next?.short }} />;
}
