import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "../src/sanity/schemas";

export default defineConfig({
  name: "exam-os",
  title: "Exam Host Studio",

  projectId: "vju5fidf",
  dataset: "production",

  plugins: [structureTool()],

  schema: {
    types: schemaTypes,
  },
});
