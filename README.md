# Exam Host — an exam hosting platform powered by Sanity

One paper, every college, same second. Teachers publish exam papers in Sanity.
Students open the paper on any campus PC, write against one shared timer, and get
auto-submitted at zero.

Built for the DEV Sanity Challenge 2026 (Path Two: Vibe-Code Something Strange).

## Live links

- Student site: https://exam-os-delta.vercel.app/
- Teacher Studio (hosted): https://exam-os-studio.sanity.studio/
- Sanity project: `vju5fidf` · dataset `production` (public read)

## How it works

**Students (no login):** open the site → Join a live paper → enter name + 4-digit
roll (college auto-detected from first digit) → write against the exact
`durationMins` timer → auto-submit at zero → confirmation receipt on `/done` →
marks appear under `/results` after `resultAt`.

**Teachers (Sanity Studio):** create exam + questions + notices → publish →
every college PC sees it together, no redeploy. Check submissions in Studio:
`submitted → checking → checked` (fill `marksAwarded` + `feedback`) → `returned`
at `resultAt`. Review happens in Sanity, never on the student screen.

## Sanity behind it

- **Content Lake:** every exam, question, submission, announcement is a JSON
  document in dataset `production`. Publish once, all colleges read the same docs.
- **Schemas** (`src/sanity/schemas/`): `exam` (slug, subject, colleges,
  `releaseAt`/`closeAt`/`resultAt`, `durationMins`, `status`), `question`
  (`reference → exam`, mcq/short/long, `options[]`, `correctAnswer`, marks),
  `submission` (`reference → exam`, answers, `marksAwarded`, 4-state status,
  `feedback`), `announcement` (`showFrom`/`showUntil` window + PDF attachment).
- **GROQ** (`src/sanity/queries.ts`): exam list ordered by `releaseAt`; paper
  sync joins `exam->slug` and deliberately omits `correctAnswer` so students
  never receive it; notices filtered to their visible window. Mock fallback in
  `src/lib/exams.ts` keeps the demo alive offline.
- **Writes:** `/api/submit` creates `submission` docs via the Mutations API
  with a server-only `SANITY_WRITE_TOKEN`.

Inspect the data (no login needed):

- Papers: `https://vju5fidf.api.sanity.io/v2025-09-01/data/query/production?query=*[_type=="exam"]|order(releaseAt desc){title,subject,releaseAt,closeAt,status}`
- Judge-demo questions: append `?query=*[_type=="question" && exam->slug.current=="judge-demo-gk"]|order(number asc){number,type,questionText,options,marks}`

## Run locally

```bash
npm install
cp .env.local.example .env.local   # fill in project ID + Editor write token
npm run dev -- --webpack           # http://localhost:3000 (this box needs --webpack)
```

Studio:

```bash
cd studio
npm install
npm run dev                        # http://localhost:3333
npm run deploy                     # https://exam-os-studio.sanity.studio/
```

Seed / reset demo data (needs CLI login):

```bash
cd studio
npx sanity exec seed.mjs --with-user-token          # 3 upcoming exams + questions
npx sanity exec seed-live.mjs --with-user-token     # always-live judge demo paper
npx sanity exec seed-notices.mjs --with-user-token  # visible + scheduled notices
```

## Environment variables

| Key | Where | Value |
| --- | --- | --- |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Vercel + local | `vju5fidf` |
| `NEXT_PUBLIC_SANITY_DATASET` | Vercel + local | `production` |
| `NEXT_PUBLIC_SANITY_API_VERSION` | Vercel + local | `2025-09-01` |
| `SANITY_WRITE_TOKEN` | server-only, never commit | Editor-role token |

## Routes

`/` papers + notice board · `/exam/[id]` countdown + entry · `/exam/[id]/take`
timed paper · `/done` receipt (no scores) · `/results` hall + `/results/[id]`
marks lookup · `/api/submit` write path.

## Notes

- Stack: Next.js App Router (webpack builds on this box), `next-sanity` +
  `sanity` 6.16.0, Tailwind v3, GSAP.
- See `AGENTS.md` for the full build log, prompts log, and remaining
  submission checklist (demo video, DEV post, workflow screenshots).
