export type UpscaleMediaKind = "image" | "video";
export type UpscaleMethodId = "lanczos" | "flashvsr" | "flashvsr2pass" | "seedvr2" | "ltx25";

export interface UpscaleMethod {
  id: UpscaleMethodId;
  label: string;
  mediaKinds: UpscaleMediaKind[];
  scales: number[];
}

export interface UpscaleRecipe {
  schemaVersion: 1;
  mediaKind: UpscaleMediaKind;
  method: UpscaleMethodId;
  scale: number;
  source: { url: string; path?: string; type: UpscaleMediaKind };
}
