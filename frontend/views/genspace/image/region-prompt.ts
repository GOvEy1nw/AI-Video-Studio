import { buildFramingPrefix } from "../logic/framing";

export type RegionPromptElementType = "obj" | "text";
export type RegionPromptBbox = [number, number, number, number];

export interface RegionCameraSettings {
  camera: string;
  lens: string;
  focalLength: string;
  aperture: string;
  shutter: string;
  iso: string;
}

export interface RegionPromptElement {
  id: string;
  type: RegionPromptElementType;
  bbox: RegionPromptBbox;
  description: string;
  text: string;
  font: string;
  colorPalette: string[];
}

export interface RegionPromptState {
  highLevelDescription: string;
  background: string;
  style: {
    medium: string;
    aesthetics: string;
    lighting: string;
    artStyle: string;
    cameraSettings: RegionCameraSettings | null;
    photoDescription: string;
    colorPalette: string[];
  };
  elements: RegionPromptElement[];
}

export const MIN_REGION_PROMPT_BOX_SIZE = 60;

let fallbackElementId = 0;

function createElementId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  fallbackElementId += 1;
  return `region-${fallbackElementId}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function paletteValue(value: unknown) {
  if (typeof value === "string") {
    return normalizeRegionColorPalette(value, 16);
  }
  if (!Array.isArray(value)) return [];
  return normalizeRegionColorPalette(
    value.filter((item): item is string => typeof item === "string"),
    16,
  );
}

function fontFromDescription(description: string) {
  const match = /^Font:\s*(.*?)\.?$/i.exec(description.trim());
  return match?.[1]?.replace(/\.+$/, "").trim() ?? "";
}

export function createEmptyRegionPrompt(): RegionPromptState {
  return {
    highLevelDescription: "",
    background: "",
    style: {
      medium: "photograph",
      aesthetics: "",
      lighting: "",
      artStyle: "",
      cameraSettings: null,
      photoDescription: "",
      colorPalette: [],
    },
    elements: [],
  };
}

export function normalizeRegionPromptBbox(
  value: readonly number[],
): RegionPromptBbox {
  const yMin = clamp(value[0] ?? 0, 0, 1000 - MIN_REGION_PROMPT_BOX_SIZE);
  const xMin = clamp(value[1] ?? 0, 0, 1000 - MIN_REGION_PROMPT_BOX_SIZE);
  const yMax = clamp(
    value[2] ?? yMin + MIN_REGION_PROMPT_BOX_SIZE,
    yMin + MIN_REGION_PROMPT_BOX_SIZE,
    1000,
  );
  const xMax = clamp(
    value[3] ?? xMin + MIN_REGION_PROMPT_BOX_SIZE,
    xMin + MIN_REGION_PROMPT_BOX_SIZE,
    1000,
  );
  return [yMin, xMin, yMax, xMax];
}

export function createRegionPromptElement(
  index: number,
  type: RegionPromptElementType = "obj",
): RegionPromptElement {
  const offset = 70 + (index % 6) * 45;
  return {
    id: createElementId(),
    type,
    bbox: normalizeRegionPromptBbox([
      offset,
      offset,
      offset + 340,
      offset + 420,
    ]),
    description: "",
    text: "",
    font: "",
    colorPalette: [],
  };
}

export function moveRegionPromptBbox(
  bbox: RegionPromptBbox,
  deltaX: number,
  deltaY: number,
): RegionPromptBbox {
  const [yMin, xMin, yMax, xMax] = normalizeRegionPromptBbox(bbox);
  const width = xMax - xMin;
  const height = yMax - yMin;
  const nextX = clamp(xMin + deltaX, 0, 1000 - width);
  const nextY = clamp(yMin + deltaY, 0, 1000 - height);
  return [nextY, nextX, nextY + height, nextX + width];
}

export function resizeRegionPromptBbox(
  bbox: RegionPromptBbox,
  deltaX: number,
  deltaY: number,
): RegionPromptBbox {
  const [yMin, xMin, yMax, xMax] = normalizeRegionPromptBbox(bbox);
  return [
    yMin,
    xMin,
    clamp(yMax + deltaY, yMin + MIN_REGION_PROMPT_BOX_SIZE, 1000),
    clamp(xMax + deltaX, xMin + MIN_REGION_PROMPT_BOX_SIZE, 1000),
  ];
}

export function normalizeRegionColorPalette(
  value: string | readonly string[],
  limit: number,
) {
  const candidates =
    typeof value === "string" ? value.split(/[\s,;]+/) : [...value];
  const colors = candidates
    .map((color) => color.trim().toUpperCase())
    .filter((color) => /^#[0-9A-F]{6}$/.test(color));
  return [...new Set(colors)].slice(0, limit);
}

export function isPhotographMedium(value: string) {
  return value.trim().toLocaleLowerCase() === "photograph";
}

export function isRegionPromptReady(value: RegionPromptState) {
  const hasContent = Boolean(
    value.highLevelDescription.trim() ||
      value.background.trim() ||
      value.elements.some(
        (element) =>
          element.description.trim() ||
          (element.type === "text" && element.text.trim()),
      ),
  );
  const elementsComplete = value.elements.every(
    (element) =>
      (element.type === "text"
        ? Boolean(element.text.trim())
        : Boolean(element.description.trim())) &&
      element.font.trim().toLocaleLowerCase() !== "custom",
  );
  return (
    hasContent &&
    elementsComplete &&
    value.style.medium.trim().toLocaleLowerCase() !== "custom"
  );
}

export function serializeRegionPrompt(value: RegionPromptState) {
  if (!isRegionPromptReady(value)) return "";

  const medium = value.style.medium.trim() || "photograph";
  const photograph = isPhotographMedium(medium);
  const styleColors = normalizeRegionColorPalette(
    value.style.colorPalette,
    16,
  );
  const styleDescription: Record<string, string | string[]> = {
    aesthetics: value.style.aesthetics.trim(),
    lighting: value.style.lighting.trim(),
  };
  styleDescription[photograph ? "photo" : "art_style"] = photograph
    ? value.style.cameraSettings
      ? buildFramingPrefix(value.style.cameraSettings)
      : value.style.photoDescription.trim()
    : value.style.artStyle.trim();
  styleDescription.medium = medium;
  if (styleColors.length) styleDescription.color_palette = styleColors;

  const prompt: Record<string, unknown> = {
    high_level_description: value.highLevelDescription.trim(),
    style_description: styleDescription,
    compositional_deconstruction: {
      background: value.background.trim(),
      elements: value.elements.map((element) => {
        const colors = normalizeRegionColorPalette(element.colorPalette, 6);
        const serialized: Record<string, unknown> = {
          type: element.type,
          bbox: normalizeRegionPromptBbox(element.bbox),
        };
        if (element.type === "text") serialized.text = element.text.trim();
        const font = element.font.trim().replace(/\.+$/, "");
        serialized.desc =
          element.type === "text"
            ? font
              ? `Font: ${font}.`
              : element.description.trim() || "Typography."
            : element.description.trim();
        if (colors.length) serialized.color_palette = colors;
        return serialized;
      }),
    },
  };

  return JSON.stringify(prompt);
}

export function parseRegionPrompt(value: string): RegionPromptState {
  const empty = createEmptyRegionPrompt();
  const trimmed = value.trim();
  if (!trimmed) return empty;

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return { ...empty, highLevelDescription: value };
  }

  const root = asRecord(parsed);
  const composition = asRecord(root?.compositional_deconstruction);
  if (!root || (!("high_level_description" in root) && !composition)) {
    return { ...empty, highLevelDescription: value };
  }

  const style = asRecord(root.style_description);
  const photoDescription = stringValue(style?.photo);
  const medium =
    stringValue(style?.medium) ||
    (style && "art_style" in style ? "illustration" : "photograph");
  const elements = Array.isArray(composition?.elements)
    ? composition.elements.flatMap((candidate) => {
        const item = asRecord(candidate);
        if (!item || !Array.isArray(item.bbox)) return [];
        const numericBbox = item.bbox.filter(
          (coordinate): coordinate is number =>
            typeof coordinate === "number" && Number.isFinite(coordinate),
        );
        if (numericBbox.length !== 4) return [];
        const type: RegionPromptElementType =
          item.type === "text" ? "text" : "obj";
        const description = stringValue(item.desc);
        return [
          {
            id: createElementId(),
            type,
            bbox: normalizeRegionPromptBbox(numericBbox),
            description,
            text: type === "text" ? stringValue(item.text) : "",
            font: type === "text" ? fontFromDescription(description) : "",
            colorPalette: paletteValue(item.color_palette).slice(0, 6),
          },
        ];
      })
    : [];

  return {
    highLevelDescription: stringValue(root.high_level_description),
    background: stringValue(composition?.background),
    style: {
      medium,
      aesthetics: stringValue(style?.aesthetics),
      lighting: stringValue(style?.lighting),
      artStyle: stringValue(style?.art_style),
      cameraSettings: null,
      photoDescription,
      colorPalette: paletteValue(style?.color_palette),
    },
    elements,
  };
}
