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
    defineField({
      name: "classSem", title: "Class / Semester", type: "string",
      description: "Format: Semester - N (e.g. Semester - 4). Used on the papers board.",
    }),
    defineField({
      name: "colleges", title: "Colleges (synced)", type: "array",
      of: [{ type: "string", options: { list: ["Fergusson College", "MIT Pune", "St. Xavier's"] } }],
      description: "Every college PC shows this paper at the same second. Pick from the list — typos break roll-number detection.",
      validation: (r) => r.required().min(1),
    }),
    defineField({ name: "releaseAt", title: "Goes live at", type: "datetime", validation: (r) => r.required() }),
    defineField({
      name: "closeAt", title: "Closes at", type: "datetime",
      validation: (r) =>
        r.required().custom((v, ctx) => {
          const parent = ctx.parent as { releaseAt?: string } | undefined;
          if (v && parent?.releaseAt && new Date(v).getTime() <= new Date(parent.releaseAt).getTime())
            return "Must be after Goes live at — otherwise the paper is never joinable";
          return true;
        }),
    }),
    defineField({
      name: "durationMins", title: "Duration (minutes)", type: "number",
      validation: (r) => r.required().min(1).max(480),
    }),
    defineField({
      name: "totalMarks", title: "Total marks", type: "number",
      description: "Must equal the sum of this paper's question marks.",
      validation: (r) => r.required().min(1),
    }),
    defineField({
      name: "resultAt", title: "Results publish at", type: "datetime",
      description: "Students see marks only after this time. Checking happens in Studio before this. Past date = publish now, future date = scheduled.",
      validation: (r) =>
        r.custom((v, ctx) => {
          const parent = ctx.parent as { closeAt?: string } | undefined;
          if (v && parent?.closeAt && new Date(v).getTime() < new Date(parent.closeAt).getTime())
            return "Earlier than Closes at — results would publish mid-exam";
          return true;
        }),
    }),
    defineField({
      name: "status", title: "Workflow status", type: "string",
      options: { list: ["draft", "approved", "scheduled", "live", "closed"], layout: "radio" },
      initialValue: "draft",
      description: "Teacher process marker. The site itself reads the live/closed windows above, not this field.",
      validation: (r) => r.required(),
    }),
    defineField({ name: "instructions", title: "Instructions", type: "array", of: [{ type: "text" }] }),
  ],
  preview: {
    select: { title: "title", subtitle: "subject", status: "status", closeAt: "closeAt" },
    prepare({ title, subtitle, status, closeAt }) {
      const when = closeAt ? ` · ends ${new Date(closeAt as string).toLocaleDateString()}` : "";
      return { title, subtitle: `${subtitle ?? ""} · ${status ?? ""}${when}` };
    },
  },
});
