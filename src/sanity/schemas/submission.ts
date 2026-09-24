import { defineField, defineType } from "sanity";

export const submission = defineType({
  name: "submission",
  title: "Submission",
  type: "document",
  readOnly: true, // created by the Next.js app, checked by teachers
  fields: [
    defineField({ name: "exam", title: "Exam", type: "reference", to: [{ type: "exam" }] }),
    defineField({ name: "studentName", title: "Student", type: "string" }),
    defineField({ name: "rollNo", title: "Roll no.", type: "string" }),
    defineField({ name: "college", title: "College", type: "string" }),
    defineField({
      name: "answers", title: "Answers", type: "array",
      of: [{
        type: "object",
        fields: [
          defineField({ name: "questionNo", title: "Q no.", type: "number" }),
          defineField({ name: "answer", title: "Answer", type: "text" }),
        ],
      }],
    }),
    defineField({ name: "submittedAt", title: "Submitted at", type: "datetime" }),
    defineField({
      name: "marksAwarded", title: "Marks awarded (teacher)", type: "number",
      description: "Filled by the teacher in Studio during checking. Never shown to students before results publish.",
      validation: (r) =>
        r.custom((v, ctx) => {
          const parent = ctx.parent as { snapshot?: { totalMarks?: number } } | undefined;
          const max = parent?.snapshot?.totalMarks;
          if (typeof v === "number" && typeof max === "number" && v > max)
            return `Exceeds paper total (${max}) — check the addition`;
          return true;
        }),
    }),
    defineField({
      name: "status", title: "Checking status", type: "string",
      options: { list: ["submitted", "checking", "checked", "returned"], layout: "radio" },
      initialValue: "submitted",
      description: "submitted → checking → checked → returned (result visible to student).",
    }),
    defineField({ name: "feedback", title: "Teacher feedback", type: "text" }),
    defineField({
      name: "snapshot", title: "Paper snapshot (auto-filled at submit)", type: "object",
      readOnly: true,
      description: "Freezes the paper as the student saw it — later question edits can't corrupt checked sheets.",
      options: { collapsed: true },
      fields: [
        defineField({ name: "totalMarks", title: "Total marks", type: "number", readOnly: true }),
        defineField({
          name: "questions", title: "Questions", type: "array", readOnly: true,
          of: [{
            type: "object",
            fields: [
              defineField({ name: "number", type: "number", readOnly: true }),
              defineField({ name: "qtype", type: "string", readOnly: true }),
              defineField({ name: "questionText", type: "text", readOnly: true }),
              defineField({ name: "options", type: "array", readOnly: true, of: [{ type: "string" }] }),
              defineField({ name: "correctAnswer", type: "string", readOnly: true }),
              defineField({ name: "marks", type: "number", readOnly: true }),
            ],
          }],
        }),
      ],
    }),
  ],
  preview: {
    select: { student: "studentName", roll: "rollNo", status: "status" },
    prepare({ student, roll, status }) {
      return { title: `${student ?? "?"} (${roll ?? "?"})`, subtitle: status as string };
    },
  },
});
