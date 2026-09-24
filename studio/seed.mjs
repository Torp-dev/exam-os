import { getCliClient } from "sanity/cli";

const client = getCliClient({ apiVersion: "2025-09-01" });
const H = 3600_000;
const D = 24 * H;
const now = Date.now();
const iso = (t) => new Date(t).toISOString();

const EXAMS = [
  {
    slug: "english-sem5-prose",
    title: "Subject - English | Semester - 5 (Prose & Composition)",
    subject: "English",
    classSem: "Semester - 5",
    releaseAt: iso(now + 2 * D),
    closeAt: iso(now + 2 * D + 3 * H),
    resultAt: iso(now + 4 * D),
    durationMins: 60,
    totalMarks: 50,
    questions: [
      { type: "mcq", questionText: "Who wrote 'The Guide'?", options: ["R.K. Narayan", "Mulk Raj Anand", "Khushwant Singh", "Ruskin Bond"], correctAnswer: "R.K. Narayan", marks: 2 },
      { type: "mcq", questionText: "A sonnet has how many lines?", options: ["12", "14", "16", "10"], correctAnswer: "14", marks: 2 },
      { type: "mcq", questionText: "Which is a concrete noun?", options: ["Beauty", "Table", "Honesty", "Freedom"], correctAnswer: "Table", marks: 2 },
      { type: "mcq", questionText: "'To be or not to be' is from which play?", options: ["Macbeth", "Hamlet", "Othello", "Lear"], correctAnswer: "Hamlet", marks: 2 },
      { type: "short", questionText: "Define alliteration with two examples (2–3 lines).", marks: 4 },
      { type: "short", questionText: "What is the difference between a metaphor and a simile?", marks: 4 },
      { type: "short", questionText: "Convert to passive voice: 'The committee approved the proposal.'", marks: 4 },
      { type: "long", questionText: "Write a 150–200 word character sketch of Swami from 'Swami and Friends'.", marks: 15 },
      { type: "long", questionText: "Draft a formal letter to your principal requesting a library upgrade. Show full format.", marks: 15 },
    ],
  },
  {
    slug: "history-sem4-modern-india",
    title: "Subject - History | Semester - 4 (Modern India)",
    subject: "History",
    classSem: "Semester - 4",
    releaseAt: iso(now + 4 * D),
    closeAt: iso(now + 4 * D + 2 * H),
    durationMins: 45,
    totalMarks: 40,
    questions: [
      { type: "mcq", questionText: "The Revolt of 1857 started in which month?", options: ["March", "May", "August", "October"], correctAnswer: "May", marks: 2 },
      { type: "mcq", questionText: "Who founded the Indian National Congress session of 1885's venue city?", options: ["Bombay", "Calcutta", "Madras", "Delhi"], correctAnswer: "Bombay", marks: 2 },
      { type: "mcq", questionText: "Jallianwala Bagh massacre happened in which year?", options: ["1915", "1919", "1921", "1930"], correctAnswer: "1919", marks: 2 },
      { type: "mcq", questionText: "Who gave the slogan 'Swaraj is my birthright'?", options: ["Gandhi", "Nehru", "Tilak", "Bose"], correctAnswer: "Tilak", marks: 2 },
      { type: "short", questionText: "Name two causes of the Revolt of 1857 (2–3 lines).", marks: 4 },
      { type: "short", questionText: "What was the Rowlatt Act? One paragraph.", marks: 4 },
      { type: "short", questionText: "Who were the Moderates? Two points.", marks: 4 },
      { type: "long", questionText: "Describe the Non-Cooperation Movement: causes, course, and why it was withdrawn (150–200 words).", marks: 10 },
      { type: "long", questionText: "Assess the role of women in the freedom struggle with two examples.", marks: 10 },
    ],
  },
  {
    slug: "geography-sem3-physical",
    title: "Subject - Geography | Semester - 3 (Physical Geography)",
    subject: "Geography",
    classSem: "Semester - 3",
    releaseAt: iso(now + 6 * D),
    closeAt: iso(now + 6 * D + 2 * H),
    durationMins: 30,
    totalMarks: 30,
    questions: [
      { type: "mcq", questionText: "Which is the largest planet?", options: ["Saturn", "Jupiter", "Neptune", "Earth"], correctAnswer: "Jupiter", marks: 2 },
      { type: "mcq", questionText: "The Richter scale measures?", options: ["Wind speed", "Earthquakes", "Rainfall", "Temperature"], correctAnswer: "Earthquakes", marks: 2 },
      { type: "mcq", questionText: "Which gas is most abundant in air?", options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], correctAnswer: "Nitrogen", marks: 2 },
      { type: "mcq", questionText: "Sahara is what type of landform region?", options: ["Desert", "Delta", "Plateau", "Glacier"], correctAnswer: "Desert", marks: 2 },
      { type: "short", questionText: "Define weathering and name its two types.", marks: 3 },
      { type: "short", questionText: "What causes day and night? Two lines.", marks: 3 },
      { type: "long", questionText: "Explain the water cycle with a labelled description (150–200 words).", marks: 8 },
      { type: "long", questionText: "Compare the Himalayas and the Western Ghats on age, height, and origin.", marks: 8 },
    ],
  },
];

const COLLEGES = ["Fergusson College", "MIT Pune", "St. Xavier's"];

for (const e of EXAMS) {
  const exam = await client.create({
    _type: "exam",
    title: e.title,
    slug: { _type: "slug", current: e.slug },
    subject: e.subject,
    classSem: e.classSem,
    colleges: COLLEGES,
    releaseAt: e.releaseAt,
    closeAt: e.closeAt,
    resultAt: e.resultAt,
    durationMins: e.durationMins,
    totalMarks: e.totalMarks,
    status: "scheduled",
    instructions: [
      "Paper goes live automatically at the scheduled time on all college PCs.",
      `${e.durationMins} minutes duration. Auto-submit at 0:00.`,
    ],
  });
  console.log("exam:", exam.slug?.current ?? exam._id);

  let n = 0;
  for (const q of e.questions) {
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
  console.log(`  + ${n} questions`);
}

await client.create({
  _type: "announcement",
  title: "Three new papers scheduled",
  message: "English, History, and Geography papers go live over the next week. Check countdowns — no early entry.",
});
console.log("announcement: ok");

// remove the earlier junk test doc
try {
  await client.delete("14d6c135-4664-46fd-817f-ed7c0d476ac8");
  console.log("test doc deleted");
} catch (e) {
  console.log("test doc already gone");
}
