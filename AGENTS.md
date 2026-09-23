# AGENTS.md — Exam Hoster (Sanity Challenge Path Two)

## 1. What we are building
Exam hosting site for colleges/universities.
- Teachers use Sanity Studio to create + schedule exam papers, synced across colleges.
- Students open Next.js site on their PC, see countdown, solve on time.
- When time passes, site auto-submits + locks answers.
- Challenge: https://dev.to/challenges/sanity-2026-09-16 — Path Two: Vibe-Code Something Strange
- Due: Oct 4, 2026 11:59pm PDT. Stack: Next.js (App Router) + Sanity behind it.

## 2. How Sanity helps (mental model)
- Sanity = Content Lake (JSON docs) + Schemas (TS) + Studio (wife/teacher UI, no code) + GROQ queries + Scheduling/Releases + Workflows.
- Not just photo posting. Structured data lets code reason: countdown from `releaseAt`, timer from `durationMins`, filters by `colleges[]`, auto-check from `correctAnswer`.
- Teacher flow: Studio -> Publish -> Next.js reads live, no redeploy.

## 3. Schemas (planned)
- `exam`: title, slug, subject, class/sem, colleges[string[]], releaseAt[datetime], closeAt[datetime], durationMins[number], totalMarks[number], status[draft|approved|scheduled|live|closed], instructions[text]
- `question`: exam[reference->exam], number[number], type[mcq|short|long], questionText[text], options[string[]] (mcq only), correctAnswer[string], marks[number]
- `submission`: exam[reference->exam], studentName[string], rollNo[string], college[string], answers[{questionNo, answer}][array], submittedAt[datetime], score[number?], status[submitted|checked|returned]
- `announcement` (optional): title, message, showUntil[datetime]

Key GROQ:
- List exams: `*[_type=="exam"]|order(releaseAt desc)`
- Paper sync: `*[_type=="question" && exam._ref==$examId]|order(number asc)`

## 4. Must-have checklist
### A. Sanity backend (judges open this)
- [x] Schemas exam, question, submission (+announcement) created in `src/sanity/schemas/`
- [x] Sanity client + GROQ queries with mock fallback (`src/sanity/client.ts`, `queries.ts`)
- [x] Embedded Studio route `/studio` (`sanity.config.ts` + `src/app/studio/[[...tool]]/page.tsx`)
- [x] Submit API stores `submission` docs when write token set (`src/app/api/submit/route.ts`)
- [ ] Sanity account + project created, projectId noted — USER ACTION (sanity.io → project `exam-os`)
- [ ] projectId plugged into `.env.local` (from `.env.local.example`)
- [ ] Dataset `production` public read + 1 real exam + 8-10 questions in Studio
- [ ] CORS for Vercel URL + localhost:3000
- [ ] SANITY_WRITE_TOKEN (Editor) for submissions
- [ ] Studio screenshots for DEV post

### B. Next.js app (student side)
- [ ] `/` list exams: upcoming/live/closed by releaseAt/closeAt
- [ ] `/exam/[id]` countdown if now<releaseAt else Start
- [ ] Exam page: questions in order, MCQ radio + textarea, timer from durationMins
- [ ] Auto-submit at 0:00 + manual submit -> create submission doc
- [ ] `/done` confirmation with submittedAt
- [ ] Responsive

### C. Teacher side (Studio only for MVP)
- [ ] Create exam as draft in Studio
- [ ] Move workflow draft->approved->scheduled->live->closed
- [ ] View submissions table

### D. Bonus (pick ONE)
- [ ] Show workflow transitions with screenshots
- [ ] Custom input: marks auto-sum or MCQ answer picker

### E. DEV submission
- [ ] Public GitHub repo + README
- [ ] Vercel deploy live
- [ ] 90-sec demo video (countdown->start->timer->auto-submit)
- [ ] DEV post tags: devchallenge, sanitychallenge, sanity, ai + projectId + dataset URL + prompts writeup
- [ ] Test creds if login added, else keep open

Build order: A -> B -> E. Workflow status is 10 min, high value.

## 5. Judging (Path Two) — what to show
1. Build writeup honesty: AI IDE used, 5-6 real prompts worked/failed, where stuck + fix. Rough+honest > polished+3 lines.
2. Functionality: live Vercel link, no-login student flow for judges.
3. Thoughtful schema: not title/body blog. Show references, scheduling, quiz as data.
4. Creativity: strange niche (exams, not store/blog) + 1 workflow.

## 6. Prompts log (fill as we build)
- Prompt 1: "create next js project + save plan to AGENTS.md" — worked (scaffold ok, slow npm).
- Prompt 2: "list 15 must-haves, build Exam Host fully functional on mock first" — worked, build passes.
- Prompt 3: "setup sanity per docs + AGENTS.md" — code done, `npm i next-sanity sanity` very slow on this box (~15+ min, backgrounded).
- What broke + fix:
  - Turbopack build fails on android/arm64 (no native bindings) → `next build/dev --webpack`.
  - Tailwind v4 fails (no lightningcss android-arm64 binary) → downgraded to tailwindcss@3 + autoprefixer + tailwind.config.js, dropped next/font/Geist.
  - `/done` useSearchParams needs Suspense boundary → wrapped DoneInner in Suspense.

## 7. Next steps for agent [scaffold DONE Sep 23: exam-os exists, Next 16.3.6 + Tailwind 4]
1. ~~Scaffold Next.js + `npx sanity@latest init` in `./exam-os`~~ DONE (Next.js only)
2. Add sanity client + schemas above to `sanity/schemas/`
3. Seed 1 demo exam
4. Build `/`, `/exam/[id]`, timer + submit
5. Deploy + draft DEV post

Stack notes: Next.js App Router, sanity client `next-sanity`, GROQ, Vercel.

## 8. Build log (Sep 23)
- exam-os scaffolded: Next 16.3.6 + Tailwind (downgraded v4->v3: no android-arm64 lightningcss binary) + `--webpack` builds (no Turbopack native bindings on this box). System fonts (dropped next/font/Geist).
- UI-first MVP DONE with mock data (`src/lib/exams.ts` mirrors future Sanity docs): `/`, `/exam/[id]`, `/exam/[id]/take`, `/done`. Build passes.
- Sanity code DONE (schemas, client, GROQ+fallback, /studio, /api/submit). `npm i next-sanity sanity` backgrounded (slow box). Awaiting projectId from user.
- Repo: https://github.com/Torp-dev/exam-os (public, pushed Sep 23).
- MISTAKE LOG Sep 23: rewired pages to `@/sanity/queries` (next-sanity imports) BEFORE packages installed; install then failed with ETIMEDOUT network error. Result: student pages + /studio broken until `next-sanity`+`sanity` land. Lesson: verify install + build before claiming done. Retry running with fetch-retries.
