import { getCliClient } from "sanity/cli";

const client = getCliClient({ apiVersion: "2025-09-01" });
const D = 24 * 3600_000;
const now = Date.now();
const iso = (t) => new Date(t).toISOString();

// Minimal one-page PDF: exam-week instructions.
const pdf = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 400 300]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj
4 0 obj<</Length 180>>stream
BT /F1 14 Tf 40 250 Td (Exam Week Instructions) Tj 0 -24 Td /F1 10 Tf (Reach the hall 30 minutes early.) Tj 0 -16 Td (Carry your 4-digit roll number.) Tj 0 -16 Td (Results publish on the announced date.) Tj ET
endstream
endobj
5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
trailer<</Root 1 0 R>>
`;
const asset = await client.assets.upload("file", Buffer.from(pdf, "utf8"), {
  filename: "exam-week-instructions.pdf",
  contentType: "application/pdf",
});
console.log("pdf asset:", asset._id);

await client.create({
  _type: "announcement",
  title: "Exam week instructions",
  message: "Reach the hall 30 minutes early with your 4-digit roll number. Download the full instruction sheet below.",
  showFrom: iso(now - 3600_000),
  attachment: { _type: "file", asset: { _type: "reference", _ref: asset._id } },
});
console.log("notice 1 (visible + PDF): ok");

await client.create({
  _type: "announcement",
  title: "History paper hall allocation",
  message: "Hall numbers for the History Semester - 4 paper will appear here three days before the exam.",
  showFrom: iso(now + 3 * D),
});
console.log("notice 2 (scheduled, hidden until showFrom): ok");
