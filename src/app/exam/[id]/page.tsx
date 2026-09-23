"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchExams, fetchQuestions } from "@/sanity/queries";
import { getExamStatus, type Exam, type Question } from "@/lib/exams";
import Countdown from "@/components/Countdown";

export default function ExamDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [exam, setExam] = useState<Exam | null>(null);
  const [qCount, setQCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [roll, setRoll] = useState("");
  const [college, setCollege] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      const exams = await fetchExams();
      const found = exams.find((e) => e.id === id) ?? null;
      setExam(found);
      if (found) {
        const qs: Question[] = await fetchQuestions(found.id);
        setQCount(qs.length);
      }
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return <main className="mx-auto max-w-2xl px-4 py-16 text-center text-sm text-zinc-500">Loading paper…</main>;
  }

  if (!exam) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-lg font-semibold">Exam not found</p>
        <Link href="/" className="text-blue-600 underline">Back to exams</Link>
      </main>
    );
  }
  const st = getExamStatus(exam);

  const start = () => {
    if (!name.trim() || !roll.trim() || !college) {
      setErr("Enter your name, roll number and college to start.");
      return;
    }
    localStorage.setItem("examos:identity", JSON.stringify({ name: name.trim(), rollNo: roll.trim(), college }));
    router.push(`/exam/${exam.id}/take`);
  };

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      <Link href="/" className="text-sm text-blue-600">← All exams</Link>
      <h1 className="mt-2 text-2xl font-bold">{exam.title}</h1>
      <p className="text-sm text-zinc-500">{exam.subject} · {exam.classSem} · {exam.colleges.join(" · ")}</p>

      <div className="mt-4 rounded-2xl border bg-white p-5">
        {st === "upcoming" && (
          <div className="text-center">
            <p className="text-sm text-zinc-500">Paper goes live in</p>
            <p className="text-4xl"><Countdown targetISO={exam.releaseAt} /></p>
            <p className="mt-2 text-xs text-zinc-400">Same second on every college PC. Refresh when it hits zero.</p>
          </div>
        )}
        {st === "closed" && (
          <div className="rounded-xl bg-zinc-100 p-4 text-center text-sm font-medium text-zinc-600">
            This exam is closed. Submissions are locked.
          </div>
        )}
        {st === "live" && (
          <>
            <div className="mb-3 flex items-center justify-between text-sm">
              <span>Closes in <Countdown targetISO={exam.closeAt} /></span>
              <span className="font-medium">{exam.durationMins} min · {qCount} questions · {exam.totalMarks} marks</span>
            </div>
            <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-zinc-700">
              {exam.instructions.map((i, k) => <li key={k}>{i}</li>)}
            </ul>
            <div className="grid gap-2">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name"
                className="rounded-lg border px-3 py-2 text-sm" />
              <input value={roll} onChange={(e) => setRoll(e.target.value)} placeholder="Roll number"
                className="rounded-lg border px-3 py-2 text-sm" />
              <select value={college} onChange={(e) => setCollege(e.target.value)}
                className="rounded-lg border px-3 py-2 text-sm">
                <option value="">Select college…</option>
                {exam.colleges.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              {err && <p className="text-sm text-red-600">{err}</p>}
              <button onClick={start}
                className="rounded-xl bg-black py-2.5 text-sm font-semibold text-white hover:bg-zinc-800">
                Start exam — {exam.durationMins} min timer begins
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
