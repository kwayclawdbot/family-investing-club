import { notFound } from "next/navigation";
import { getClub, getPaths } from "@/lib/data-live";
import { getSession } from "@/lib/live/session";
import { firstName } from "@/lib/live/supa";
import { STEPS, type Step } from "@/components/onboarding/steps";
import { WhoStep } from "@/components/onboarding/WhoStep";
import { CreateStep } from "@/components/onboarding/CreateStep";
import { StartStep } from "@/components/onboarding/StartStep";
import { GoalsStep } from "@/components/onboarding/GoalsStep";
import { DailyStep } from "@/components/onboarding/DailyStep";
import { ReadyStep } from "@/components/onboarding/ReadyStep";

export function generateStaticParams() {
  return STEPS.map((step) => ({ step }));
}

export default async function OnboardingStep(props: PageProps<"/onboarding/[step]">) {
  const { step } = await props.params;
  if (!STEPS.includes(step as Step)) notFound();
  switch (step as Step) {
    case "who":
      return <WhoStep />;
    case "create":
      return <CreateStep />;
    case "start":
      return <StartStep />;
    case "goals":
      return <GoalsStep />;
    case "daily":
      return <DailyStep />;
    case "ready": {
      const [paths, s] = await Promise.all([getPaths(), getSession()]);
      // Signed in: the club created on the `create` step (or the family's existing one) → real invite code.
      const club = s ? await getClub() : null;
      const live = s && club ? { name: club.name, inviteCode: club.inviteCode } : null;
      const top = paths.filter((p) => !p.elective).slice(0, 3);
      return <ReadyStep paths={top.map((p) => ({ slug: p.slug, title: p.title, lessons: p.lessons }))} live={live} firstName={s ? firstName(s.profile?.display_name, s.user.email) : undefined} />;
    }
  }
}
