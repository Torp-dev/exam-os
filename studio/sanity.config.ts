import { defineConfig } from "sanity";
import { structureTool, type StructureBuilder } from "sanity/structure";
import { schemaTypes } from "../src/sanity/schemas";

// Teacher checking queue: submissions grouped by review state so the next
// paper to check is one click away, newest first.
function submissionsByStatus(S: StructureBuilder, status: string, title: string) {
  return S.listItem()
    .title(title)
    .child(
      S.documentList()
        .title(title)
        .schemaType("submission")
        .filter('_type == "submission" && status == $status')
        .params({ status })
        .defaultOrdering([{ field: "submittedAt", direction: "desc" }])
    );
}

export default defineConfig({
  name: "exam-os",
  title: "Exam Host Studio",

  projectId: "vju5fidf",
  dataset: "production",

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Exam Host")
          .items([
            S.listItem()
              .title("Needs checking")
              .child(
                S.list()
                  .title("Needs checking")
                  .items([
                    submissionsByStatus(S, "submitted", "New submissions"),
                    submissionsByStatus(S, "checking", "Being checked"),
                  ])
              ),
            submissionsByStatus(S, "checked", "Checked — ready to return"),
            submissionsByStatus(S, "returned", "Returned to students"),
            S.divider(),
            ...S.documentTypeListItems().filter((item) =>
              ["exam", "question", "announcement"].includes(item.getId() ?? "")
            ),
          ]),
    }),
  ],

  schema: {
    types: schemaTypes,
  },
});
