// Mock data layer — shaped EXACTLY like future Sanity docs
// (exam / question / submission) so swapping to GROQ later is drop-in.

export type QType = "mcq" | "short" | "long";
export type ExamStatus = "upcoming" | "live" | "closed";

export interface Exam {
  id: string;
  title: string;
  subject: string;
  classSem: string;
  colleges: string[];
  releaseAt: string; // ISO
  closeAt: string; // ISO
  durationMins: number;
  totalMarks: number;
  workflow: "draft" | "approved" | "scheduled" | "live" | "closed";
  instructions: string[];
}

export interface Question {
  id: string;
  examId: string;
  number: number;
  type: QType;
  questionText: string;
  options?: string[];
  correctAnswer?: string; // MCQ only — never sent to students in real Sanity query
  marks: number;
}

export interface Answer {
  questionNo: number;
  answer: string;
}

export interface ExamResult {
  examId: string;
  studentName: string;
  rollNo: string;
  college: string;
  answers: Answer[];
  submittedAt: string;
  autoScore: number;
  mcqMax: number;
  totalMarks: number;
  autoSubmitted: boolean;
}

// Times are relative to NOW so the demo always works.
export function getExams(): Exam[] {
  const now = Date.now();
  const h = 3600_000;
  const d = 24 * h;
  return [
    {
      id: "bsc-phy-sem3",
      title: "BSc Physics Sem 3 — Mechanics & Optics",
      subject: "Physics",
      classSem: "BSc Sem 3",
      colleges: ["Fergusson College", "MIT Pune", "St. Xavier's"],
      releaseAt: new Date(now - 1 * h).toISOString(),
      closeAt: new Date(now + 6 * h).toISOString(),
      durationMins: 30,
      totalMarks: 30,
      workflow: "live",
      instructions: [
        "Do not refresh during the last 60 seconds — answers auto-submit at 0:00.",
        "MCQs carry 2 marks each and are auto-checked. Written answers are checked by teachers.",
        "Keep your roll number ready. One submission per student.",
      ],
    },
    {
      id: "bsc-chem-sem3",
      title: "BSc Chemistry Sem 3 — Organic Basics",
      subject: "Chemistry",
      classSem: "BSc Sem 3",
      colleges: ["Fergusson College", "MIT Pune"],
      releaseAt: new Date(now + 2 * d).toISOString(),
      closeAt: new Date(now + 2 * d + 3 * h).toISOString(),
      durationMins: 45,
      totalMarks: 40,
      workflow: "scheduled",
      instructions: [
        "Paper goes live automatically at the scheduled time on all college PCs.",
        "45 minutes duration. Auto-submit at 0:00.",
      ],
    },
    {
      id: "bsc-math-sem2",
      title: "BSc Maths Sem 2 — Calculus (Closed)",
      subject: "Mathematics",
      classSem: "BSc Sem 2",
      colleges: ["St. Xavier's"],
      releaseAt: new Date(now - 7 * d).toISOString(),
      closeAt: new Date(now - 7 * d + 2 * h).toISOString(),
      durationMins: 60,
      totalMarks: 50,
      workflow: "closed",
      instructions: ["This exam is closed. Submissions are locked."],
    },
  ];
}

export function getQuestions(examId: string): Question[] {
  if (examId !== "bsc-phy-sem3") return [];
  return [
    { id: "q1", examId, number: 1, type: "mcq", questionText: "Unit of force in SI system?", options: ["Joule", "Newton", "Watt", "Pascal"], correctAnswer: "Newton", marks: 2 },
    { id: "q2", examId, number: 2, type: "mcq", questionText: "Which law states F = ma?", options: ["Newton's 1st law", "Newton's 2nd law", "Newton's 3rd law", "Hooke's law"], correctAnswer: "Newton's 2nd law", marks: 2 },
    { id: "q3", examId, number: 3, type: "mcq", questionText: "Speed of light in vacuum is approximately?", options: ["3×10⁶ m/s", "3×10⁸ m/s", "3×10¹⁰ m/s", "1.5×10⁸ m/s"], correctAnswer: "3×10⁸ m/s", marks: 2 },
    { id: "q4", examId, number: 4, type: "mcq", questionText: "A convex lens forms a real image when the object is?", options: ["At focus only", "Beyond focus", "Between pole and focus", "Never"], correctAnswer: "Beyond focus", marks: 2 },
    { id: "q5", examId, number: 5, type: "mcq", questionText: "Which quantity is conserved in elastic collision?", options: ["Only momentum", "Only kinetic energy", "Both momentum and kinetic energy", "Neither"], correctAnswer: "Both momentum and kinetic energy", marks: 2 },
    { id: "q6", examId, number: 6, type: "short", questionText: "State the principle of superposition of waves (2–3 lines).", marks: 4 },
    { id: "q7", examId, number: 7, type: "short", questionText: "Define torque and write its SI unit.", marks: 3 },
    { id: "q8", examId, number: 8, type: "short", questionText: "What is total internal reflection? Give one application.", marks: 3 },
    { id: "q9", examId, number: 9, type: "long", questionText: "Derive the lens-maker's formula and explain each term. (150–200 words)", marks: 5 },
    { id: "q10", examId, number: 10, type: "long", questionText: "A 2 kg block slides from rest down a 5 m frictionless incline at 30°. Calculate velocity at the bottom. Show steps.", marks: 5 },
  ];
}

export function getExamStatus(exam: Exam, now = Date.now()): ExamStatus {
  if (now < new Date(exam.releaseAt).getTime()) return "upcoming";
  if (now > new Date(exam.closeAt).getTime()) return "closed";
  return "live";
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const hh = String(Math.floor((s % 86400) / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return d > 0 ? `${d}d ${hh}:${mm}:${ss}` : `${hh}:${mm}:${ss}`;
}

export function scoreMcq(questions: Question[], answers: Answer[]): { scored: number; mcqMax: number } {
  let scored = 0;
  let mcqMax = 0;
  for (const q of questions) {
    if (q.type !== "mcq") continue;
    mcqMax += q.marks;
    const a = answers.find((x) => x.questionNo === q.number)?.answer.trim();
    if (a && q.correctAnswer && a === q.correctAnswer) scored += q.marks;
  }
  return { scored, mcqMax };
}

export const ANNOUNCEMENTS = [
  { id: "a1", title: "Sem 3 exams sync across all colleges", message: "All papers go live at the same second on every student PC. Check the countdown — no early entry." },
];
