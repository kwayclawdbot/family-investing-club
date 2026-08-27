/** Step order — plain module (no "use client") so server components can read it.
 *  `create` only appears when the user chose "Create my club" on `who` (Product Shift §6). */
export const STEPS = ["who", "create", "start", "goals", "daily", "ready"] as const;
export type Step = (typeof STEPS)[number];
/** Dots shown in the header — `create` is folded into `who`. */
export const DOT_STEPS = STEPS.filter((s) => s !== "create");

export function nextStep(step: Step, creating = true): string {
  let i = STEPS.indexOf(step) + 1;
  if (STEPS[i] === "create" && !creating) i++;
  return i < STEPS.length ? `/onboarding/${STEPS[i]}` : "/home";
}
export function prevStep(step: Step, creating = true): string {
  let i = STEPS.indexOf(step) - 1;
  if (STEPS[i] === "create" && !creating) i--;
  return i >= 0 ? `/onboarding/${STEPS[i]}` : "/welcome";
}
