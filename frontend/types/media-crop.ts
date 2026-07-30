export type MediaCropAspectRatio =
  | "freeform"
  | "1:1"
  | "4:3"
  | "3:4"
  | "16:9"
  | "9:16";

export interface MediaCropRecipe {
  aspectRatio: MediaCropAspectRatio;
  x: number;
  y: number;
  width: number;
  height: number;
}
