"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { findPublishedResult, getExams, type Exam } from "@/lib/exams";
import { fetchExams, fetchReturnedSubmission } from "@/sanity/queries";

export default function ResultLookup() {
  const { id } = useParams<{ id: string }>();
  const [liveExam, setLiveExam] = useState<Exam | null>(null);
  useEffect(() => {
    fetchExams().then((all) => setLiveExam(all.find((e) => e.id === id) ?? null)).catch(() => {});
  }, [id]);
  const mockExam = useMemo(() => getExams().find((e) => e.id === id), [id]);
  const exam = liveExam ?? mockExam;
  const [name, setName] = useState("");
  const [roll, setRoll] = useState("");
  const [err, setErr] = useState("");
  const [checking, setChecking] = useState(false);
  const [lookedUp, setLookedUp] = useState(false);
  const [found, setFound] = useState<ReturnType<typeof findPublishedResult>>(null);

  if (!exam) {
    return (
      <main className="mx-auto max-w-xl px-4 py-32 text-center">
        <p className="font-display text-xl font-bold">Exam not found.</p>
        <Link href="/results" className="mt-2 inline-block text-sm font-medium underline">Back to results</Link>
      </main>
    );
  }

  const published = exam.resultAt ? Date.now() > new Date(exam.resultAt).getTime() : false;

  const check = async () => {
    if (!name.trim() || !roll.trim()) {
      setErr("Enter your name and 4-digit roll number.");
      return;
    }
    setChecking(true);
    setErr("");
    try {
      // Live teacher-checked mark sheet first…
      const live = await fetchReturnedSubmission(exam.id, name, roll);
      if (live && live.marksAwarded != null) {
        setFound({
          examId: exam.id,
          studentName: live.studentName,
          rollNo: live.rollNo,
          college: live.college,
          marksAwarded: live.marksAwarded,
          totalMarks: live.totalMarks,
          feedback: live.feedback ?? "",
          returnedAt: live.returnedAt,
        });
        setLookedUp(true);
        return;
      }
      // …offline/demo fallback.
      const hit = findPublishedResult(exam.id, name, roll);
      setFound(hit);
      setLookedUp(true);
      setErr(hit ? "" : "No published result for this name and roll number.");
    } finally {
      setChecking(false);
    }
  };

  const pct = found && found.totalMarks ? Math.round((found.marksAwarded / found.totalMarks) * 100) : 0;

  return (
    <main className="w-full max-w-full overflow-x-hidden bg-paper pt-28">
      <Navbar />
      <div className="mx-auto w-full max-w-xl px-4 pb-24">
        <Link href="/results" className="text-sm font-medium text-zinc-500 transition hover:text-black">
          All results
        </Link>
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
          {exam.subject} · {exam.classSem}
        </p>
        <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight">{exam.title}</h1>

        {!published ? (
          <div className="mt-6 rounded-3xl border border-black/10 bg-white p-6 text-center">
            <p className="font-display text-xl font-bold">Results not published yet</p>
            <p className="mt-1 text-sm text-zinc-500">
              {exam.resultAt
                ? `Results publish on ${new Date(exam.resultAt).toLocaleString()}.`
                : "Your college will announce the results date."}
            </p>
          </div>
        ) : !lookedUp || !found ? (
          <div className="mt-6 rounded-3xl border border-black/10 bg-white p-6">
            <p className="font-display text-lg font-bold">Enter name and roll to view result</p>
            <div className="mt-4 grid gap-2">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name"
                className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-black" />
              <input value={roll} onChange={(e) => setRoll(e.target.value)} placeholder="4-digit roll number"
                inputMode="numeric" maxLength={4}
                className="rounded-xl border border-black/10 bg-white px-3 py-2.5 text-sm outline-none focus:border-black" />
              {err && <p className="text-sm font-medium text-red-600">{err}</p>}
              <button onClick={check} disabled={checking}
                className="rounded-xl bg-ink py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-60">
                {checking ? "Checking…" : "View result"}
              </button>
              {!liveExam && <p className="text-xs text-zinc-400">Demo result: Aarav Sharma / 1042</p>}
            </div>
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-3xl border border-black/10 bg-white">
            <div className="bg-ink p-6 text-center text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Marks awarded</p>
              <p className="font-display mt-1 text-5xl font-extrabold tabular-nums">
                {found.marksAwarded}<span className="text-2xl text-white/50">/{found.totalMarks}</span>
              </p>
              <p className="mt-1 text-sm text-white/70">{pct}% · {found.studentName} (Roll {found.rollNo}, {found.college})</p>
            </div>
            <div className="p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Teacher feedback</p>
              <p className="mt-1 text-sm leading-relaxed text-zinc-700">{found.feedback}</p>
              <p className="mt-3 font-mono text-xs text-zinc-400">
                Published {new Date(found.returnedAt).toLocaleString()}
              </p>
              <button onClick={() => { setLookedUp(false); setFound(null); setName(""); setRoll(""); }}
                className="mt-4 w-full rounded-xl border border-black/10 py-2.5 text-sm font-medium transition hover:bg-zinc-50">
                Check another result
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
