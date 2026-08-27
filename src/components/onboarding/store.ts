"use client";
import { useEffect, useState } from "react";

export type OnboardingAnswers = {
  /** Product Shift v3: club first. */
  who?: "create" | "join" | "explore";
  joinCode?: string;
  clubName?: string;
  clubKind?: "family" | "friends" | "mixed";
  clubPrivacy?: "private" | "public";
  start?: "new" | "some" | "invest";
  level?: "Explorer" | "Builder" | "Investor" | "Trader";
  goals?: string[];
  daily?: number | null;
  reminder?: boolean;
  weeklyHabit?: boolean;
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

/** The club created during onboarding (read by /club). */
export function writeClub(club: { name: string; kind: string; privacy: string }) {
  try {
    localStorage.setItem("fic.club", JSON.stringify({ ...club, createdAt: new Date().toISOString(), members: 1 }));
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

export { STEPS, DOT_STEPS, nextStep, prevStep, type Step } from "./steps";
