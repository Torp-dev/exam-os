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
  resultAt?: string; // ISO — results publish at this time, checked in Sanity Studio
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
  examTitle: string;
  resultAt: string | null;
  studentName: string;
  rollNo: string;
  college: string;
  answers: Answer[];
  submittedAt: string;
  autoSubmitted: boolean;
}

// Times are relative to NOW so the demo always works: 2 live, 3 upcoming.
export function getExams(): Exam[] {
  const now = Date.now();
  const h = 3600_000;
  const d = 24 * h;
  return [
    {
      id: "bsc-phy-sem3",
      title: "Subject - Physics | Semester - 3 (Mechanics & Optics)",
      subject: "Physics",
      classSem: "Semester - 3",
      colleges: ["Fergusson College", "MIT Pune", "St. Xavier's"],
      releaseAt: new Date(now - 1 * h).toISOString(),
      closeAt: new Date(now + 6 * h).toISOString(),
      resultAt: new Date(now + 2 * d).toISOString(),
      durationMins: 30,
      totalMarks: 30,
      workflow: "live",
      instructions: [
        "Do not refresh during the last 60 seconds — answers auto-submit at 0:00.",
        "Checking happens in Sanity — teachers award all marks, nothing is scored on this screen.",
        "Keep your roll number ready. One submission per student.",
      ],
    },
    {
      id: "bsc-chem-sem3",
      title: "Subject - Chemistry | Semester - 3 (Organic Basics)",
      subject: "Chemistry",
      classSem: "Semester - 3",
      colleges: ["Fergusson College", "MIT Pune"],
      releaseAt: new Date(now - 30 * 60_000).toISOString(),
      closeAt: new Date(now + 3 * h).toISOString(),
      resultAt: new Date(now + 3 * d).toISOString(),
      durationMins: 45,
      totalMarks: 40,
      workflow: "live",
      instructions: [
        "45 minutes duration. Auto-submit at 0:00.",
        "Checking happens in Sanity — teachers award all marks, nothing is scored on this screen.",
        "Keep your roll number ready. One submission per student.",
      ],
    },
    {
      id: "bsc-math-sem3",
      title: "Subject - Mathematics | Semester - 3 (Linear Algebra)",
      subject: "Mathematics",
      classSem: "Semester - 3",
      colleges: ["MIT Pune", "St. Xavier's"],
      releaseAt: new Date(now + 2 * d).toISOString(),
      closeAt: new Date(now + 2 * d + 3 * h).toISOString(),
      resultAt: new Date(now + 4 * d).toISOString(),
      durationMins: 60,
      totalMarks: 50,
      workflow: "scheduled",
      instructions: [
        "Paper goes live automatically at the scheduled time on all college PCs.",
        "60 minutes duration. Auto-submit at 0:00.",
      ],
    },
    {
      id: "bsc-cs-sem3",
      title: "Subject - Computer Science | Semester - 3 (Data Structures)",
      subject: "Computer Science",
      classSem: "Semester - 3",
      colleges: ["Fergusson College", "St. Xavier's"],
      releaseAt: new Date(now + 4 * d).toISOString(),
      closeAt: new Date(now + 4 * d + 2 * h).toISOString(),
      resultAt: new Date(now + 6 * d).toISOString(),
      durationMins: 45,
      totalMarks: 40,
      workflow: "scheduled",
      instructions: [
        "Paper goes live automatically at the scheduled time on all college PCs.",
        "45 minutes duration. Auto-submit at 0:00.",
      ],
    },
    {
      id: "bsc-bio-sem2",
      title: "Subject - Botany | Semester - 2 (Cell Biology)",
      subject: "Botany",
      classSem: "Semester - 2",
      colleges: ["Fergusson College"],
      releaseAt: new Date(now + 6 * d).toISOString(),
      closeAt: new Date(now + 6 * d + 2 * h).toISOString(),
      resultAt: new Date(now + 8 * d).toISOString(),
      durationMins: 30,
      totalMarks: 30,
      workflow: "scheduled",
      instructions: [
        "Paper goes live automatically at the scheduled time on all college PCs.",
        "30 minutes duration. Auto-submit at 0:00.",
      ],
    },
    {
      id: "bsc-math-sem2",
      title: "Subject - Mathematics | Semester - 2 (Calculus)",
      subject: "Mathematics",
      classSem: "Semester - 2",
      colleges: ["Fergusson College", "MIT Pune", "St. Xavier's"],
      releaseAt: new Date(now - 7 * d).toISOString(),
      closeAt: new Date(now - 7 * d + 2 * h).toISOString(),
      resultAt: new Date(now - 2 * d).toISOString(),
      durationMins: 60,
      totalMarks: 50,
      workflow: "closed",
      instructions: ["This exam is closed. Submissions are locked."],
    },
  ];
}

export function getQuestions(examId: string): Question[] {
  if (examId === "bsc-chem-sem3") return [
    { id: "q1", examId, number: 1, type: "mcq", questionText: "Which of these is an alcohol functional group?", options: ["-COOH", "-OH", "-CHO", "-NH2"], correctAnswer: "-OH", marks: 2 },
    { id: "q2", examId, number: 2, type: "mcq", questionText: "General formula of alkanes?", options: ["CnH2n", "CnH2n+2", "CnH2n-2", "CnHn"], correctAnswer: "CnH2n+2", marks: 2 },
    { id: "q3", examId, number: 3, type: "mcq", questionText: "Which test detects aldehydes?", options: ["Litmus test", "Tollens' test", "Flame test", "pH test"], correctAnswer: "Tollens' test", marks: 2 },
    { id: "q4", examId, number: 4, type: "mcq", questionText: "Hybridisation of carbon in methane?", options: ["sp", "sp2", "sp3", "dsp2"], correctAnswer: "sp3", marks: 2 },
    { id: "q5", examId, number: 5, type: "mcq", questionText: "Which is an electrophile?", options: ["OH-", "CN-", "NO2+", "Cl-"], correctAnswer: "NO2+", marks: 2 },
    { id: "q6", examId, number: 6, type: "short", questionText: "Define isomerism with one example (2–3 lines).", marks: 4 },
    { id: "q7", examId, number: 7, type: "short", questionText: "State Markovnikov's rule with one example.", marks: 3 },
    { id: "q8", examId, number: 8, type: "short", questionText: "Distinguish between SN1 and SN2 in two points.", marks: 3 },
    { id: "q9", examId, number: 9, type: "long", questionText: "Explain the mechanism of electrophilic aromatic substitution with energy profile. (150–200 words)", marks: 10 },
    { id: "q10", examId, number: 10, type: "long", questionText: "An organic compound with molecular mass 60 gives effervescence with sodium. Identify it and write two reactions. Show steps.", marks: 10 },
  ];
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

const ROLL_COLLEGES: Record<string, string> = {
  "1": "Fergusson College",
  "4": "Fergusson College",
  "7": "Fergusson College",
  "2": "MIT Pune",
  "5": "MIT Pune",
  "8": "MIT Pune",
  "3": "St. Xavier's",
  "6": "St. Xavier's",
  "9": "St. Xavier's",
  "0": "St. Xavier's",
};

// Roll numbers are 4 digits; the first digit encodes the college
// (1/4/7 Fergusson, 2/5/8 MIT, 3/6/9/0 Xavier's), scoped to the colleges
// this exam is synced to. Returns null if unknown.
export function detectCollege(rollNo: string, colleges: string[]): string | null {
  const roll = rollNo.trim();
  if (!/^\d{4}$/.test(roll)) return null;
  const name = ROLL_COLLEGES[roll.charAt(0)];
  return name && colleges.includes(name) ? name : null;
};

export interface PublishedResult {
  examId: string;
  studentName: string;
  rollNo: string;
  college: string;
  marksAwarded: number;
  totalMarks: number;
  feedback: string;
  returnedAt: string;
}

// Demo stand-in for Sanity `submission` docs with status "returned".
// Later: GROQ `*[_type=="submission" && exam->slug.current==$examId && status=="returned"]`.
export const PUBLISHED_RESULTS: PublishedResult[] = [
  {
    examId: "bsc-math-sem2",
    studentName: "Aarav Sharma",
    rollNo: "1042",
    college: "Fergusson College",
    marksAwarded: 42,
    totalMarks: 50,
    feedback: "Strong calculus steps. Revise integration by parts for full marks.",
    returnedAt: new Date(Date.now() - 2 * 24 * 3600_000).toISOString(),
  },
];

export function findPublishedResult(examId: string, name: string, roll: string): PublishedResult | null {
  const n = name.trim().toLowerCase();
  const r = roll.trim();
  return PUBLISHED_RESULTS.find(
    (p) => p.examId === examId && p.studentName.toLowerCase() === n && p.rollNo === r
  ) ?? null;
}

export const ANNOUNCEMENTS = [
  { id: "a1", title: "Sem 3 exams sync across all colleges", message: "All papers go live at the same second on every student PC. Check the countdown — no early entry." },
];
