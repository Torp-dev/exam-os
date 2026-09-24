import { getCliClient } from "sanity/cli";

const client = getCliClient({ apiVersion: "2025-09-01" });

// Always-live judge demo: wide window so the paper is joinable on any visit.
const exam = await client.create({
  _type: "exam",
  title: "Subject - General Knowledge | Semester - 1 (Judge Demo — always live)",
  slug: { _type: "slug", current: "judge-demo-gk" },
  subject: "General Knowledge",
  classSem: "Semester - 1",
  colleges: ["Fergusson College", "MIT Pune", "St. Xavier's"],
  releaseAt: new Date(Date.now() - 24 * 3600_000).toISOString(),
  closeAt: "2030-01-01T00:00:00.000Z",
  resultAt: "2030-02-01T00:00:00.000Z",
  durationMins: 20,
  totalMarks: 30,
  status: "live",
  instructions: [
    "Demo paper for judges — join with any name + 4-digit roll (try 1042).",
    "20 minutes duration. Submit manually or let the timer hit 0:00 for the Time's UP card.",
  ],
});

const QS = [
  { type: "mcq", questionText: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Mercury"], correctAnswer: "Mars", marks: 2 },
  { type: "mcq", questionText: "How many days are there in a leap year?", options: ["365", "366", "364", "367"], correctAnswer: "366", marks: 2 },
  { type: "mcq", questionText: "Which is the national animal of India?", options: ["Lion", "Elephant", "Bengal Tiger", "Leopard"], correctAnswer: "Bengal Tiger", marks: 2 },
  { type: "mcq", questionText: "How many continents are there?", options: ["5", "6", "7", "8"], correctAnswer: "7", marks: 2 },
  { type: "short", questionText: "Name the capital cities of any two Indian states.", marks: 4 },
  { type: "short", questionText: "What does CPU stand for? One line.", marks: 4 },
  { type: "long", questionText: "Describe any one Indian festival: how it is celebrated and why (100–150 words).", marks: 7 },
  { type: "long", questionText: "Explain why the sky appears blue during the day. Show the reasoning.", marks: 7 },
];

let n = 0;
for (const q of QS) {
  n += 1;
  await client.create({
    _type: "question",
    exam: { _type: "reference", _ref: exam._id },
    number: n,
    type: q.type,
    questionText: q.questionText,
    ...(q.options ? { options: q.options } : {}),
    ...(q.correctAnswer ? { correctAnswer: q.correctAnswer } : {}),
    marks: q.marks,
  });
}
console.log("live demo exam +", n, "questions");
