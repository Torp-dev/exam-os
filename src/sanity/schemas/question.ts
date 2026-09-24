import { defineField, defineType } from "sanity";
import { AnswerPicker } from "./AnswerPicker";

export const question = defineType({
  name: "question",
  title: "Question",
  type: "document",
  fields: [
    defineField({
      name: "exam", title: "Exam", type: "reference",
      to: [{ type: "exam" }],
      validation: (r) => r.required(),
    }),
    defineField({
      name: "number", title: "Question no.", type: "number",
      description: "Unique within the paper, in order (1, 2, 3…). Drives site ordering and answer matching.",
      validation: (r) => r.required().min(1),
    }),
    defineField({
      name: "type", title: "Type", type: "string",
      options: { list: ["mcq", "short", "long"], layout: "radio" },
      initialValue: "mcq",
      validation: (r) => r.required(),
    }),
    defineField({ name: "questionText", title: "Question", type: "text", validation: (r) => r.required() }),
    defineField({
      name: "options", title: "Options (MCQ only)", type: "array",
      of: [{ type: "string" }],
      hidden: ({ parent }) => parent?.type !== "mcq",
      validation: (r) =>
        r.custom((opts, ctx) => {
          const type = (ctx.parent as { type?: string } | undefined)?.type;
          if (type === "mcq" && (!opts || (opts as string[]).length < 2))
            return "MCQ needs at least 2 options";
          return true;
        }),
    }),
    defineField({
      name: "correctAnswer", title: "Correct answer (MCQ, hidden from students)", type: "string",
      hidden: ({ parent }) => parent?.type !== "mcq",
      components: { input: AnswerPicker },
      validation: (r) =>
        r.custom((ans, ctx) => {
          const parent = ctx.parent as { type?: string; options?: string[] } | undefined;
          if (parent?.type === "mcq" && !ans) return "Required for MCQ — pick it above";
          if (ans && parent?.options?.length && !parent.options.includes(ans as string))
            return "Must match one of the options above — pick it instead of typing";
          return true;
        }),
    }),
    defineField({ name: "marks", title: "Marks", type: "number", validation: (r) => r.required().min(1) }),
  ],
  preview: {
    select: { no: "number", text: "questionText", type: "type" },
    prepare({ no, text, type }) {
      return { title: `Q${no ?? "?"} [${type ?? "?"}]`, subtitle: (text as string)?.slice(0, 80) };
    },
  },
});
