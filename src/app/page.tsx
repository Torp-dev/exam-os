import Link from "next/link";
import { fetchAnnouncements, fetchExams } from "@/sanity/queries";
import { getExamStatus } from "@/lib/exams";
import Countdown from "@/components/Countdown";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import Navbar from "@/components/Navbar";

export const revalidate = 30;

const badge: Record<string, string> = {
  upcoming: "bg-amber-100 text-amber-900 border-amber-300",
  live: "bg-green-100 text-green-900 border-green-300",
  closed: "bg-zinc-200 text-zinc-600 border-zinc-300",
};

export default async function Home() {
  const [exams, announcements] = await Promise.all([fetchExams(), fetchAnnouncements()]);
  const now = Date.now();
  const rank = { live: 0, upcoming: 1, closed: 2 } as const;
  const sorted = [...exams].sort(
    (a, b) => rank[getExamStatus(a, now)] - rank[getExamStatus(b, now)]
  );

  return (
    <main className="w-full max-w-full overflow-x-hidden bg-paper text-ink">
      <Navbar />
      <Hero />

      <Marquee />

      <section id="papers" className="mx-auto w-full max-w-6xl px-4 py-32 md:py-48">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display max-w-2xl text-4xl font-extrabold tracking-tight md:text-5xl">
              Exam Status
            </h2>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-black/10 bg-white">
          {sorted.map((e, i) => {
            const st = getExamStatus(e, now);
            const liveNow = st === "live";
            return (
              <div
                key={e.id}
                className={`flex items-center gap-4 p-4 transition hover:bg-zinc-50 sm:p-5 ${i > 0 ? "border-t border-black/10" : ""}`}
              >
                <div className="relative shrink-0">
                  <span className="font-display flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-lg font-extrabold text-white">
                    {e.subject.charAt(0)}
                  </span>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white ${liveNow ? "bg-green-500" : "bg-amber-400"}`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display truncate text-base font-bold sm:text-lg">
                      {e.title}
                    </h3>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase ${badge[st]}`}
                    >
                      {st === "live" ? "ongoing" : st}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-zinc-500">
                    {e.subject} · {e.classSem} · {e.colleges.join(" · ")}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {liveNow ? (
                      <>Closes in <Countdown targetISO={e.closeAt} /> · Ends {new Date(e.closeAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</>
                    ) : st === "closed" ? (
                      e.resultAt && Date.now() > new Date(e.resultAt).getTime() ? (
                        <>Results published {new Date(e.resultAt).toLocaleDateString()}</>
                      ) : (
                        <>Results {e.resultAt ? new Date(e.resultAt).toLocaleDateString() : "soon"}</>
                      )
                    ) : (
                      <>Starts in <Countdown targetISO={e.releaseAt} /> · Starts {new Date(e.releaseAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</>
                    )}
                    <span className="mx-1.5 text-zinc-300">·</span>
                    {e.durationMins} min · {e.totalMarks} marks
                  </p>
                </div>
                <Link
                  href={st === "closed" ? `/results/${e.id}` : `/exam/${e.id}`}
                  className={`shrink-0 rounded-full px-5 py-2 text-sm font-semibold transition ${
                    liveNow || st === "closed"
                      ? "bg-ink text-white hover:bg-zinc-800"
                      : "border border-black/15 text-ink hover:bg-zinc-100"
                  }`}
                >
                  {liveNow ? "Join" : st === "closed" ? "Results" : "View"}
                </Link>
              </div>
            );
          })}
        </div>

      </section>

      <section id="notices" className="bg-ink py-32 text-white md:py-48">
        <div className="mx-auto w-full max-w-5xl px-4">
          <h2 className="font-display mx-auto w-full max-w-4xl text-center text-5xl font-extrabold tracking-tight md:text-7xl">
            Notice Board
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-center text-white/60">
            Exam notices, result announcements, and updates — posted by teachers from Sanity.
          </p>
          {announcements.length === 0 ? (
            <div className="mx-auto mt-10 max-w-2xl rounded-3xl border border-white/15 bg-white/5 p-8 text-center">
              <p className="font-display text-xl font-bold">No notices right now</p>
              <p className="mt-1 text-sm text-white/60">Check back closer to exam week.</p>
            </div>
          ) : (
            <div className="mx-auto mt-10 grid max-w-4xl gap-4 md:grid-cols-2">
              {announcements.map((a) => (
                <div key={a.id} className="rounded-3xl border border-white/15 bg-white/5 p-6 backdrop-blur transition hover:bg-white/10">
                  <p className="font-display text-lg font-bold">{a.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">{a.message}</p>
                  {a.fileUrl && (
                    <a
                      href={a.fileUrl}
                      download
                      className="mt-3 inline-block rounded-full bg-amber-300 px-4 py-1.5 text-xs font-semibold text-black transition hover:bg-amber-200"
                    >
                      Download PDF
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="mt-12 flex items-center justify-center gap-6 text-sm text-white/40">
            <Link href="/" className="transition hover:text-white">Papers</Link>
            <Link href="/results" className="transition hover:text-white">Results</Link>
            <span>Exam Host</span>
          </div>
        </div>
      </section>
    </main>
  );
}
