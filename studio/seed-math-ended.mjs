import { getCliClient } from "sanity/cli";

const client = getCliClient({ apiVersion: "2025-09-01" });
const H = 3600_000;
const D = 24 * H;
const now = Date.now();
const iso = (t) => new Date(t).toISOString();

// Ended-but-unchecked Math paper: judges/teacher demo the full
// check → marks → scheduled-result flow on these 17 sheets.
const exam = await client.create({
  _type: "exam",
  title: "Subject - Mathematics | Semester - 4 (Algebra)",
  slug: { _type: "slug", current: "math-sem4-algebra" },
  subject: "Mathematics",
  classSem: "Semester - 4",
  colleges: ["Fergusson College", "MIT Pune", "St. Xavier's"],
  releaseAt: iso(now - 3 * D),
  closeAt: iso(now - 1 * D),
  resultAt: iso(now + 3 * D), // scheduled: results post in 3 days
  durationMins: 60,
  totalMarks: 50,
  status: "closed",
  instructions: [
    "Demo paper for the checking workflow — 17 submitted sheets included.",
    "Check in Studio: read each sheet, award one total in marksAwarded, flip to returned.",
  ],
});

const QS = [
  { type: "mcq", questionText: "Solve 2x + 6 = 14.", options: ["x = 2", "x = 4", "x = 8", "x = 10"], correctAnswer: "x = 4", marks: 2 },
  { type: "mcq", questionText: "Expand (a + b)².", options: ["a² + b²", "a² + 2ab + b²", "2a + 2b", "a²b²"], correctAnswer: "a² + 2ab + b²", marks: 2 },
  { type: "mcq", questionText: "What is the slope of y = 3x + 2?", options: ["2", "3", "5", "6"], correctAnswer: "3", marks: 2 },
  { type: "mcq", questionText: "What is √144?", options: ["10", "12", "14", "16"], correctAnswer: "12", marks: 2 },
  { type: "mcq", questionText: "Which is the next prime after 7?", options: ["8", "9", "10", "11"], correctAnswer: "11", marks: 2 },
  { type: "short", questionText: "Solve x² − 5x + 6 = 0. Show steps.", marks: 6 },
  { type: "short", questionText: "Factorise 4x² − 9.", marks: 6 },
  { type: "short", questionText: "If f(x) = 2x² − 3x + 1, find f(2).", marks: 6 },
  { type: "short", questionText: "Explain with one example the difference between an equation and an identity.", marks: 6 },
  { type: "short", questionText: "A train travels 120 km in 2 hours. At the same speed, how far does it travel in 5 hours? Show working.", marks: 6 },
  { type: "long", questionText: "Derive the quadratic formula by completing the square on ax² + bx + c = 0, and state the condition for real roots.", marks: 10 },
];

const created = [];
for (let i = 0; i < QS.length; i++) {
  const q = await client.create({
    _type: "question",
    exam: { _type: "reference", _ref: exam._id },
    number: i + 1,
    ...QS[i],
  });
  created.push(q);
}
const snapQs = created.map((q, i) => ({
  _key: `sq${i + 1}`,
  number: i + 1,
  qtype: QS[i].type,
  questionText: QS[i].questionText,
  ...(QS[i].options ? { options: QS[i].options } : {}),
  ...(QS[i].correctAnswer ? { correctAnswer: QS[i].correctAnswer } : {}),
  marks: QS[i].marks,
}));
const paperTotal = QS.reduce((t, q) => t + q.marks, 0);

const GOOD = {
  6: "x² − 5x + 6 = (x − 2)(x − 3) = 0, so x = 2 or x = 3.",
  7: "4x² − 9 = (2x)² − 3² = (2x − 3)(2x + 3).",
  8: "f(2) = 2(4) − 3(2) + 1 = 8 − 6 + 1 = 3.",
  9: "An equation holds for specific values, e.g. 2x = 6 only when x = 3. An identity holds for all values, e.g. (a+b)² = a² + 2ab + b².",
  10: "Speed = 120/2 = 60 km/h. Distance in 5 h = 60 × 5 = 300 km.",
  11: "Divide by a: x² + (b/a)x + c/a = 0. Complete the square: (x + b/2a)² = (b² − 4ac)/4a². So x = (−b ± √(b²−4ac))/2a. Real roots need b² − 4ac ≥ 0.",
};
const WEAK = {
  6: "x = 5 maybe? I guessed.",
  7: "4x² − 9 = 4x(x − 9)?",
  8: "f(2) = 2x2 − 3x2 + 1 = no idea, 0?",
  9: "Equation and identity are the same thing.",
  10: "120 + 5 = 125 km.",
  11: "Quadratic formula is x = something with b square. Did not remember.",
};

const STUDENTS = [
  "Aarav Sharma", "Diya Patel", "Arjun Mehta", "Ananya Iyer", "Vikram Singh",
  "Sneha Kulkarni", "Rohan Desai", "Priya Nair", "Karan Joshi", "Ishita Rao",
  "Aditya Verma", "Kavya Menon", "Nikhil Gupta", "Pooja Shah", "Rahul Yadav",
  "Simran Kaur", "Varun Reddy",
];
// skill pattern per student: 0 = strong (all right), 1 = average (some wrong), 2 = weak (mostly wrong)
const wrongMcq = (idx, optIdx) => QS[idx].options[(optIdx + 1) % QS[idx].options.length];

let n = 0;
for (let s = 0; s < STUDENTS.length; s++) {
  const skill = s % 3;
  const answers = QS.map((q, qi) => {
    let a = "";
    if (q.type === "mcq") {
      const right = skill === 0 || (skill === 1 && (s + qi) % 2 === 0);
      a = right ? q.correctAnswer : wrongMcq(qi, s);
    } else {
      const good = skill === 0 || (skill === 1 && (s + qi) % 3 !== 0);
      a = good ? GOOD[qi + 1] : WEAK[qi + 1];
    }
    return { _key: `q${qi + 1}`, questionNo: qi + 1, answer: a };
  });
  await client.create({
    _type: "submission",
    exam: { _type: "reference", _ref: exam._id },
    studentName: STUDENTS[s],
    rollNo: String(1001 + s),
    college: "Fergusson College",
    answers,
    snapshot: { totalMarks: paperTotal, questions: snapQs },
    submittedAt: iso(now - 1 * D - s * 7 * 60_000),
    status: "submitted",
  });
  n++;
}

console.log(`exam=${exam._id} questions=${created.length} submissions=${n} total=${paperTotal}`);
