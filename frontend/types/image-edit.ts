export interface ImageEditPoint {
  x: number;
  y: number;
}

export type ImageEditToolMode = "edit" | "retouch" | "reframe";

export interface ImageEditBrushOperation {
  kind: "brush";
  size: number;
  points: ImageEditPoint[];
}

export interface ImageEditShapeOperation {
  kind: "rectangle" | "ellipse";
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ImageEditMaskOperation =
  | ImageEditBrushOperation
  | ImageEditShapeOperation;

export interface ImageEditMaskRecipe {
  schemaVersion: 1;
  operations: ImageEditMaskOperation[];
}

export type ImageEditAspectMode =
  | "1:1"
  | "16:9"
  | "9:16"
  | "21:9"
  | "9:21"
  | "4:3"
  | "3:4"
  | "3:2"
  | "2:3"
  | "custom";

export interface ImageEditOutpaintRecipe {
  aspectMode: ImageEditAspectMode;
  padding: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

export interface ImageEditRequest {
  image: { path: string };
  mask?: ImageEditMaskRecipe;
  outpaint?: ImageEditOutpaintRecipe;
}
