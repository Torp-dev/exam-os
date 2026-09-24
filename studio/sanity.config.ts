import { defineConfig } from "sanity";
import { structureTool, type StructureBuilder } from "sanity/structure";
import { schemaTypes } from "../src/sanity/schemas";
import { AnswerSheet } from "../src/sanity/schemas/AnswerSheet";

// Questions + "add" shortcut for one paper: each subject teacher works
// inside their own paper, never in a mixed pile.
function questionsForExam(S: StructureBuilder, examId: string) {
  return S.listItem()
    .title("Questions for this paper")
    .child(
      S.documentList()
        .title("Questions for this paper")
        .schemaType("question")
        .filter('_type == "question" && exam._ref == $examId')
        .params({ examId })
        .defaultOrdering([{ field: "number", direction: "asc" }])
        .initialValueTemplates([
          S.initialValueTemplateItem("question-for-paper", { examId }),
        ])
    );
}

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
}

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
              .title("Post Notice")
              .child(
                S.list()
                  .title("Post Notice")
                  .items([
                    S.listItem()
                      .title("New notice")
                      .child(S.document().schemaType("announcement").initialValueTemplate("new-notice")),
                    S.listItem()
                      .title("Recent notices")
                      .child(
                        S.documentList()
                          .title("Recent notices")
                          .schemaType("announcement")
                          .filter('_type == "announcement"')
                          .defaultOrdering([{ field: "_createdAt", direction: "desc" }])
                      ),
                  ])
              ),
            S.listItem()
              .title("Create Exam")
              .child(
                S.list()
                  .title("Create Exam")
                  .items([
                    S.listItem()
                      .title("New exam paper")
                      .child(S.document().schemaType("exam").initialValueTemplate("new-exam")),
                    S.listItem()
                      .title("Recent papers")
                      .child(
                        S.documentList()
                          .title("Recent papers")
                          .schemaType("exam")
                          .filter('_type == "exam"')
                          .defaultOrdering([{ field: "_createdAt", direction: "desc" }])
                      ),
                  ])
              ),
            S.listItem()
              .title("Check Paper")
              .child(
                S.documentList()
                  .title("Check Paper — ended exams")
                  .schemaType("exam")
                  .filter('_type == "exam" && dateTime(closeAt) <= dateTime(now())')
                  .defaultOrdering([{ field: "closeAt", direction: "desc" }])
                  .child((examId: string) =>
                    S.list()
                      .title("Checking")
                      .items([
                        S.listItem()
                          .title("Open paper")
                          .child(S.document().documentId(examId).schemaType("exam")),
                        questionsForExam(S, examId),
                        submissionsForExam(S, examId, "submitted", "New submissions"),
                        submissionsForExam(S, examId, "checking", "Being checked"),
                        submissionsForExam(S, examId, "checked", "Checked — ready to return"),
                        submissionsForExam(S, examId, "returned", "Returned"),
                      ])
                  )
              ),
            S.listItem()
              .title("Post Result")
              .child(
                S.documentList()
                  .title("Post Result — ended exams")
                  .schemaType("exam")
                  .filter('_type == "exam" && dateTime(closeAt) <= dateTime(now())')
                  .defaultOrdering([{ field: "closeAt", direction: "desc" }])
                  .child((examId: string) =>
                    S.list()
                      .title("Result")
                      .items([
                        S.listItem()
                          .title("Set result date")
                          .child(
                            S.document()
                              .documentId(examId)
                              .schemaType("exam")
                          ),
                        submissionsForExam(S, examId, "checked", "Ready to return"),
                        submissionsForExam(S, examId, "returned", "Returned"),
                      ])
                  )
              ),
            S.divider(),
            ...S.documentTypeListItems().filter((item) =>
              ["exam", "question", "announcement"].includes(item.getId() ?? "")
            ),
          ]),
      defaultDocumentNode: (S, { schemaType }) =>
        schemaType === "submission"
          ? S.document().views([
              S.view.component(AnswerSheet).title("Answer sheet"),
              S.view.form().title("Marks"),
            ])
          : S.document(),
    }),
  ],

  schema: {
    types: schemaTypes,
    templates: (prev) => [
      ...prev,
      {
        id: "new-exam",
        title: "New exam paper",
        schemaType: "exam",
        value: { status: "draft" },
      },
      {
        id: "new-notice",
        title: "New notice",
        schemaType: "announcement",
        value: {},
      },
      {
        id: "question-for-paper",
        title: "Question for this paper",
        schemaType: "question",
        parameters: [{ name: "examId", type: "string" }],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        value: ({ examId }: any) => ({
          exam: examId ? { _type: "reference", _ref: examId } : undefined,
          type: "mcq",
        }),
      },
    ],
  },
});
