/** Step order — plain module (no "use client") so server components can read it. */
export const STEPS = ["who", "start", "goals", "daily", "ready"] as const;
export type Step = (typeof STEPS)[number];
export function nextStep(step: Step): string {
  const i = STEPS.indexOf(step);
  return i < STEPS.length - 1 ? `/onboarding/${STEPS[i + 1]}` : "/home";
}
export function prevStep(step: Step): string {
  const i = STEPS.indexOf(step);
  return i > 0 ? `/onboarding/${STEPS[i - 1]}` : "/welcome";
}
