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
    const examId: string | null = await writeClient.fetch(
      `*[_type == "exam" && slug.current == $slug][0]._id`,
      { slug: body.examId }
    );
    const doc = await writeClient.create({
      _type: "submission",
      ...(examId ? { exam: { _type: "reference", _ref: examId } } : {}),
      studentName: body.studentName ?? "Student",
      rollNo: body.rollNo ?? "—",
      college: body.college ?? "—",
      answers: body.answers,
      submittedAt: new Date().toISOString(),
      status: "submitted",
    });
    return NextResponse.json({ ok: true, stored: "sanity", id: doc._id });
  } catch (e) {
    return NextResponse.json({ ok: true, stored: "local", warning: String(e) });
  }
}
