import type { VideoToolId } from "../../../types/video-tools";

export const VIDEO_TOOL_OPTIONS = [
  { value: "reframe", label: "Reframe" },
  { value: "extend", label: "Extend" },
  { value: "relight", label: "Relight" },
  { value: "colorize", label: "Colorize" },
  { value: "clean_plate", label: "Clean Plate" },
  { value: "lip_dub", label: "Lip Dub" },
  { value: "decompression", label: "Decompression" },
  { value: "sdr_to_hdr", label: "SDR to HDR" },
  { value: "remove_glare", label: "Remove Glare" },
  { value: "deblur", label: "Deblur" },
  { value: "upscale", label: "Upscale" },
] as const satisfies ReadonlyArray<{ value: VideoToolId; label: string }>;

export type { VideoToolId } from "../../../types/video-tools";

export function getVideoToolLabel(tool: VideoToolId): string {
  return VIDEO_TOOL_OPTIONS.find(({ value }) => value === tool)?.label ?? tool;
}
