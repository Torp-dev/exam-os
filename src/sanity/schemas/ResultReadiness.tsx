import { useCallback, useEffect, useState } from "react";
import { useClient } from "sanity";
import { Box, Button, Card, Flex, Text } from "@sanity/ui";

interface Row {
  _id: string;
  studentName?: string;
  rollNo?: string;
  status?: string;
  marksAwarded?: number;
}
interface ExamInfo {
  resultAt?: string;
  status?: string;
  totalMarks?: number;
}

// "Result" tab on an exam: live progress of the checking queue. The publish
// step appears only when every sheet carries marks — then the teacher sets
// the result date (past = now, future = scheduled) and returns the sheets.
export function ResultReadiness(props: { documentId: string }) {
  const client = useClient({ apiVersion: "2025-09-01" });
  const examId = props.documentId.replace(/^drafts\./, "");
  const [exam, setExam] = useState<ExamInfo | null>(null);
  const [rows, setRows] = useState<Row[] | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    client
      .fetch<ExamInfo | null>(`*[_id == $id][0]{resultAt, status, totalMarks}`, { id: examId })
      .then((e) => setExam(e));
    client
      .fetch<Row[]>(
        `*[_type == "submission" && exam._ref == $id] | order(rollNo asc) {_id, studentName, rollNo, status, marksAwarded}`,
        { id: examId }
      )
      .then((r) => setRows(r ?? []));
  }, [client, examId]);

  useEffect(() => {
    load();
  }, [load]);

  const returnAll = useCallback(async () => {
    const ready = (rows ?? []).filter((r) => r.status === "checked" && r.marksAwarded != null);
    if (!ready.length) return;
    if (!window.confirm(`Return ${ready.length} checked sheet(s) to students?`)) return;
    setBusy(true);
    try {
      await Promise.all(
        ready.map((r) =>
          client.patch(r._id.replace(/^drafts\./, "")).set({ status: "returned" }).commit()
        )
      );
      load();
    } finally {
      setBusy(false);
    }
  }, [client, rows, load]);

  if (!rows) return <Box padding={4}><Text size={2} muted>Loading result progress…</Text></Box>;

  const marked = rows.filter((r) => r.marksAwarded != null).length;
  const returned = rows.filter((r) => r.status === "returned").length;
  const returnable = rows.filter((r) => r.status === "checked" && r.marksAwarded != null).length;
  const unmarked = rows.filter((r) => r.marksAwarded == null);
  const allMarked = rows.length > 0 && unmarked.length === 0;
  const resultAt = exam?.resultAt ? new Date(exam.resultAt) : null;

  return (
    <Box padding={4}>
      <Flex direction="column" gap={4}>
        <Card padding={3} border>
          <Text size={3} weight="bold">{marked}/{rows.length} sheets marked · {returned}/{rows.length} returned</Text>
          <Text size={1} muted>Paper total: {exam?.totalMarks ?? "?"} marks</Text>
        </Card>

        {!allMarked && (
          <Card padding={3} border tone="caution">
            <Text size={2} weight="bold">Still to mark: {unmarked.length}</Text>
            <Text size={2} muted>
              {unmarked.slice(0, 8).map((r) => `${r.studentName ?? "?"} (${r.rollNo ?? "?"})`).join(", ")}
              {unmarked.length > 8 ? ` +${unmarked.length - 8} more` : ""}
            </Text>
            <Text size={1} muted>Publishing unlocks when every sheet carries marks.</Text>
          </Card>
        )}

        {allMarked && (
          <Card padding={3} border tone="positive">
            <Text size={2} weight="bold">All sheets marked — ready to post.</Text>
            <Text size={1} muted>
              {resultAt
                ? `Results publish ${resultAt.toLocaleString()}. Past date = live now, future date = on schedule. Change it in Details or Post Result.`
                : "No result date set — set one in Details (past = now, future = scheduled)."}
            </Text>
            {returnable > 0 && (
              <Box marginTop={3}>
                <Button text={busy ? "Returning…" : `Return ${returnable} checked sheet(s)`} tone="primary" disabled={busy} onClick={returnAll} />
              </Box>
            )}
            {returnable === 0 && returned === rows.length && (
              <Text size={2}>Every sheet is returned. Results are live{resultAt && resultAt.getTime() < Date.now() ? "" : " on schedule"}.</Text>
            )}
          </Card>
        )}

        {rows.length === 0 && (
          <Text size={2} muted>No submissions for this paper yet.</Text>
        )}
      </Flex>
    </Box>
  );
}
