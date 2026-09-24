# AGENTS.md — Exam Hoster (Sanity Challenge Path Two)

## 1. What we are building
Exam hosting site for colleges/universities.
- Teachers use Sanity Studio to create + schedule exam papers, synced across colleges.
- Students open Next.js site on their PC, see countdown, solve on time.
- When time passes, site auto-submits + locks answers.
- Challenge: https://dev.to/challenges/sanity-2026-09-16 — Path Two: Vibe-Code Something Strange
- Due: Oct 4, 2026 11:59pm PDT. Stack: Next.js (App Router) + Sanity behind it.

## 2. How Sanity helps (mental model, per sanity.io/docs)
- Sanity is a Content Operating System: Content Lake (real-time JSON document store) + Schemas (TS content model) + Studio (collaborative editing workbench) + GROQ (query language) + Releases/Perspectives (scheduling + preview) + Mutations API (writes). Docs index: https://www.sanity.io/docs
- Content Lake stores each exam, question, submission, announcement as a JSON document in a dataset (`production`). The lake itself is schema-less; schemas sit on top and generate forms + validation. Teachers publish once, every college PC reads the same docs — no redeploy. (https://www.sanity.io/docs/content-lake)
- Schemas are `defineType`/`defineField` TS objects that declare the content model and auto-generate the Studio editing UI. Ours maps 1:1: `exam` (document with datetime/string/number/array/slug fields), `question` (with `reference` -> exam + `options` array), `submission` (reference -> exam + answers array of objects), `announcement`. References + validation are what make this "thoughtful schema", not a title/body blog. (https://www.sanity.io/docs/apis-and-sdks/introduction-to-schemas)
- Studio is the hosted workbench where teachers (no code) create papers, attach questions, and move status draft->approved->scheduled->live->closed. It supports real-time collaboration, comments, and Tasks (assign review to a colleague, Growth plan). Decision Sep 24: teachers use hosted Studio at sanity.io/manage, NOT an embedded `/studio` route — removed from this site. (https://www.sanity.io/docs/studio, https://www.sanity.io/docs/studio/tasks)
- GROQ is a pipeline query language: `*` + filter `[...]` + projection `{...}` + `| order()` + slice. It joins references with `->` and reshapes data at the API level, so frontend gets exactly what it needs. Our two load-bearing queries: list exams `*[_type=="exam"]|order(releaseAt desc)` and paper sync `*[_type=="question" && exam->slug.current==$examId]|order(number asc)` — the second dereferences the exam and deliberately OMITS `correctAnswer` so students never see it. (https://www.sanity.io/docs/content-lake/groq-introduction)
- Releases + Perspectives + drafts model = scheduling done right. Content Releases bundle multi-doc changes (exam + 10 questions) and publish/schedule them together; Perspectives (`published` vs `drafts` vs release stack) let the same query return student-safe published docs in production while teachers preview drafts. Our `releaseAt`/`closeAt` datetimes + `status` field are the app-level clock on top of this: countdown from `releaseAt`, lock after `closeAt`, timer from `durationMins`. (https://www.sanity.io/docs/studio/content-releases-configuration, https://www.sanity.io/docs/content-lake/perspectives)
- Freshness + writes: student reads use `useCdn:false` + `revalidate:30` (never serve a stale paper; Live Content API exists for real-time needs). Submissions write back via the Mutations API (`client.create` with `SANITY_WRITE_TOKEN`) through `/api/submit`; GROQ webhooks/functions could later auto-grade or notify. (https://www.sanity.io/docs/content-lake, https://www.sanity.io/docs/content-lake/mutations-introduction)
- Not just photo posting. Structured data lets code reason: countdown from `releaseAt`, timer from `durationMins`, filters by `colleges[]`, auto-check from `correctAnswer` (server-side only).
- Teacher flow: hosted Studio -> Publish/Release -> Next.js (`next-sanity` fetch) reads live, no redeploy.

## 3. Schemas (planned)
- `exam`: title, slug, subject, class/sem, colleges[string[]], releaseAt[datetime], closeAt[datetime], resultAt[datetime — results publish at, students see marks only after], durationMins[number], totalMarks[number], status[draft|approved|scheduled|live|closed], instructions[text]
- `question`: exam[reference->exam], number[number], type[mcq|short|long], questionText[text], options[string[]] (mcq only), correctAnswer[string], marks[number]
- `submission`: exam[reference->exam], studentName[string], rollNo[string], college[string], answers[{questionNo, answer}][array], submittedAt[datetime], marksAwarded[number — teacher fills in Studio], status[submitted|checking|checked|returned], feedback[text]. NO autoScore — review happens in Sanity, never on the student screen.
- `announcement` (optional): title, message, showUntil[datetime]
- Review model (user decision Sep 24): student submits → answers land in Sanity as `submitted` → teacher checks in Studio (`checking` → `checked`, fills `marksAwarded` + `feedback`) → `returned` at `resultAt`. `/done` shows confirmation only (attempted count + publish date), never scores or correct answers.

Key GROQ:
- List exams: `*[_type=="exam"]|order(releaseAt desc)`
- Paper sync: `*[_type=="question" && exam._ref==$examId]|order(number asc)`

## 4. Must-have checklist
### A. Sanity backend (judges open this)
- [x] Schemas exam, question, submission (+announcement) created in `src/sanity/schemas/`
- [x] Sanity client + GROQ queries with mock fallback (`src/sanity/client.ts`, `queries.ts`)
- [x] Submit API stores `submission` docs when write token set (`src/app/api/submit/route.ts`)
- [x] Decision Sep 24: NO embedded `/studio` route in this site (removed) — teachers author in hosted Studio at sanity.io/manage
- [ ] Sanity account + project created, projectId noted — DONE Sep 24: project `exam-os`, ID `vju5fidf`, dataset `production` (user created via sanity.io; template monorepo steps NOT followed — existing app already matches the required end state)
- [x] projectId plugged into `.env.local` (+ `.env.local.example` created, no secrets)
- [ ] Dataset `production` public read + 1 real exam + 8-10 questions in Studio
- [ ] CORS for Vercel URL + localhost:3000
- [ ] SANITY_WRITE_TOKEN (Editor) for submissions
- [ ] Studio screenshots for DEV post

### B. Next.js app (student side) — BUILT Sep 23 (mock) + restyled Sep 24, browser-verify pending
- [x] `/` list exams: upcoming/live/closed by releaseAt/closeAt (AIDA bento, curl 200 Sep 24)
- [x] `/exam/[id]` countdown if now<releaseAt else Start (restyled, logic untouched)
- [x] Exam page: questions in order, MCQ radio + textarea, timer from durationMins (restyled, logic untouched)
- [x] Auto-submit at 0:00 + manual submit -> create submission doc (logic untouched, needs click-through test)
- [x] `/done` confirmation with submittedAt (restyled, emojis removed)
- [x] `/done` shows NO scores/review (Sanity-side review model Sep 24 — confirmation + results publish date only)
- [x] Responsive (Tailwind grid, needs phone-width check)

### C. Teacher side (hosted Sanity Studio for MVP, not in this site)
- [ ] Create exam as draft in Studio (set releaseAt/closeAt/resultAt)
- [ ] Move workflow draft->approved->scheduled->live->closed
- [ ] Check submissions in Studio: submitted->checking->checked (marksAwarded + feedback) ->returned at resultAt
- [ ] View submissions table

### D. Bonus (pick ONE)
- [ ] Show workflow transitions with screenshots
- [ ] Custom input: marks auto-sum or MCQ answer picker

### E. DEV submission
- [ ] Public GitHub repo + README
- [ ] Vercel deploy live
- [ ] 90-sec demo video (countdown->start->timer->auto-submit)
- [ ] DEV post tags: devchallenge, sanitychallenge, sanity, ai + prompts writeup
- [ ] Sanity Project Details in post (REQUIRED per challenge rules — ours, not judges'): projectId + public dataset URL so the Sanity team can inspect modeling. Missing = possibly incomplete. Source: https://dev.to/challenges/sanity-2026-09-16 ("Every submission needs to include your Sanity project ID or a link to a public dataset URL")
- [ ] Dataset `production` public-read so judges + deployed app can query it; `SANITY_WRITE_TOKEN` stays server-side (Vercel env only), never in the post
- [ ] Test creds if login added, else keep open (student flow is no-login)

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
- Prompt 4 (Sep 24): "deploy locally" — worked after 2 build fixes (studio import path, dummy projectId fallback). Dev live http://localhost:3000.
- Prompt 5 (Sep 24): "@gpt-tasteskill make the app design better" — worked. Installed gsap + @gsap/react; new Navbar/Hero/Marquee/Motion, AIDA home, restyled exam/take/done, emojis removed. Build passes.
- Prompt 6 (Sep 24): "remove teacher studio button and page" — worked. Deleted `src/app/studio/`, repointed CTAs to #papers/#how, copy "Schedule in Sanity". Needed `rm -rf .next` (stale type cache).
- Prompt 7 (Sep 24): "read sanity docs, how sanity helps, write in AGENTS.md" — worked. §2 rewritten with doc links.
- Prompt 8 (Sep 24): "own sanity or judges'?" — answered: OUR project required (projectId + public dataset URL in DEV post, else incomplete). Written to §4E.
- What broke + fix:
  - Turbopack build fails on android/arm64 (no native bindings) → `next build/dev --webpack`.
  - Tailwind v4 fails (no lightningcss android-arm64 binary) → downgraded to tailwindcss@3 + autoprefixer + tailwind.config.js, dropped next/font/Geist.
  - `/done` useSearchParams needs Suspense boundary → wrapped DoneInner in Suspense.
  - Sep 24: `src/app/studio/[[...tool]]/page.tsx` imported `../../../sanity.config` (resolves to src/) → fixed to `../../../../sanity.config`.
  - Sep 24: `projectId` fallback `YOUR_PROJECT_ID` invalid (only a-z/0-9/dashes allowed) → build threw at `/api/submit` collect → fallback now `dummy-project`, `configured` stays false until real env set.
  - Sep 24: deleting `src/app/studio/` left stale `.next/dev/types/.../studio/...` → type-check failed → `rm -rf .next` + rebuild.

## 7. Next steps for agent [updated Sep 24 — local deploy LIVE, redesign DONE]
Status: `npm run dev --webpack` live at http://localhost:3000 (mock mode, build passes). Premium redesign DONE (AIDA home, GSAP, Cabinet+Outfit). Embedded `/studio` REMOVED — hosted Sanity Studio only.
1. ~~Scaffold Next.js~~ DONE. ~~Sanity client + schemas~~ DONE (`src/sanity/`). ~~Student pages~~ DONE + restyled (`/`, `/exam/[id]`, `/take`, `/done`).
2. USER ACTION: create Sanity project `exam-os` at sanity.io, note projectId (required for submission — judges review OUR project, see §4E).
3. Plug projectId into `.env.local` (+ `NEXT_PUBLIC_SANITY_DATASET=production`, `SANITY_WRITE_TOKEN` Editor role). No `.env.local.example` in repo yet — create one without secrets.
4. Seed dataset `production` (public read): 1 exam + 8-10 questions + 1 announcement via hosted Studio. Set CORS for localhost:3000 + Vercel URL.
5. Verify live-data path: with env set, home lists real exams, take page loads real questions, submit writes `submission` docs (check `stored:"sanity"`).
6. Pick ONE bonus (§4D): workflow-transition screenshots (cheap) or custom MCQ/marks input.
7. Deploy to Vercel (env vars set there) + 90-sec demo video + draft DEV post (tags + projectId + dataset URL + prompts §6).

Stack notes: Next.js App Router (webpack only on this box), `next-sanity` + `sanity` installed, GROQ with mock fallback, Tailwind v3, gsap + @gsap/react, Vercel.

## 8. Build log (Sep 23)
- exam-os scaffolded: Next 16.3.6 + Tailwind (downgraded v4->v3: no android-arm64 lightningcss binary) + `--webpack` builds (no Turbopack native bindings on this box). System fonts (dropped next/font/Geist).
- UI-first MVP DONE with mock data (`src/lib/exams.ts` mirrors future Sanity docs): `/`, `/exam/[id]`, `/exam/[id]/take`, `/done`. Build passes.
- Sanity code DONE (schemas, client, GROQ+fallback, /studio, /api/submit). `npm i next-sanity sanity` backgrounded (slow box). Awaiting projectId from user.
- Repo: https://github.com/Torp-dev/exam-os (public, pushed Sep 23).
- MISTAKE LOG Sep 23: rewired pages to `@/sanity/queries` (next-sanity imports) BEFORE packages installed; install then failed with ETIMEDOUT network error. Result: student pages + /studio broken until `next-sanity`+`sanity` land. Lesson: verify install + build before claiming done. Retry running with fetch-retries.

## 8b. Build log (Sep 24)
- Deps landed: `npm i` (422 pkgs) + `npm i next-sanity sanity` (817 pkgs, ~1m, fetch-retries=5). Fixed studio import depth + `dummy-project` fallback → `next build --webpack` passes, dev live http://localhost:3000 (HTTP 200, mock mode).
- Redesign (@gpt-tasteskill): `tailwind.config.js` (font-display/body, ink/paper, marquee), `globals.css` (Cabinet+Outfit, grain, hero-h1 clamp), `layout.tsx` (font links + global Navbar), new `Navbar` (floating glass pill), `Hero` (cinematic center, inline pill image, 2 CTAs, live countdown chip), `Marquee` (colleges), `Motion` (ScrubReveal word-scrub + ScaleImage 0.82→1.0). Home rewritten AIDA (hero/marquee/bento/how/CTA, `py-32 md:py-48`, `grid-flow-dense` 4+2/2+2+2). Exam detail/take/done restyled, logic untouched, emojis stripped. Deps added: gsap + @gsap/react.
- Studio removal (user decision): deleted `src/app/studio/[[...tool]]/`; Navbar/hero/footer CTAs → #papers/#how; copy "Schedule in Sanity". `rm -rf .next` needed (stale studio types broke type-check). Rebuild passes; `/studio` 404s; home has 0 studio refs. `sanity.config.ts` + schemas/client/queries KEPT (hosted Studio + data layer still need them).
- Docs pass: §2 rewritten from sanity.io/docs (Content Lake, schemas, Studio, GROQ, Releases/Perspectives, Mutations) with links; §4A/4C studio refs corrected; §4E now records REQUIRED projectId + public dataset URL (challenge rules, https://dev.to/challenges/sanity-2026-09-16).
- PENDING USER ACTIONS: dataset `production` public-read (dashboard → Access) + CORS (localhost:3000 + Vercel URL) + Editor token (`SANITY_WRITE_TOKEN`); then agent seeds + verifies live-data + redeploys with env vars. Studio screenshots; Vercel deploy env vars; demo video; DEV post.
- PUSHED Sep 24: all session work committed (7e6e1fb) to Torp-dev/exam-os main. Frontend declared done.
- DEPLOYED Sep 24: https://exam-os-delta.vercel.app/ (user connected via dashboard). Verified: home 200 with 6 papers + 2 Join, /results 200, /results/bsc-math-sem2 200. Mock mode (no env vars).
- STUDIO Sep 24: scaffolder failed → hand-wrote minimal `studio/` (sanity 6.16.0 + CLI 8.12.0, shared `../src/sanity/schemas`, single source of truth). Boots at localhost:3333 (HTTP 200). Deleted obsolete root `sanity.config.ts`. Fixed `.gitignore` (`/node_modules` → `node_modules/` + `.sanity/` + `dist/`) after a bad commit briefly staged 40k files — reset before push, repo clean. Pushed 45269754.
- LIVE DATA Sep 24: user created a test exam in Studio → frontend (real projectId) picked it up instantly, but its empty `colleges` crashed the list (`.join` on null) → `fetchExams`/`fetchQuestions` now normalize optional fields. End-to-end Studio→Lake→Next.js PROVEN. Frontend local deploy live http://localhost:3000 (200, "Sanity live").
- SEED Sep 24 (`studio/seed.mjs` via `sanity exec --with-user-token`, CLI Google auth): 3 upcoming exams (English Sem 5, History Sem 4, Geography Sem 3) + 26 questions + 1 announcement. Deleted junk test exam + its orphan question via CLI. CORS added for localhost:3000 + Vercel URL. Home serves the 3 real papers. Pushed 8d04f524.
- WRITES Sep 24: user pasted Editor token → `.env.local` (gitignored). Write path proven: test POST → `{stored:"sanity"}` doc verified in dataset, then deleted. `/done` auto-retries delivery + shows save state, so the user's pending local submission lands on next receipt open. Vercel env vars still pending (user, dashboard).
- JUDGE DEMO Sep 24 (`studio/seed-live.mjs`): always-live GK paper (window →2030, 8 Qs, 20 min) so judges can join on any visit. Home shows 1 Join + 3 upcoming. Pushed 8edf6543.
- Demo papers x5 (user request): 2 live (Physics Mechanics+Optics w/ existing 10 Qs, Chemistry Organic Basics w/ new 10 Qs) + 3 upcoming (Maths Linear Algebra, CS Data Structures, Botany Cell Biology). Closed demo removed. Home papers section converted bento-grid → list rows (thumb icon + status dot, title, subject/class/colleges, countdown, Join for live / View for upcoming → `/exam/[id]` name-entry + Start). Verified: all 5 titles render, 2 Join + 3 View.
- Sanity-side review (user decision Sep 24): `/done` stripped to confirmation-only (attempted count + `resultAt` publish date, zero scores/correct-answers — also closes the mock `correctAnswer` leak). Take page no longer computes scores (`scoreMcq` helper deleted); submit sends answers + identity only. Schema: `exam.resultAt`, `submission.marksAwarded` + status 4-state (submitted|checking|checked|returned). GROQ exams query now selects `resultAt`. `/api/submit` drops autoScore.
- Marketing "how" section removed (user request Sep 24): scrub-reveal/scale-image block + 3 cards gone from home; `#how` anchors removed from Navbar/Hero/footer (single CTAs now). `Motion.tsx` kept but unused.
- College auto-detect (user request Sep 24): dropdown removed from exam start; `detectCollege()` in `lib/exams.ts` maps roll prefix FER/MIT/XAV to college (scoped to the paper's colleges). Live "College detected:" hint while typing; unknown prefix blocks Start.
- 4-digit rolls (user request Sep 24): `detectCollege()` now takes exactly 4 digits, first digit encodes college (1xxx Fergusson, 2xxx MIT, 3xxx Xavier's). Numeric keypad, maxLength 4.
- Roll map extended (user report Sep 24): 7852 failed (7 unmapped) → all digits covered (1/4/7 Fergusson, 2/5/8 MIT, 3/6/9/0 Xavier's).
- Time's UP card + results hall (user request Sep 24): timer hitting 0:00 now opens a "Time's UP / OK" modal instead of instant-submit; OK submits and routes to `/done`. New `/results` page lists taken exams from localStorage (name, roll, submitted date, publish-vs-delayed status, View → `/done`); empty state when nothing taken. Hero regained a secondary CTA "Check exam results". `/done` shows "Delayed" + delay note once `resultAt` passes. Stored `ExamResult` now snapshots `examTitle` + `resultAt`.
- Published result demo (user request Sep 24): closed exam `bsc-math-sem2` (resultAt past) + `PUBLISHED_RESULTS` demo row (Aarav Sharma / 1042, 42/50 + feedback) + `findPublishedResult()`. New `/results/[id]` lookup page (name + 4-digit roll → marks card or error; demo creds hinted). `/results` gained a Published section; home closed rows show a Results button → lookup page. Later: replace with GROQ on `submission`s where status == returned.
- Titles + exact times (user request Sep 24): papers retitled to "Subject - X Semester - N (Topic)" pattern, classSem shortened to "Semester - N". List rows now show exact clocks (live "Ends 04:30 PM", upcoming "Starts 10:00 AM"); detail page shows ends-at clock + starts-at datetime. Duration timer already runs exact `durationMins * 60`.
- Titles now "Subject - X | Semester - N (Topic)" (user request Sep 24).
- FRONTEND DECLARED DONE (user, Sep 24) — only small tweaks later. Remaining work is backend/submission: Sanity project + seed + CORS + write token (user actions), live-data verify, Vercel deploy, demo video, DEV post, README rewrite.
