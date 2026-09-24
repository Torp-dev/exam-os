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
    }),
    defineField({
      name: "status", title: "Checking status", type: "string",
      options: { list: ["submitted", "checking", "checked", "returned"], layout: "radio" },
      initialValue: "submitted",
      description: "submitted → checking → checked → returned (result visible to student).",
    }),
    defineField({ name: "feedback", title: "Teacher feedback", type: "text" }),
  ],
  preview: {
    select: { student: "studentName", roll: "rollNo", status: "status" },
    prepare({ student, roll, status }) {
      return { title: `${student ?? "?"} (${roll ?? "?"})`, subtitle: status as string };
    },
  },
});
