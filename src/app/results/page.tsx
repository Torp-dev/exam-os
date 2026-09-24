"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { getExamStatus, getExams, type Exam, type ExamResult } from "@/lib/exams";
import { fetchExams } from "@/sanity/queries";

function fmtDT(iso: string) {
  return new Date(iso).toLocaleString([], { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function Results() {
  const [results, setResults] = useState<ExamResult[]>([]);
  const [ready, setReady] = useState(false);
  const [liveExams, setLiveExams] = useState<Exam[]>([]);
  const [examsReady, setExamsReady] = useState(false);

  useEffect(() => {
    fetchExams().then((all) => { setLiveExams(all); setExamsReady(true); }).catch(() => {});
  }, []);

  useEffect(() => {
    const list: ExamResult[] = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("examos:result:")) {
          const raw = localStorage.getItem(k);
          if (raw) list.push(JSON.parse(raw));
        }
      }
    } catch {}
    list.sort((a, b) => +new Date(b.submittedAt) - +new Date(a.submittedAt));
    setResults(list);
    setReady(true);
  }, []);

  const now = Date.now();
  // Live Sanity papers (fetchExams falls back to mocks only when offline).
  const published = examsReady ? liveExams.filter(
    (e) => getExamStatus(e, now) === "closed" && e.resultAt && now > new Date(e.resultAt).getTime()
  ) : [];

  return (
    <main className="w-full max-w-full overflow-x-hidden bg-paper pt-28">
      <Navbar />
      <div className="mx-auto w-full max-w-3xl px-4 pb-24">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Results hall</p>
        <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">
          Check exam results
        </h1>
        <p className="mt-1 text-sm text-zinc-500">Checking happens in Sanity. Marks appear here once your teacher publishes them.</p>

        {published.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Published results</h2>
            <div className="overflow-hidden rounded-3xl border border-black/10 bg-white">
              {published.map((e, i) => (
                <div key={e.id} className={`flex items-center gap-4 p-4 sm:p-5 ${i > 0 ? "border-t border-black/10" : ""}`}>
                  <span className="font-display flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-600 text-lg font-extrabold text-white">
                    {e.subject.charAt(0)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display truncate text-base font-bold">{e.title}</h3>
                    <p className="mt-0.5 truncate text-sm text-zinc-500">
                      {e.subject} · {e.classSem} · Published {e.resultAt ? fmtDT(e.resultAt) : ""}
                    </p>
                  </div>
                  <Link
                    href={`/results/${e.id}`}
                    className="shrink-0 rounded-full bg-ink px-5 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800"
                  >
                    View
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        <h2 className="mb-2 mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Your papers</h2>

        {!ready ? (
          <p className="py-16 text-center text-sm text-zinc-500">Loading your papers…</p>
        ) : results.length === 0 ? (
          <div className="mt-8 rounded-3xl border border-black/10 bg-white p-8 text-center">
            <p className="font-display text-xl font-bold">No exams taken yet</p>
            <p className="mt-1 text-sm text-zinc-500">Your submitted papers will show up here with their result status.</p>
            <Link href="/#papers" className="mt-5 inline-block rounded-full bg-ink px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800">
              Enter the hall
            </Link>
          </div>
        ) : (
          <div className="mt-8 overflow-hidden rounded-3xl border border-black/10 bg-white">
            {results.map((r, i) => {
              const delayed = r.resultAt ? now > new Date(r.resultAt).getTime() : true;
              return (
                <div key={r.examId} className={`flex items-center gap-4 p-4 sm:p-5 ${i > 0 ? "border-t border-black/10" : ""}`}>
                  <span className="font-display flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-ink text-lg font-extrabold text-white">
                    {(r.examTitle || "?").charAt(0)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display truncate text-base font-bold">{r.examTitle || r.examId}</h3>
                    <p className="mt-0.5 truncate text-sm text-zinc-500">
                      {r.studentName} · Roll {r.rollNo}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      Submitted {fmtDT(r.submittedAt)}
                      <span className="mx-1.5 text-zinc-300">·</span>
                      {delayed ? (
                        <span className="font-semibold text-amber-700">Result delayed</span>
                      ) : (
                        <>Results publish {r.resultAt ? fmtDT(r.resultAt) : "soon"}</>
                      )}
                    </p>
                  </div>
                  <Link
                    href={`/done?id=${r.examId}`}
                    className="shrink-0 rounded-full border border-black/15 px-5 py-2 text-sm font-semibold text-ink transition hover:bg-zinc-100"
                  >
                    View
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
