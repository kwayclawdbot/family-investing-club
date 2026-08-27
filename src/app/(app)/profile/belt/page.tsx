import { getPromotion } from "@/lib/data-live";
import { Promotion } from "@/components/belts/Promotion";

/** Belt promotion ceremony. Reached on a real promotion, or previewed from the belt row on Profile (`?preview=1`). */
export default async function BeltPromotionPage() {
  const p = await getPromotion();
  return <Promotion p={p} />;
}
