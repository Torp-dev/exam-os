"use client";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getExams, type ExamResult } from "@/lib/exams";
import Navbar from "@/components/Navbar";

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
  // Retry delivery to Sanity: first submit may have happened before the
  // write token existed (local-only). Reopening this receipt re-sends it.
  const retried = useRef(false);
  const [delivery, setDelivery] = useState<string | null>(null);
  useEffect(() => {
    if (!result || retried.current) return;
    retried.current = true;
    fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...result }),
    })
      .then((r) => r.json())
      .then((j) => setDelivery(j.stored === "sanity" ? "sanity" : "local"))
      .catch(() => {});
  }, [result]);

  if (!exam || !result) {
    return (
      <main className="mx-auto max-w-xl px-4 py-32 text-center">
        <p className="font-display text-xl font-bold">No submission found.</p>
        <Link href="/" className="mt-2 inline-block text-sm font-medium underline">Back to exams</Link>
      </main>
    );
  }

  const attempted = result.answers.filter((a) => a.answer.trim()).length;
  const total = result.answers.length;
  const resultAt = exam.resultAt ?? result.resultAt;
  const delayed = resultAt ? Date.now() > new Date(resultAt).getTime() : false;

  return (
    <main className="w-full max-w-full overflow-x-hidden bg-paper pt-28">
      <Navbar />
      <div className="mx-auto w-full max-w-2xl px-4 pb-24">
        <div className="rounded-3xl border border-black/10 bg-white">
          <div className="p-6 text-center md:p-8">
            <span className={`inline-block rounded-full border px-3 py-1 text-xs font-semibold uppercase ${auto ? "border-red-300 bg-red-50 text-red-700" : "border-green-300 bg-green-50 text-green-800"}`}>
              {auto ? "Auto-submitted" : "Submitted"}
            </span>
            <h1 className="font-display mt-3 text-3xl font-extrabold tracking-tight">
              Answers locked
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              {exam.title} · {result.studentName} ({result.rollNo}, {result.college})
            </p>
            <p className="mt-1 font-mono text-xs text-zinc-400">
              Submitted at {new Date(result.submittedAt).toLocaleString()}
              {delivery === "sanity" ? " · saved to Sanity" : delivery === "local" ? " · saved on this device" : ""}
            </p>
            {auto && <p className="mt-2 text-sm font-medium text-red-600">Time ran out at 0:00 — the site took your answers automatically.</p>}

            <div className="mx-auto mt-5 grid max-w-md grid-cols-2 gap-2">
              <div className="rounded-2xl bg-paper p-3">
                <p className="font-display text-xl font-extrabold">{attempted}/{total}</p>
                <p className="text-xs text-zinc-500">Questions attempted</p>
              </div>
              <div className="rounded-2xl bg-paper p-3">
                <p className="font-display text-lg font-extrabold">
                  {delayed ? "Delayed" : resultAt ? new Date(resultAt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Later"}
                </p>
                <p className="text-xs text-zinc-500">Results publish at</p>
              </div>
            </div>

            <p className="mx-auto mt-5 max-w-md text-sm leading-relaxed text-zinc-600">
              Your paper is now with your teacher. Checking, marks, and results all
              happen in Sanity — nothing is scored on this screen.
              {delayed
                ? " Results were expected by now — checking is taking longer. Status: result delayed."
                : resultAt
                  ? ` Results publish on ${new Date(resultAt).toLocaleString()}.`
                  : " Your college will announce the results date."}
            </p>
            <Link href="/results" className="mt-4 inline-block text-sm font-medium underline">Track this in results hall</Link>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="inline-block rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800">Back to exams</Link>
        </div>
      </div>
    </main>
  );
}

export default function Done() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-xl px-4 py-32 text-center text-sm text-zinc-500">Loading result…</main>}>
      <DoneInner />
    </Suspense>
  );
}
