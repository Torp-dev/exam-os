import { defineField, defineType } from "sanity";

export const announcement = defineType({
  name: "announcement",
  title: "Announcement",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string", validation: (r) => r.required() }),
    defineField({ name: "message", title: "Message", type: "text", validation: (r) => r.required() }),
    defineField({
      name: "showFrom", title: "Show from (schedule)", type: "datetime",
      description: "Notice appears on the site only after this time. Empty = show immediately.",
    }),
    defineField({ name: "showUntil", title: "Show until", type: "datetime" }),
    defineField({
      name: "attachment", title: "Attachment (PDF)", type: "file",
      options: { accept: ".pdf,application/pdf" },
      description: "Optional PDF shown as a download link under the notice.",
    }),
  ],
});
