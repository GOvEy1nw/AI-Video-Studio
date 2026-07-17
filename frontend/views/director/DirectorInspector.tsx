import type {
  DirectorPromptSegmentV1,
  DirectorSequenceV1,
} from "@/types/director";

interface Props {
  sequence: DirectorSequenceV1;
  segment: DirectorPromptSegmentV1 | undefined;
  onChange: (sequence: DirectorSequenceV1) => void;
}

export function DirectorInspector({ sequence, segment, onChange }: Props) {
  if (!segment) {
    return (
      <div className="text-xs text-zinc-500">
        Select prompt segment to edit.
      </div>
    );
  }
  const update = (next: DirectorPromptSegmentV1) =>
    onChange({
      ...sequence,
      promptSegments: sequence.promptSegments.map((item) =>
        item.id === next.id ? next : item,
      ),
    });
  return (
    <textarea
      value={segment.prompt}
      onChange={(event) => update({ ...segment, prompt: event.target.value })}
      className="min-h-0 w-full flex-1 resize-none rounded border border-zinc-700 bg-zinc-800 p-2 text-xs text-zinc-100 outline-none"
      placeholder="Add your text prompt here…"
      aria-label="Local Prompt"
    />
  );
}
