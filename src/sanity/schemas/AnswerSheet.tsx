import { useEffect, useState } from "react";
import { useClient } from "sanity";
import { Box, Card, Stack, Text } from "@sanity/ui";

interface Answer {
  _key?: string;
  questionNo?: number;
  answer?: string;
}
interface Q {
  number: number;
  type: string;
  questionText: string;
  options?: string[];
  marks: number;
}
interface Sub {
  studentName?: string;
  rollNo?: string;
  college?: string;
  submittedAt?: string;
  status?: string;
  marksAwarded?: number;
  answers?: Answer[];
}

// Read-only "Answer sheet" tab on a submission: full Q&A as plain text,
// total marks shown at the end (awarded once in the Marks tab — no
// per-question marking, so checking stays fast).
export function AnswerSheet(props: { documentId: string }) {
  const client = useClient({ apiVersion: "2025-09-01" });
  const [sub, setSub] = useState<Sub | null>(null);
  const [qs, setQs] = useState<Q[]>([]);
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    let live = true;
    const id = props.documentId;
    client
      .fetch<Sub | null>(
        `*[_id == $id || _id == "drafts." + $id][0]{studentName, rollNo, college, submittedAt, status, marksAwarded, answers, "examId": exam._ref}`,
        { id }
      )
      .then(async (s) => {
        if (!live) return;
        if (!s) {
          setEmpty(true);
          return;
        }
        setSub(s);
        const examId = (s as Sub & { examId?: string }).examId;
        if (!examId) return;
        const questions = await client.fetch<Q[]>(
          `*[_type == "question" && exam._ref == $e] | order(number asc) {number, type, questionText, options, marks}`,
          { e: examId }
        );
        if (live) setQs(questions ?? []);
      })
      .catch(() => live && setEmpty(true));
    return () => {
      live = false;
    };
  }, [client, props.documentId]);

  if (empty) return <Box padding={4}><Text size={2}>Save the document once, then reopen this tab.</Text></Box>;
  if (!sub) return <Box padding={4}><Text size={2} muted>Loading answer sheet…</Text></Box>;

  const byNo = new Map((sub.answers ?? []).map((a) => [a.questionNo, a.answer ?? ""]));
  const totalPossible = qs.reduce((t, q) => t + (q.marks ?? 0), 0);

  return (
    <Box padding={4}>
      <Stack space={4}>
        <Card padding={3} tone="transparent" border>
          <Text size={3} weight="bold">{sub.studentName ?? "?"} ({sub.rollNo ?? "?"}) · {sub.college ?? ""}</Text>
          <Text size={1} muted>Submitted {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : "—"} · {sub.status ?? ""}</Text>
        </Card>
        {qs.length === 0 && (
          <Text size={2} muted>No linked questions found for this paper — answers shown raw below.</Text>
        )}
        {(qs.length ? qs : (sub.answers ?? []).map((a, i) => ({ number: a.questionNo ?? i, type: "?", questionText: "", marks: 0 }))).map((q) => (
          <Card key={q.number} padding={3} border>
            <Text size={1} muted>Q{q.number} · {q.type.toUpperCase()} · {q.marks} marks</Text>
            {q.questionText ? <Text size={2} weight="semibold" style={{ marginTop: 4 }}>{q.questionText}</Text> : null}
            <Text size={2} style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>
              {byNo.get(q.number) || <em style={{ color: "#999" }}>— no answer —</em>}
            </Text>
          </Card>
        ))}
        <Card padding={3} tone="positive" border>
          <Text size={2} weight="bold">
            Total: {sub.marksAwarded ?? "—"} / {totalPossible || "?"}
          </Text>
          <Text size={1} muted>Award once in the Marks tab. No per-question marking.</Text>
        </Card>
      </Stack>
    </Box>
  );
}
