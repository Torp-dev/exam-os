import { defineConfig } from "sanity";
import { schemaTypes } from "./src/sanity/schemas";
import { apiVersion, dataset, projectId } from "./src/sanity/env";

export default defineConfig({
  name: "exam-os",
  title: "Exam Host Studio",
  projectId,
  dataset,
  basePath: "/studio",
  schema: { types: schemaTypes },
  apiVersion,
});
