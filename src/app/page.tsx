import Link from "next/link";
import { fetchAnnouncements, fetchExams } from "@/sanity/queries";
import { getExamStatus } from "@/lib/exams";
import Countdown from "@/components/Countdown";

export const revalidate = 30;

const badge: Record<string, string> = {
  upcoming: "bg-amber-100 text-amber-800 border-amber-300",
  live: "bg-green-100 text-green-800 border-green-300",
  closed: "bg-zinc-200 text-zinc-600 border-zinc-300",
};

export default async function Home() {
  const [exams, announcements] = await Promise.all([fetchExams(), fetchAnnouncements()]);
  const now = Date.now();
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Exam Host</h1>
          <p className="text-sm text-zinc-500">College exam papers, synced across colleges. One clock, every PC.</p>
        </div>
        <span className="rounded-full border px-3 py-1 text-xs font-medium text-zinc-500">
          {process.env.NEXT_PUBLIC_SANITY_PROJECT_ID &&
          process.env.NEXT_PUBLIC_SANITY_PROJECT_ID !== "YOUR_PROJECT_ID"
            ? "Sanity · live"
            : "Demo · mock data"}
        </span>
      </header>

      {announcements.map((a) => (
        <div key={a.id} className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm">
          <p className="font-semibold text-blue-900">📢 {a.title}</p>
          <p className="text-blue-800">{a.message}</p>
        </div>
      ))}

      <div className="grid gap-4 md:grid-cols-2">
        {exams.map((e) => {
          const st = getExamStatus(e, now);
          return (
            <Link key={e.id} href={`/exam/${e.id}`}
              className="rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md">
              <div className="mb-2 flex items-center justify-between">
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase ${badge[st]}`}>{st}</span>
                <span className="text-xs text-zinc-500">{e.subject} · {e.classSem}</span>
              </div>
              <h2 className="text-lg font-semibold leading-snug">{e.title}</h2>
              <p className="mt-1 text-xs text-zinc-500">{e.colleges.join(" · ")}</p>
              <div className="mt-3 flex items-center justify-between text-sm">
                <span className="text-zinc-600">
                  {st === "upcoming" && <>Starts in <Countdown targetISO={e.releaseAt} /></>}
                  {st === "live" && <>Closes in <Countdown targetISO={e.closeAt} /></>}
                  {st === "closed" && <>Closed</>}
                </span>
                <span className="font-medium text-zinc-900">{e.durationMins} min · {e.totalMarks} marks</span>
              </div>
            </Link>
          );
        })}
      </div>

      <footer className="mt-8 text-center text-xs text-zinc-400">
        Teacher? Manage papers in <Link href="/studio" className="underline">Sanity Studio</Link>.
      </footer>
    </main>
  );
}
