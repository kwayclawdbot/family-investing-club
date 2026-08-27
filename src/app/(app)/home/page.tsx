import { HomeSwitch } from "@/components/home/HomeSwitch";
import { PulseHome } from "@/components/home/PulseHome";
import { ChildHome } from "@/components/home/ChildHome";
import { getHomePulse, getChildHome, identityOf, beltFor, nextBelt } from "@/lib/data";

/** Home v3 — performance pulse (canvas v9, artboard 04); child accounts keep the protected composition (artboard 10). */
export default async function HomePage(props: PageProps<"/home">) {
  const sp = await props.searchParams;
  const forceChild = sp.as === "child";
  const [pulse, child] = await Promise.all([getHomePulse(), getChildHome()]);
  const xp = identityOf("kway")?.lifetimeXp ?? pulse.tiles.xp;
  const belt = beltFor(xp);
  const next = nextBelt(xp);
  return (
    <HomeSwitch
      forceChild={forceChild}
      adult={<PulseHome p={{ ...pulse, tiles: { ...pulse.tiles, xp } }} belt={belt} nextBeltLabel={next?.label ?? null} xpToNext={next ? next.minXp - xp : null} />}
      child={<ChildHome data={child} />}
    />
  );
}
