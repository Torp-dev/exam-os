"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchExams, fetchQuestions } from "@/sanity/queries";
import { scoreMcq, type Answer, type Exam, type Question } from "@/lib/exams";

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
  const done = useRef(false);

  // load paper (Sanity live, mock fallback) + restore autosaved answers
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

  // autosave
  useEffect(() => {
    if (ready) localStorage.setItem(key(id as string), JSON.stringify(answers));
  }, [answers, id, ready]);

  const submit = useCallback((auto: boolean) => {
    if (done.current || !exam) return;
    done.current = true;
    const list: Answer[] = questions.map((q) => ({ questionNo: q.number, answer: answers[q.number] ?? "" }));
    const { scored } = scoreMcq(questions, list);
    const ident = (() => { try { return JSON.parse(localStorage.getItem("examos:identity") || "{}"); } catch { return {}; } })();
    const result = {
      examId: exam.id, studentName: ident.name || "Student", rollNo: ident.rollNo || "—",
      college: ident.college || "—", answers: list, submittedAt: new Date().toISOString(),
      autoScore: scored,
      mcqMax: questions.filter((q) => q.type === "mcq").reduce((s, q) => s + q.marks, 0),
      totalMarks: exam.totalMarks, autoSubmitted: auto,
    };
    localStorage.setItem(`examos:result:${exam.id}`, JSON.stringify(result));
    localStorage.removeItem(key(exam.id));
    // also store in Sanity when configured (fire-and-forget — local copy is the source of truth for /done)
    fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...result }),
    }).catch(() => {});
    router.push(`/done?id=${exam.id}${auto ? "&auto=1" : ""}`);
  }, [answers, exam, questions, router]);

  // countdown + auto-submit at 0:00
  useEffect(() => {
    if (!ready || !exam) return;
    if (left <= 0) { submit(true); return; }
    const t = setInterval(() => setLeft((v) => v - 1), 1000);
    return () => clearInterval(t);
  }, [left, submit, ready, exam]);

  // warn on accidental exit
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, []);

  const q = questions[current];
  const status = useMemo(() => getPaperStatus(exam), [exam]);

  if (!ready) {
    return <main className="mx-auto max-w-2xl px-4 py-16 text-center text-sm text-zinc-500">Loading paper…</main>;
  }

  if (!exam || questions.length === 0 || !q || status !== "live") {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="font-semibold">Paper not available right now.</p>
        <Link href="/" className="text-blue-600 underline">Back</Link>
      </main>
    );
  }

  const answered = questions.filter((x) => (answers[x.number] || "").trim() !== "").length;
  const unanswered = questions.length - answered;
  const urgent = left < 300;

  const toggleFlag = () => setFlagged((f) => f.includes(q.number) ? f.filter((n) => n !== q.number) : [...f, q.number]);
  const fullscreen = () => { document.documentElement.requestFullscreen?.().catch(() => {}); };

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-4">
      <div className={`sticky top-0 z-10 -mx-4 mb-4 border-b px-4 py-2 backdrop-blur ${urgent ? "bg-red-50 border-red-200" : "bg-white/90"}`}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{exam.title}</span>
          <div className="flex items-center gap-2">
            <button onClick={fullscreen} className="rounded-lg border px-2 py-1 text-xs">⛶ Fullscreen</button>
            <span className={`rounded-lg px-3 py-1 font-mono text-lg font-bold ${urgent ? "bg-red-600 text-white" : "bg-black text-white"}`}>
              {mmss(left)}
            </span>
            <button onClick={() => setConfirming(true)} className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white">
              Submit
            </button>
          </div>
        </div>
        <div className="mt-1 h-1.5 rounded bg-zinc-200">
          <div className="h-1.5 rounded bg-green-600 transition-all" style={{ width: `${(answered / questions.length) * 100}%` }} />
        </div>
        <p className="mt-0.5 text-xs text-zinc-500">{answered}/{questions.length} answered · autosaved ✓</p>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_220px]">
        <section className="rounded-2xl border bg-white p-5">
          <div className="mb-1 flex items-center justify-between text-xs text-zinc-500">
            <span>Question {q.number} of {questions.length} · {q.marks} marks · {q.type.toUpperCase()}</span>
            <button onClick={toggleFlag} className={`rounded-full border px-2 py-0.5 ${flagged.includes(q.number) ? "border-amber-400 bg-amber-100 text-amber-800" : ""}`}>
              {flagged.includes(q.number) ? "★ Flagged" : "☆ Flag"}
            </button>
          </div>
          <h2 className="text-lg font-semibold">{q.questionText}</h2>

          {q.type === "mcq" ? (
            <div className="mt-3 grid gap-2">
              {(q.options ?? []).map((op) => (
                <label key={op} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${answers[q.number] === op ? "border-black bg-zinc-50 font-medium" : "hover:bg-zinc-50"}`}>
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
              className="mt-3 w-full rounded-xl border px-3 py-2 text-sm" />
          )}

          <div className="mt-4 flex justify-between">
            <button disabled={current === 0} onClick={() => setCurrent((c) => c - 1)}
              className="rounded-lg border px-4 py-1.5 text-sm disabled:opacity-40">← Prev</button>
            {current < questions.length - 1 ? (
              <button onClick={() => setCurrent((c) => c + 1)} className="rounded-lg bg-black px-4 py-1.5 text-sm font-medium text-white">Next →</button>
            ) : (
              <button onClick={() => setConfirming(true)} className="rounded-lg bg-green-600 px-4 py-1.5 text-sm font-semibold text-white">Review & Submit</button>
            )}
          </div>
        </section>

        <aside className="h-fit rounded-2xl border bg-white p-4">
          <p className="mb-2 text-xs font-semibold text-zinc-500">QUESTION PALETTE</p>
          <div className="grid grid-cols-5 gap-1.5">
            {questions.map((x, i) => {
              const ans = (answers[x.number] || "").trim() !== "";
              const fl = flagged.includes(x.number);
              return (
                <button key={x.id} onClick={() => setCurrent(i)}
                  className={`h-9 rounded-lg text-sm font-semibold ${i === current ? "ring-2 ring-black" : ""} ${ans ? "bg-green-600 text-white" : fl ? "bg-amber-400 text-black" : "bg-zinc-200"}`}>
                  {x.number}
                </button>
              );
            })}
          </div>
          <div className="mt-2 space-y-0.5 text-xs text-zinc-500">
            <p><span className="mr-1 inline-block h-2.5 w-2.5 rounded bg-green-600" /> Answered ({answered})</p>
            <p><span className="mr-1 inline-block h-2.5 w-2.5 rounded bg-zinc-300" /> Unanswered ({unanswered})</p>
            <p><span className="mr-1 inline-block h-2.5 w-2.5 rounded bg-amber-400" /> Flagged ({flagged.length})</p>
          </div>
        </aside>
      </div>

      {confirming && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5">
            <h3 className="text-lg font-bold">Submit exam?</h3>
            <p className="mt-1 text-sm text-zinc-600">
              {answered} answered · {unanswered} unanswered · {flagged.length} flagged.
              {unanswered > 0 ? " Unanswered get zero." : " All attempted — nice."}
            </p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setConfirming(false)} className="flex-1 rounded-lg border py-2 text-sm">Keep solving</button>
              <button onClick={() => submit(false)} className="flex-1 rounded-lg bg-green-600 py-2 text-sm font-semibold text-white">Submit now</button>
            </div>
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
