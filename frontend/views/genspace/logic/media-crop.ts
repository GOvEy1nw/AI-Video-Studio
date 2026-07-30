import type {
  MediaCropAspectRatio,
  MediaCropRecipe,
} from "../../../types/media-crop";

export const MEDIA_CROP_ASPECT_RATIOS: ReadonlyArray<{
  value: MediaCropAspectRatio;
  label: string;
}> = [
  { value: "freeform", label: "Freeform" },
  { value: "1:1", label: "1:1" },
  { value: "4:3", label: "4:3" },
  { value: "3:4", label: "3:4" },
  { value: "16:9", label: "16:9" },
  { value: "9:16", label: "9:16" },
];

export type MediaCropCorner = "nw" | "ne" | "sw" | "se";

const MIN_CROP_SIZE = 0.05;
const ASPECT_VALUES: Record<Exclude<MediaCropAspectRatio, "freeform">, number> =
  {
    "1:1": 1,
    "4:3": 4 / 3,
    "3:4": 3 / 4,
    "16:9": 16 / 9,
    "9:16": 9 / 16,
  };

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function safeSourceAspect(sourceAspect: number): number {
  return Number.isFinite(sourceAspect) && sourceAspect > 0 ? sourceAspect : 1;
}

export function createFullMediaCrop(): MediaCropRecipe {
  return {
    aspectRatio: "freeform",
    x: 0,
    y: 0,
    width: 1,
    height: 1,
  };
}

export function fitMediaCropToAspect(
  aspectRatio: MediaCropAspectRatio,
  sourceAspect: number,
): MediaCropRecipe {
  if (aspectRatio === "freeform") return createFullMediaCrop();
  const normalizedRatio =
    ASPECT_VALUES[aspectRatio] / safeSourceAspect(sourceAspect);
  const width = normalizedRatio >= 1 ? 1 : normalizedRatio;
  const height = normalizedRatio >= 1 ? 1 / normalizedRatio : 1;
  return {
    aspectRatio,
    x: (1 - width) / 2,
    y: (1 - height) / 2,
    width,
    height,
  };
}

export function moveMediaCrop(
  crop: MediaCropRecipe,
  deltaX: number,
  deltaY: number,
): MediaCropRecipe {
  return {
    ...crop,
    x: clamp(crop.x + deltaX, 0, 1 - crop.width),
    y: clamp(crop.y + deltaY, 0, 1 - crop.height),
  };
}

export function resizeMediaCrop(
  crop: MediaCropRecipe,
  corner: MediaCropCorner,
  pointerX: number,
  pointerY: number,
  sourceAspect: number,
): MediaCropRecipe {
  const west = corner.endsWith("w");
  const north = corner.startsWith("n");
  const oppositeX = west ? crop.x + crop.width : crop.x;
  const oppositeY = north ? crop.y + crop.height : crop.y;
  const maxWidth = west ? oppositeX : 1 - oppositeX;
  const maxHeight = north ? oppositeY : 1 - oppositeY;
  const desiredWidth = Math.abs(clamp(pointerX, 0, 1) - oppositeX);
  const desiredHeight = Math.abs(clamp(pointerY, 0, 1) - oppositeY);

  let width: number;
  let height: number;
  if (crop.aspectRatio === "freeform") {
    const minWidth = Math.min(MIN_CROP_SIZE, maxWidth);
    const minHeight = Math.min(MIN_CROP_SIZE, maxHeight);
    width = clamp(desiredWidth, minWidth, maxWidth);
    height = clamp(desiredHeight, minHeight, maxHeight);
  } else {
    const normalizedRatio =
      ASPECT_VALUES[crop.aspectRatio] / safeSourceAspect(sourceAspect);
    const maxLockedWidth = Math.min(maxWidth, maxHeight * normalizedRatio);
    const minLockedWidth = Math.min(
      maxLockedWidth,
      Math.max(MIN_CROP_SIZE, MIN_CROP_SIZE * normalizedRatio),
    );
    const pointerRatio =
      desiredHeight > 0 ? desiredWidth / desiredHeight : Number.POSITIVE_INFINITY;
    const requestedWidth =
      pointerRatio > normalizedRatio
        ? desiredHeight * normalizedRatio
        : desiredWidth;
    width = clamp(requestedWidth, minLockedWidth, maxLockedWidth);
    height = width / normalizedRatio;
  }

  return {
    ...crop,
    x: west ? oppositeX - width : oppositeX,
    y: north ? oppositeY - height : oppositeY,
    width,
    height,
  };
}

export function isFullMediaCrop(crop: MediaCropRecipe): boolean {
  const epsilon = 0.0001;
  return (
    Math.abs(crop.x) < epsilon &&
    Math.abs(crop.y) < epsilon &&
    Math.abs(crop.width - 1) < epsilon &&
    Math.abs(crop.height - 1) < epsilon
  );
}
