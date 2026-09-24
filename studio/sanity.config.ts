import { defineConfig } from "sanity";
import { structureTool, type StructureBuilder } from "sanity/structure";
import { schemaTypes } from "../src/sanity/schemas";

// Submissions for one paper in one review state (teacher opens the paper,
// sees only its queue).
function submissionsForExam(S: StructureBuilder, examId: string, status: string, title: string) {
  return S.listItem()
    .title(title)
    .child(
      S.documentList()
        .title(title)
        .schemaType("submission")
        .filter('_type == "submission" && exam._ref == $examId && status == $status')
        .params({ examId, status })
        .defaultOrdering([{ field: "submittedAt", direction: "desc" }])
    );
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
            S.listItem()
              .title("Per paper")
              .child(
                S.documentTypeList("exam")
                  .title("Per paper")
                  .child((examId: string) =>
                    S.list()
                      .title("Paper queue")
                      .items([
                        S.listItem()
                          .title("Open paper")
                          .child(S.document().documentId(examId).schemaType("exam")),
                        submissionsForExam(S, examId, "submitted", "New submissions"),
                        submissionsForExam(S, examId, "checking", "Being checked"),
                        submissionsForExam(S, examId, "checked", "Checked — ready to return"),
                        submissionsForExam(S, examId, "returned", "Returned"),
                      ])
                  )
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
