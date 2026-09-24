import { defineField, defineType } from "sanity";

export const exam = defineType({
  name: "exam",
  title: "Exam",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string", validation: (r) => r.required() }),
    defineField({
      name: "slug", title: "Slug", type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (r) => r.required(),
    }),
    defineField({ name: "subject", title: "Subject", type: "string", validation: (r) => r.required() }),
    defineField({ name: "classSem", title: "Class / Semester", type: "string" }),
    defineField({
      name: "colleges", title: "Colleges (synced)", type: "array",
      of: [{ type: "string" }],
      description: "Every college PC shows this paper at the same second.",
    }),
    defineField({ name: "releaseAt", title: "Goes live at", type: "datetime", validation: (r) => r.required() }),
    defineField({ name: "closeAt", title: "Closes at", type: "datetime", validation: (r) => r.required() }),
    defineField({
      name: "durationMins", title: "Duration (minutes)", type: "number",
      validation: (r) => r.required().min(1).max(480),
    }),
    defineField({ name: "totalMarks", title: "Total marks", type: "number", validation: (r) => r.required().min(1) }),
    defineField({
      name: "resultAt", title: "Results publish at", type: "datetime",
      description: "Students see marks only after this time. Checking happens in Studio before this.",
    }),
    defineField({
      name: "status", title: "Workflow status", type: "string",
      options: { list: ["draft", "approved", "scheduled", "live", "closed"], layout: "radio" },
      initialValue: "draft",
      validation: (r) => r.required(),
    }),
    defineField({ name: "instructions", title: "Instructions", type: "array", of: [{ type: "text" }] }),
  ],
  preview: {
    select: { title: "title", subtitle: "subject", status: "status" },
    prepare({ title, subtitle, status }) {
      return { title, subtitle: `${subtitle ?? ""} · ${status ?? ""}` };
    },
  },
});
