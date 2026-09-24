import { set, useFormValue, type StringInputProps } from "sanity";
import { Flex, Radio, Text } from "@sanity/ui";

// Custom Studio input: pick the correct MCQ answer by clicking one of the
// options typed above, instead of re-typing it (typos used to break grading).
export function AnswerPicker(props: StringInputProps) {
  const { value, onChange, renderDefault } = props;
  const options = (useFormValue(["options"]) as unknown as string[] | undefined) ?? [];

  if (!options.length) return <>{renderDefault(props)}</>;

  return (
    <Flex direction="column" gap={2}>
      {options.map((opt, i) => (
        <label key={`${i}-${opt}`} style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
          <Radio checked={value === opt} onChange={() => onChange(set(opt))} />
          <Text size={2}>{opt}</Text>
        </label>
      ))}
    </Flex>
  );
}
