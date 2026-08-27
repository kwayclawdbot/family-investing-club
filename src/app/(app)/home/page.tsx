import { HomeSwitch } from "@/components/home/HomeSwitch";
import { PulseHome } from "@/components/home/PulseHome";
import { HomeExtras } from "@/components/home/HomeExtras";
import { ChildHome } from "@/components/home/ChildHome";
import { getChildHome, getHomePulse, identityOf, beltFor, nextBelt } from "@/lib/data-live";

/** Prototype v2 `home`: performance pulse + MY PERFORMANCE CENTER + ACTIVE TRADE IDEAS + Your World. Child accounts keep the protected composition. */
export default async function HomePage(props: PageProps<"/home">) {
  const sp = await props.searchParams;
  const forceChild = sp.as === "child";
  const [child, pulse] = await Promise.all([getChildHome(), getHomePulse()]);
  const xp = identityOf("kway")?.lifetimeXp ?? pulse.tiles.xp;
  const belt = beltFor(xp); const next = nextBelt(xp);
  return (
    <HomeSwitch forceChild={forceChild}
      adult={<PulseHome p={pulse} belt={belt} nextBeltLabel={next?.label ?? null} xpToNext={next ? next.minXp - xp : null} extras={<HomeExtras />} />}
      child={<ChildHome data={child} />} />
  );
}
