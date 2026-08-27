"use client";
import { useEffect, useState } from "react";

export type OnboardingAnswers = {
  who?: "me" | "family" | "class";
  start?: "new" | "some" | "invest";
  level?: "Explorer" | "Builder" | "Investor" | "Trader";
  goals?: string[];
  daily?: number;
  reminder?: boolean;
};

const KEY = "fic.onboarding";

export function readAnswers(): OnboardingAnswers {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as OnboardingAnswers) : {};
  } catch {
    return {};
  }
}

export function writeAnswers(patch: OnboardingAnswers) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...readAnswers(), ...patch }));
  } catch {
    /* storage unavailable */
  }
}

/** Hydration-safe read of the stored answers. */
export function useAnswers() {
  const [answers, setAnswers] = useState<OnboardingAnswers>({});
  const [ready, setReady] = useState(false);
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- hydrate from localStorage after mount */
    setAnswers(readAnswers());
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);
  return { answers, ready };
}

export { STEPS, nextStep, prevStep, type Step } from "./steps";
