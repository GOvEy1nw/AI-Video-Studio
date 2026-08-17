export type VideoToolId =
  | "reframe"
  | "extend"
  | "relight"
  | "colorize"
  | "clean_plate"
  | "lip_dub"
  | "decompression"
  | "sdr_to_hdr"
  | "remove_glare"
  | "deblur"
  | "upscale";

export type SubmittedVideoToolId = Exclude<VideoToolId, "reframe" | "upscale">;
