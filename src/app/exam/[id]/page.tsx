"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchExams, fetchQuestions } from "@/sanity/queries";
import { detectCollege, getExamStatus, type Exam, type Question } from "@/lib/exams";
import Countdown from "@/components/Countdown";
import Navbar from "@/components/Navbar";

export default function ExamDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [exam, setExam] = useState<Exam | null>(null);
  const [qCount, setQCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [roll, setRoll] = useState("");
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
    return <main className="mx-auto max-w-2xl px-4 py-32 text-center text-sm text-zinc-500">Loading paper…</main>;
  }

  if (!exam) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-32 text-center">
        <p className="font-display text-2xl font-bold">Exam not found</p>
        <Link href="/" className="mt-2 inline-block text-sm font-medium underline">Back to exams</Link>
      </main>
    );
  }
  const st = getExamStatus(exam);

  const start = () => {
    if (!name.trim() || !roll.trim()) {
      setErr("Enter your name and roll number to start.");
      return;
    }
    const college = detectCollege(roll, exam.colleges);
    if (!college) {
      setErr("Enter a valid 4-digit roll number issued by your college.");
      return;
    }
    localStorage.setItem("examos:identity", JSON.stringify({ name: name.trim(), rollNo: roll.trim(), college }));
    router.push(`/exam/${exam.id}/take`);
  };
  const detected = detectCollege(roll, exam.colleges);

  return (
    <main className="w-full max-w-full overflow-x-hidden bg-paper pt-28">
      <Navbar />
      <div className="mx-auto w-full max-w-3xl px-4 pb-24">
        <Link href="/" className="text-sm font-medium text-zinc-500 transition hover:text-black">
          All exams
        </Link>
        <div className="mt-3 rounded-3xl border border-black/10 bg-white">
          <div className="p-6 md:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              {exam.subject} · {exam.classSem}
            </p>
            <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">
              {exam.title}
            </h1>
            <p className="mt-1 text-sm text-zinc-500">{exam.colleges.join(" · ")}</p>

            <div className="mt-6 rounded-2xl bg-paper p-5">
              {st === "upcoming" && (
                <div className="text-center">
                  <p className="text-sm text-zinc-500">Paper opens in</p>
                  <p className="font-display mt-1 text-4xl font-extrabold tabular-nums">
                    <Countdown targetISO={exam.releaseAt} />
                  </p>
                  <p className="mt-1 text-sm text-zinc-600">
                    Starts at {new Date(exam.releaseAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                  <p className="mt-2 text-xs text-zinc-400">Same second on every college PC. Refresh when it hits zero.</p>
                </div>
              )}
              {st === "closed" && (
                <div className="rounded-xl bg-zinc-200 p-4 text-center text-sm font-medium text-zinc-600">
                  This exam is closed. Submissions are locked.
                </div>
              )}
              {st === "live" && (
                <>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="text-zinc-600">
                      Closes in <Countdown targetISO={exam.closeAt} /> · Ends {new Date(exam.closeAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="font-medium">{exam.durationMins} min · {qCount} questions · {exam.totalMarks} marks</span>
                  </div>
                  <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-zinc-700">
                    {exam.instructions.map((i, k) => <li key={k}>{i}</li>)}
                  </ul>
                  <div className="grid gap-2">
                    <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name"
                      className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-black" />
                    <input value={roll} onChange={(e) => setRoll(e.target.value)} placeholder="4-digit roll number (e.g. 1042)"
                      inputMode="numeric" maxLength={4}
                      className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-black" />
                    {roll.trim() && (
                      <p className="text-sm text-zinc-500">
                        {detected ? <>College detected: <b className="text-ink">{detected}</b></> : "College not recognised yet — check your 4 digits."}
                      </p>
                    )}
                    {err && <p className="text-sm font-medium text-red-600">{err}</p>}
                    <button onClick={start}
                      className="rounded-xl bg-ink py-3 text-sm font-semibold text-white transition hover:bg-zinc-800">
                      Start exam — {exam.durationMins} min timer begins
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
