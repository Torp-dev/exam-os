import { groq } from "next-sanity";
import { client } from "./client";
import { configured } from "./env";
import {
  getExams as mockExams,
  getQuestions as mockQuestions,
  ANNOUNCEMENTS,
  type Exam,
  type Question,
} from "@/lib/exams";

const EXAMS_QUERY = groq`*[_type == "exam"] | order(releaseAt desc) {
  "id": slug.current,
  title, subject, classSem, colleges,
  releaseAt, closeAt, resultAt, durationMins, totalMarks,
  "workflow": status,
  instructions
}`;

// NOTE: correctAnswer is intentionally NOT selected — students must never see it.
const QUESTIONS_QUERY = groq`*[_type == "question" && exam->slug.current == $examId] | order(number asc) {
  "id": _id,
  "examId": exam->slug.current,
  number, type, questionText, options, marks
}`;

const ANNOUNCEMENTS_QUERY = groq`*[_type == "announcement" && (!defined(showUntil) || showUntil > now())] | order(_createdAt desc) {
  "id": _id, title, message
}`;

export async function fetchExams(): Promise<Exam[]> {
  if (!configured) return mockExams();
  try {
    const rows = await client.fetch<Exam[]>(EXAMS_QUERY, {}, { next: { revalidate: 30 } });
    if (!rows.length) return mockExams();
    // Studio docs may miss optional fields — normalize so pages never crash.
    return rows.map((e) => ({
      ...e,
      colleges: e.colleges ?? [],
      instructions: e.instructions ?? [],
    }));
  } catch {
    return mockExams(); // offline / misconfigured → demo still works
  }
}

export async function fetchQuestions(examId: string): Promise<Question[]> {
  if (!configured) return mockQuestions(examId);
  try {
    const rows = await client.fetch<Question[]>(QUESTIONS_QUERY, { examId });
    if (!rows.length) return mockQuestions(examId);
    return rows.map((q) => ({ ...q, options: q.options ?? [] }));
  } catch {
    return mockQuestions(examId);
  }
}

export async function fetchAnnouncements(): Promise<{ id: string; title: string; message: string }[]> {
  if (!configured) return ANNOUNCEMENTS;
  try {
    const rows = await client.fetch(ANNOUNCEMENTS_QUERY, {}, { next: { revalidate: 60 } });
    return rows.length ? rows : ANNOUNCEMENTS;
  } catch {
    return ANNOUNCEMENTS;
  }
}
