/** FIC-side view models for the learn lane (courses → modules → lessons, lesson data, review, live). */
import type { LessonJSON, Register } from "./schema";

export type LessonStatus = "completed" | "in_progress" | "not_started";

export type QuizQuestion = { question: string; options: string[]; correctIndex: number; explanation?: string };

export type LessonResource = {
  id: string; type: string | null; title: string; description: string | null;
  fileUrl: string | null; fileName: string | null; externalUrl: string | null; videoProvider: string | null; videoId: string | null;
};

export type LessonNeighbor = { id: string; title: string };

/** Everything the lesson player needs, resolved server-side under RLS. */
export type LessonData = {
  id: string;
  title: string;
  description: string | null;
  courseSlug: string;
  courseTitle: string;
  moduleTitle: string;
  lessonNo: number;
  lessonTotal: number;
  estMinutes: number;
  xp: number;
  isFree: boolean;
  /** Present for the 13 stepped lessons. */
  stepped: LessonJSON | null;
  /** Legacy viewer: youtube | html | bunny | mux | null. */
  videoProvider: "youtube" | "html" | "bunny" | "mux" | null;
  /** Absolute URL / id for the provider (html paths are resolved against the legacy asset origin). */
  videoId: string | null;
  videoDurationSec: number | null;
  quiz: { id: string; questions: QuizQuestion[]; passingScore: number } | null;
  resources: LessonResource[];
  progress: { status: LessonStatus; pct: number };
  resumeStep: number;
  xpBanked: boolean;
  quizPassed: boolean;
  register: Register;
  prev: LessonNeighbor | null;
  next: LessonNeighbor | null;
  /** Entitlement reason when the member may not open this lesson (FTA sampler / academy rule). */
  locked: string | null;
};

export type CourseLesson = {
  id: string; title: string; index: number; minutes: number; xp: number; status: LessonStatus; pct: number;
  kind: "lesson" | "checkpoint" | "challenge"; stepped: boolean; hasQuiz: boolean; isFree: boolean;
};
export type CourseModule = { id: string; title: string; blurb: string; lessons: CourseLesson[]; done: number };
export type CourseDetail = {
  id: string; slug: string; title: string; blurb: string; program: string | null; minTier: string | null;
  modules: CourseModule[]; lessons: number; done: number; pct: number; minutes: number; xp: number;
  nextLesson: CourseLesson | null;
};

export type CourseSummary = {
  id: string; slug: string; title: string; blurb: string; program: string | null; minTier: string | null;
  lessons: number; done: number; pct: number; modules: number; nextLessonId: string | null; nextLessonTitle: string | null;
};

export type ReviewCard = { id: string; front: string; back: string; set: string; track: string; visual: unknown | null; due: boolean; streak: number };
export type ReviewDeck = { cards: ReviewCard[]; dueCount: number; reviewedToday: number; xpToday: boolean; track: string };

export type SkillRow = { id: string; name: string; domain: string; score: number; attempts: number; nextReviewAt: string | null };

export type RecordingKind = "upload" | "youtube" | "external";
export type LiveKind = "session" | "event";
export type LiveStatus = "live" | "upcoming" | "recorded" | "past";
export type LiveItem = {
  id: string; kind: LiveKind; title: string; blurb: string; host: string; hostTitle: string | null;
  startsAt: string; minutes: number; status: LiveStatus; track: string; classType: string | null;
  joinUrl: string | null; rsvped: boolean; rsvpCount: number; viewers: number;
  recording: { kind: RecordingKind; embedUrl: string | null; url: string | null } | null;
  worksheetUrl: string | null; assignment: string | null; minTier: string | null; tickers: string[];
};

export type LearnHubData = {
  streak: number;
  continueLesson: { lessonId: string; title: string; courseTitle: string; courseSlug: string; lessonNo: number; lessonTotal: number; minutes: number; pct: number } | null;
  courses: CourseSummary[];
  live: { now: LiveItem[]; upcoming: LiveItem[]; recordings: LiveItem[] };
  review: { due: number; weak: SkillRow[] };
  xpWeek: number;
  lessonsDone: number;
};
