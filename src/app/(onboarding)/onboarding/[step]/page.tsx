import { notFound } from "next/navigation";
import { getPaths } from "@/lib/data";
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
      const paths = (await getPaths()).filter((p) => !p.elective).slice(0, 3);
      return <ReadyStep paths={paths.map((p) => ({ slug: p.slug, title: p.title, lessons: p.lessons }))} />;
    }
  }
}
