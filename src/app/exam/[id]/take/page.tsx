"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchExams, fetchQuestions } from "@/sanity/queries";
import { type Answer, type Exam, type Question } from "@/lib/exams";

const key = (id: string) => `examos:answers:${id}`;

function mmss(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export default function TakeExam() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [ready, setReady] = useState(false);

  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<number[]>([]);
  const [current, setCurrent] = useState(0);
  const [left, setLeft] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const done = useRef(false);
  const timeUpShown = useRef(false);

  useEffect(() => {
    (async () => {
      const exams = await fetchExams();
      const found = exams.find((e) => e.id === id) ?? null;
      setExam(found);
      if (found) {
        setQuestions(await fetchQuestions(found.id));
        setLeft(found.durationMins * 60);
      }
      try {
        const raw = localStorage.getItem(key(id as string));
        if (raw) setAnswers(JSON.parse(raw));
      } catch {}
      setReady(true);
    })();
  }, [id]);

  useEffect(() => {
    if (ready) localStorage.setItem(key(id as string), JSON.stringify(answers));
  }, [answers, id, ready]);

  const submit = useCallback((auto: boolean) => {
    if (done.current || !exam) return;
    done.current = true;
    const list: Answer[] = questions.map((q) => ({ questionNo: q.number, answer: answers[q.number] ?? "" }));
    const ident = (() => { try { return JSON.parse(localStorage.getItem("examos:identity") || "{}"); } catch { return {}; } })();
    // No scores here: checking + results happen in Sanity Studio. This payload is just the answers.
    const result = {
      examId: exam.id, examTitle: exam.title, resultAt: exam.resultAt ?? null,
      studentName: ident.name || "Student", rollNo: ident.rollNo || "—",
      college: ident.college || "—", answers: list, submittedAt: new Date().toISOString(),
      autoSubmitted: auto,
    };
    localStorage.setItem(`examos:result:${exam.id}`, JSON.stringify(result));
    localStorage.removeItem(key(exam.id));
    fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...result }),
    }).catch(() => {});
    router.push(`/done?id=${exam.id}${auto ? "&auto=1" : ""}`);
  }, [answers, exam, questions, router]);

  // countdown — at 0:00 show the Time's UP card; OK submits.
  useEffect(() => {
    if (!ready || !exam) return;
    if (left <= 0) {
      if (!timeUpShown.current) { timeUpShown.current = true; setTimeUp(true); }
      return;
    }
    const t = setInterval(() => setLeft((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(t);
  }, [left, ready, exam]);

  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, []);

  const q = questions[current];
  const status = useMemo(() => getPaperStatus(exam), [exam]);

  if (!ready) {
    return <main className="mx-auto max-w-2xl px-4 py-32 text-center text-sm text-zinc-500">Loading paper…</main>;
  }

  if (!exam || questions.length === 0 || !q || status !== "live") {
    return (
      <main className="mx-auto max-w-2xl px-4 py-32 text-center">
        <p className="font-display text-xl font-bold">Paper not available right now.</p>
        <Link href="/" className="mt-2 inline-block text-sm font-medium underline">Back</Link>
      </main>
    );
  }

  const answered = questions.filter((x) => (answers[x.number] || "").trim() !== "").length;
  const unanswered = questions.length - answered;
  const urgent = left < 300;

  const toggleFlag = () => setFlagged((f) => f.includes(q.number) ? f.filter((n) => n !== q.number) : [...f, q.number]);
  const fullscreen = () => { document.documentElement.requestFullscreen?.().catch(() => {}); };

  return (
    <main className="w-full max-w-full overflow-x-hidden bg-paper pt-3">
      <div className={`sticky top-0 z-30 mb-2 border-b px-4 py-2 backdrop-blur-xl ${urgent ? "border-red-200 bg-red-50/95" : "border-black/10 bg-white/90"}`}>
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
          <span className="truncate text-sm font-semibold">{exam.title}</span>
          <div className="flex items-center gap-2">
            <button onClick={fullscreen} className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-medium transition hover:bg-zinc-100">Fullscreen</button>
            <span className={`rounded-full px-4 py-1.5 font-mono text-lg font-bold tabular-nums ${urgent ? "bg-red-600 text-white" : "bg-ink text-white"}`}>
              {mmss(left)}
            </span>
            <button onClick={() => setConfirming(true)} className="rounded-full bg-green-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-green-700">
              Submit
            </button>
          </div>
        </div>
        <div className="mx-auto mt-1.5 w-full max-w-5xl">
          <div className="h-1.5 rounded-full bg-zinc-200">
            <div className="h-1.5 rounded-full bg-green-600 transition-all" style={{ width: `${(answered / questions.length) * 100}%` }} />
          </div>
          <p className="mt-1 text-xs text-zinc-500">{answered}/{questions.length} answered · autosaved</p>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 pb-8 pt-8 md:grid-cols-[1fr_230px]">
        <section className="rounded-3xl border border-black/10 bg-white p-6 md:p-8">
          <div className="mb-1 flex items-center justify-between text-xs text-zinc-500">
            <span>Question {q.number} of {questions.length} · {q.marks} marks · {q.type.toUpperCase()}</span>
            <button onClick={toggleFlag} className={`rounded-full border px-3 py-1 text-xs font-medium transition ${flagged.includes(q.number) ? "border-amber-400 bg-amber-100 text-amber-900" : "border-black/10 hover:bg-zinc-50"}`}>
              {flagged.includes(q.number) ? "Flagged" : "Flag"}
            </button>
          </div>
          <h2 className="font-display mt-2 text-xl font-bold leading-snug">{q.questionText}</h2>

          {q.type === "mcq" ? (
            <div className="mt-4 grid gap-2">
              {(q.options ?? []).map((op) => (
                <label key={op} className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition ${answers[q.number] === op ? "border-ink bg-zinc-50 font-medium" : "border-black/10 hover:bg-zinc-50"}`}>
                  <input type="radio" name={`q${q.number}`} checked={answers[q.number] === op}
                    onChange={() => setAnswers((a) => ({ ...a, [q.number]: op }))} />
                  {op}
                </label>
              ))}
              {answers[q.number] && (
                <button onClick={() => setAnswers((a) => { const n = { ...a }; delete n[q.number]; return n; })}
                  className="w-fit text-xs text-zinc-500 underline">Clear response</button>
              )}
            </div>
          ) : (
            <textarea value={answers[q.number] ?? ""} rows={q.type === "long" ? 8 : 4}
              onChange={(e) => setAnswers((a) => ({ ...a, [q.number]: e.target.value }))}
              placeholder={q.type === "long" ? "Write 150–200 words…" : "Write 2–3 lines…"}
              className="mt-4 w-full rounded-2xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-black" />
          )}

          <div className="mt-6 flex justify-between">
            <button disabled={current === 0} onClick={() => setCurrent((c) => c - 1)}
              className="rounded-full border border-black/10 px-5 py-2 text-sm font-medium disabled:opacity-40">Prev</button>
            {current < questions.length - 1 ? (
              <button onClick={() => setCurrent((c) => c + 1)} className="rounded-full bg-ink px-5 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800">Next</button>
            ) : (
              <button onClick={() => setConfirming(true)} className="rounded-full bg-green-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-green-700">Review and submit</button>
            )}
          </div>
        </section>

        <aside className="h-fit rounded-3xl border border-black/10 bg-white p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">Palette</p>
          <div className="grid grid-cols-5 gap-1.5">
            {questions.map((x, i) => {
              const ans = (answers[x.number] || "").trim() !== "";
              const fl = flagged.includes(x.number);
              return (
                <button key={x.id} onClick={() => setCurrent(i)}
                  className={`h-9 rounded-xl text-sm font-semibold transition ${i === current ? "ring-2 ring-ink" : ""} ${ans ? "bg-green-600 text-white" : fl ? "bg-amber-300 text-black" : "bg-zinc-200 text-zinc-700"}`}>
                  {x.number}
                </button>
              );
            })}
          </div>
          <div className="mt-3 space-y-1 text-xs text-zinc-500">
            <p><span className="mr-1.5 inline-block h-2.5 w-2.5 rounded bg-green-600" /> Answered ({answered})</p>
            <p><span className="mr-1.5 inline-block h-2.5 w-2.5 rounded bg-zinc-300" /> Unanswered ({unanswered})</p>
            <p><span className="mr-1.5 inline-block h-2.5 w-2.5 rounded bg-amber-300" /> Flagged ({flagged.length})</p>
          </div>
        </aside>
      </div>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6">
            <h3 className="font-display text-xl font-bold">Submit exam?</h3>
            <p className="mt-1 text-sm text-zinc-600">
              {answered} answered · {unanswered} unanswered · {flagged.length} flagged.
              {unanswered > 0 ? " Unanswered get zero." : " All attempted."}
            </p>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setConfirming(false)} className="flex-1 rounded-full border border-black/10 py-2.5 text-sm font-medium transition hover:bg-zinc-50">Keep solving</button>
              <button onClick={() => submit(false)} className="flex-1 rounded-full bg-green-600 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700">Submit now</button>
            </div>
          </div>
        </div>
      )}

      {timeUp && !done.current && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center">
            <p className="font-mono text-sm font-bold tabular-nums text-red-600">00:00</p>
            <h3 className="font-display mt-1 text-2xl font-extrabold">Time&apos;s UP</h3>
            <p className="mt-1 text-sm text-zinc-600">
              {answered} answered · {unanswered} unanswered. Your answers are locked — press OK to submit.
            </p>
            <button onClick={() => submit(true)} className="mt-5 w-full rounded-full bg-ink py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800">
              OK — submit paper
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function getPaperStatus(exam: Exam | null): "upcoming" | "live" | "closed" {
  if (!exam) return "closed";
  const now = Date.now();
  if (now < new Date(exam.releaseAt).getTime()) return "upcoming";
  if (now > new Date(exam.closeAt).getTime()) return "closed";
  return "live";
}
