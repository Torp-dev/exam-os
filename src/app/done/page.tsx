"use client";
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getExams, getQuestions, type ExamResult } from "@/lib/exams";

function DoneInner() {
  const sp = useSearchParams();
  const id = sp.get("id") || "";
  const auto = sp.get("auto") === "1";
  const exam = useMemo(() => getExams().find((e) => e.id === id), [id]);
  const result: ExamResult | null = useMemo(() => {
    try {
      const raw = localStorage.getItem(`examos:result:${id}`);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }, [id]);
  const questions = useMemo(() => getQuestions(id), [id]);

  if (!exam || !result) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="font-semibold">No submission found.</p>
        <Link href="/" className="text-blue-600 underline">Back to exams</Link>
      </main>
    );
  }

  const pct = result.totalMarks ? Math.round((result.autoScore / result.totalMarks) * 100) : 0;

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <div className="rounded-2xl border bg-white p-6 text-center">
        <p className="text-3xl">✅</p>
        <h1 className="mt-1 text-2xl font-bold">Answers {auto ? "auto-submitted" : "submitted"} — locked</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {exam.title} · {result.studentName} ({result.rollNo}, {result.college})
        </p>
        <p className="mt-1 font-mono text-xs text-zinc-400">
          Submitted at {new Date(result.submittedAt).toLocaleString()}
        </p>
        {auto && <p className="mt-2 text-sm text-red-600">Time ran out at 0:00 — the site took your answers automatically.</p>}

        <div className="mx-auto mt-4 grid max-w-md grid-cols-3 gap-2">
          <div className="rounded-xl bg-zinc-100 p-3">
            <p className="text-xl font-bold">{result.autoScore}/{result.totalMarks}</p>
            <p className="text-xs text-zinc-500">MCQ score / total (written pending teacher)</p>
          </div>
          <div className="rounded-xl bg-zinc-100 p-3">
            <p className="text-xl font-bold">{pct}%</p>
            <p className="text-xs text-zinc-500">MCQ % of paper</p>
          </div>
          <div className="rounded-xl bg-zinc-100 p-3">
            <p className="text-xl font-bold">{result.answers.filter((a) => a.answer.trim()).length}/{questions.length}</p>
            <p className="text-xs text-zinc-500">Attempted</p>
          </div>
        </div>
      </div>

      <h2 className="mb-2 mt-6 text-sm font-semibold text-zinc-500">REVIEW (MCQ auto-checked)</h2>
      <div className="space-y-2">
        {questions.map((q) => {
          const mine = result.answers.find((a) => a.questionNo === q.number)?.answer ?? "";
          if (q.type !== "mcq") {
            return (
              <div key={q.id} className="rounded-xl border bg-white p-4 text-sm">
                <p className="font-medium">Q{q.number}. {q.questionText} <span className="text-zinc-400">({q.marks}m · teacher checks)</span></p>
                <p className="mt-1 whitespace-pre-wrap text-zinc-700">{mine || <i className="text-zinc-400">Not answered</i>}</p>
              </div>
            );
          }
          const ok = mine === q.correctAnswer;
          return (
            <div key={q.id} className={`rounded-xl border p-4 text-sm ${mine ? (ok ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50") : "bg-white"}`}>
              <p className="font-medium">Q{q.number}. {q.questionText}</p>
              <p className="mt-1">Yours: <b>{mine || "—"}</b> {mine && (ok ? "✅" : "❌")}</p>
              {!ok && <p>Correct: <b>{q.correctAnswer}</b></p>}
            </div>
          );
        })}
      </div>

      <div className="mt-6 text-center">
        <Link href="/" className="rounded-xl bg-black px-5 py-2 text-sm font-semibold text-white">Back to exams</Link>
      </div>
    </main>
  );
}

export default function Done() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-xl px-4 py-16 text-center text-sm text-zinc-500">Loading result…</main>}>
      <DoneInner />
    </Suspense>
  );
}
