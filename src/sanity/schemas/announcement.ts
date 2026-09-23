import { defineField, defineType } from "sanity";

export const announcement = defineType({
  name: "announcement",
  title: "Announcement",
  type: "document",
  fields: [
    defineField({ name: "title", title: "Title", type: "string", validation: (r) => r.required() }),
    defineField({ name: "message", title: "Message", type: "text", validation: (r) => r.required() }),
    defineField({ name: "showUntil", title: "Show until", type: "datetime" }),
  ],
});
