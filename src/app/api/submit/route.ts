import { NextResponse } from "next/server";
import { writeClient } from "@/sanity/client";
import { configured } from "@/sanity/env";

// Student submissions land here. Always succeeds (local-first):
// writes a `submission` doc when Sanity is configured, else just echoes back.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.examId || !body?.answers) {
    return NextResponse.json({ ok: false, error: "examId + answers required" }, { status: 400 });
  }

  if (!configured || !process.env.SANITY_WRITE_TOKEN) {
    return NextResponse.json({ ok: true, stored: "local", id: null });
  }

  try {
    // resolve the exam document _id from its slug
    const exam: { _id: string; totalMarks?: number } | null = await writeClient.fetch(
      `*[_type == "exam" && slug.current == $slug][0]{_id, totalMarks}`,
      { slug: body.examId }
    );
    const examId: string | null = exam?._id ?? null;
    // one sheet per student: re-submit returns the existing doc, never a duplicate
    const roll = String(body.rollNo ?? "—").trim();
    if (examId) {
      const existing: string | null = await writeClient.fetch(
        `*[_type == "submission" && exam._ref == $eid && rollNo == $roll][0]._id`,
        { eid: examId, roll }
      );
      if (existing) return NextResponse.json({ ok: true, stored: "sanity", id: existing, duplicate: true });
    }
    // freeze the paper as the student saw it (questions + correct answers +
    // marks), so later teacher edits can't corrupt this sheet
    const snapQs: Array<{ number: number; qtype: string; questionText: string; options?: string[]; correctAnswer?: string; marks: number }> =
      examId
        ? await writeClient.fetch<Array<{ number: number; qtype: string; questionText: string; options?: string[]; correctAnswer?: string; marks: number }>>(
            `*[_type == "question" && exam._ref == $eid] | order(number asc) {number, "qtype": type, questionText, options, correctAnswer, marks}`,
            { eid: examId }
          ).catch(() => [])
        : [];
    const answers = Array.isArray(body.answers) ? body.answers : [];
    const doc = await writeClient.create({
      _type: "submission",
      ...(examId ? { exam: { _type: "reference", _ref: examId } } : {}),
      studentName: body.studentName ?? "Student",
      rollNo: roll,
      college: body.college ?? "—",
      // Studio arrays need `_key` per item or the doc can't be edited.
      answers: answers.map((a: { questionNo?: number; answer?: string }, i: number) => ({
        _key: `q${a?.questionNo ?? i}`,
        questionNo: a?.questionNo ?? i,
        answer: a?.answer ?? "",
      })),
      snapshot: {
        totalMarks: exam?.totalMarks ?? snapQs.reduce((t, q) => t + (q.marks ?? 0), 0),
        questions: snapQs.map((q, i) => ({ _key: `sq${q.number ?? i}`, ...q })),
      },
      submittedAt: new Date().toISOString(),
      status: "submitted",
    });
    return NextResponse.json({ ok: true, stored: "sanity", id: doc._id });
  } catch (e) {
    return NextResponse.json({ ok: true, stored: "local", warning: String(e) });
  }
}
