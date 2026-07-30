import { Plus, Trash2, X } from "lucide-react";
import {
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { FramingControl } from "../components/FramingControl";
import { GenPanelSection } from "../components/GenPanelSection";
import { PresetPromptPicker } from "../components/PresetPromptPicker";
import {
  createRegionPromptElement,
  isPhotographMedium,
  moveRegionPromptBbox,
  resizeRegionPromptBbox,
  type RegionPromptBbox,
  type RegionPromptElement,
  type RegionPromptState,
} from "./region-prompt";

const REGION_COLORS = [
  "#38BDF8",
  "#FB923C",
  "#A78BFA",
  "#4ADE80",
  "#F472B6",
  "#FACC15",
];

const MEDIUM_OPTIONS = [
  { value: "photograph", label: "Photograph" },
  { value: "illustration", label: "Illustration" },
  { value: "3d_render", label: "3D render" },
  { value: "painting", label: "Painting" },
  { value: "graphic_design", label: "Graphic design" },
] as const;

const FONT_OPTIONS = [
  "Arial",
  "Helvetica",
  "Times New Roman",
  "Georgia",
  "Garamond",
  "Verdana",
  "Futura",
  "Avenir",
  "Montserrat",
  "Bebas Neue",
  "Playfair Display",
  "Courier New",
];

const ART_STYLE_OPTIONS = [
  "Watercolor",
  "Oil painting",
  "Digital illustration",
  "Anime",
  "Comic book",
  "Line art",
  "Collage",
  "Surrealism",
  "Art deco",
];

const LIGHTING_OPTIONS = [
  "Natural light",
  "Golden hour",
  "Studio lighting",
  "Soft light",
  "Dramatic lighting",
  "Neon lighting",
  "Backlit",
  "Low key",
];

const AESTHETIC_OPTIONS = [
  "Cinematic",
  "Minimalist",
  "Editorial",
  "Vintage",
  "Futuristic",
  "Whimsical",
  "Moody",
  "Elegant",
  "Bold",
  "High detail",
];

type Interaction = {
  id: string;
  mode: "move" | "resize";
  startX: number;
  startY: number;
  bbox: RegionPromptBbox;
  canvasWidth: number;
  canvasHeight: number;
};

function parseAspectRatio(value: string): [number, number] {
  const [width, height] = value.split(":").map(Number);
  return width > 0 && height > 0 ? [width, height] : [1, 1];
}

function PromptPresetField({
  label,
  options,
  value,
  onChange,
  disabled,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <label className="block py-1.5">
      <span className="mb-1 block text-2xs font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </span>
      <div className="flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 p-1">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          aria-label={label}
          placeholder={`Describe ${label.toLocaleLowerCase()}...`}
          className="min-w-0 flex-1 bg-transparent px-1.5 py-0.5 text-xs text-white placeholder:text-zinc-600 focus:outline-hidden disabled:opacity-50"
        />
        <PresetPromptPicker
          label={label}
          groups={[{ label, options }]}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
      </div>
    </label>
  );
}

function ColorSwatches({
  label,
  colors,
  max,
  onChange,
  disabled,
}: {
  label: string;
  colors: string[];
  max: number;
  onChange: (colors: string[]) => void;
  disabled: boolean;
}) {
  const filledColors = colors.filter(Boolean).slice(0, max);
  const visibleCount = Math.min(max, filledColors.length + 1);
  const accessibleLabel = label.replace(/\s+colors$/i, "").toLocaleLowerCase();

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
        <span>{label}</span>
        <span aria-label={`${label} count`}>
          {filledColors.length}/{max}
        </span>
      </div>
      <div
        role="group"
        aria-label={`${label} swatches`}
        className="flex flex-wrap gap-1.5"
      >
        {Array.from({ length: visibleCount }, (_, index) => {
          const color = filledColors[index];
          return (
            <div key={index} className="relative h-7 w-7">
              <label
                title={
                  color
                    ? `Change ${accessibleLabel} color ${index + 1}`
                    : `Set ${accessibleLabel} color ${index + 1}`
                }
                className="block h-7 w-7 cursor-pointer rounded-full"
              >
                <input
                  type="color"
                  value={color ?? "#808080"}
                  onChange={(event) => {
                    const nextColor = event.target.value.toUpperCase();
                    if (color) {
                      onChange(
                        filledColors.map((current, currentIndex) =>
                          currentIndex === index ? nextColor : current,
                        ),
                      );
                    } else {
                      onChange([...filledColors, nextColor].slice(0, max));
                    }
                  }}
                  disabled={disabled}
                  aria-label={`Set ${accessibleLabel} color ${index + 1}`}
                  className="sr-only"
                />
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-zinc-600 text-zinc-500 transition-transform hover:scale-105"
                  style={
                    color
                      ? { backgroundColor: color }
                      : {
                          backgroundImage:
                            "linear-gradient(135deg, #18181B 25%, #27272A 25%, #27272A 50%, #18181B 50%, #18181B 75%, #27272A 75%)",
                          backgroundSize: "8px 8px",
                        }
                  }
                >
                  {!color ? <Plus className="h-3 w-3" /> : null}
                </span>
              </label>
              {color ? (
                <button
                  type="button"
                  onClick={() =>
                    onChange(
                      filledColors.filter(
                        (_, currentIndex) => currentIndex !== index,
                      ),
                    )
                  }
                  disabled={disabled}
                  aria-label={`Clear ${accessibleLabel} color ${index + 1}`}
                  className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-zinc-600 bg-zinc-950 text-zinc-400 hover:text-white disabled:opacity-40"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function RegionPromptEditor({
  value,
  onChange,
  aspectRatio,
  disabled,
  actions,
}: {
  value: RegionPromptState;
  onChange: (value: RegionPromptState) => void;
  aspectRatio: string;
  disabled: boolean;
  actions?: ReactNode;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const interactionRef = useRef<Interaction | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(
    value.elements[0]?.id ?? null,
  );
  const [aspectWidth, aspectHeight] = parseAspectRatio(aspectRatio);
  const ratio = aspectWidth / aspectHeight;
  const selectedIndex = value.elements.findIndex(
    (element) => element.id === selectedId,
  );
  const selected =
    selectedIndex >= 0
      ? value.elements[selectedIndex]
      : (value.elements[0] ?? null);
  const selectedDisplayIndex = selected ? value.elements.indexOf(selected) : -1;
  const selectedColor =
    selectedDisplayIndex >= 0
      ? REGION_COLORS[selectedDisplayIndex % REGION_COLORS.length]
      : REGION_COLORS[0];
  const selectedFontOption = selected?.font
    ? FONT_OPTIONS.includes(selected.font)
      ? selected.font
      : "custom"
    : "";
  const selectedCustomFont =
    selectedFontOption === "custom" && selected?.font !== "custom"
      ? (selected?.font ?? "")
      : "";
  const mediumOption = MEDIUM_OPTIONS.some(
    (option) => option.value === value.style.medium,
  )
    ? value.style.medium
    : "custom";
  const customMedium =
    mediumOption === "custom" && value.style.medium !== "custom"
      ? value.style.medium
      : "";

  const updateElement = (
    id: string,
    update: (element: RegionPromptElement) => RegionPromptElement,
  ) => {
    onChange({
      ...value,
      elements: value.elements.map((element) =>
        element.id === id ? update(element) : element,
      ),
    });
  };

  const addBox = () => {
    const element = createRegionPromptElement(value.elements.length);
    onChange({ ...value, elements: [...value.elements, element] });
    setSelectedId(element.id);
  };

  const deleteSelected = () => {
    if (!selected) return;
    const nextElements = value.elements.filter(
      (element) => element.id !== selected.id,
    );
    onChange({ ...value, elements: nextElements });
    setSelectedId(nextElements[Math.max(0, selectedIndex - 1)]?.id ?? null);
  };

  const startInteraction = (
    event: PointerEvent<HTMLElement>,
    element: RegionPromptElement,
    mode: Interaction["mode"],
  ) => {
    if (disabled) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect?.width || !rect.height) return;
    event.preventDefault();
    event.stopPropagation();
    setSelectedId(element.id);
    event.currentTarget.setPointerCapture(event.pointerId);
    interactionRef.current = {
      id: element.id,
      mode,
      startX: event.clientX,
      startY: event.clientY,
      bbox: element.bbox,
      canvasWidth: rect.width,
      canvasHeight: rect.height,
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const interaction = interactionRef.current;
    if (!interaction || disabled) return;
    const deltaX =
      ((event.clientX - interaction.startX) / interaction.canvasWidth) * 1000;
    const deltaY =
      ((event.clientY - interaction.startY) / interaction.canvasHeight) * 1000;
    const bbox =
      interaction.mode === "move"
        ? moveRegionPromptBbox(interaction.bbox, deltaX, deltaY)
        : resizeRegionPromptBbox(interaction.bbox, deltaX, deltaY);
    updateElement(interaction.id, (element) => ({ ...element, bbox }));
  };

  const moveWithKeyboard = (
    event: KeyboardEvent<HTMLElement>,
    element: RegionPromptElement,
  ) => {
    if (disabled) return;
    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      const nextElements = value.elements.filter(
        (candidate) => candidate.id !== element.id,
      );
      onChange({ ...value, elements: nextElements });
      setSelectedId(nextElements[0]?.id ?? null);
      return;
    }
    const step = event.shiftKey ? 50 : 10;
    const deltaX =
      event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0;
    const deltaY =
      event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0;
    if (!deltaX && !deltaY) return;
    event.preventDefault();
    updateElement(element.id, (current) => ({
      ...current,
      bbox: moveRegionPromptBbox(current.bbox, deltaX, deltaY),
    }));
  };

  const resizeWithKeyboard = (
    event: KeyboardEvent<HTMLButtonElement>,
    element: RegionPromptElement,
  ) => {
    if (disabled) return;
    const step = event.shiftKey ? 50 : 10;
    const deltaX =
      event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0;
    const deltaY =
      event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0;
    if (!deltaX && !deltaY) return;
    event.preventDefault();
    event.stopPropagation();
    updateElement(element.id, (current) => ({
      ...current,
      bbox: resizeRegionPromptBbox(current.bbox, deltaX, deltaY),
    }));
  };

  return (
    <>
      <GenPanelSection title="Global Prompt" collapsed>
        <div className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              High-level description
            </span>
            <textarea
              value={value.highLevelDescription}
              onChange={(event) =>
                onChange({ ...value, highLevelDescription: event.target.value })
              }
              disabled={disabled}
              aria-label="High-level description"
              placeholder="Describe the whole image in one or two sentences..."
              className="h-20 w-full resize-y rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-sm leading-5 text-white placeholder:text-zinc-600 focus:border-sky-500 focus:outline-hidden disabled:opacity-50"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              Background
            </span>
            <textarea
              value={value.background}
              onChange={(event) =>
                onChange({ ...value, background: event.target.value })
              }
              disabled={disabled}
              aria-label="Background description"
              placeholder="Describe environment and background..."
              className="h-16 w-full resize-y rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2 text-xs leading-5 text-white placeholder:text-zinc-600 focus:border-sky-500 focus:outline-hidden disabled:opacity-50"
            />
          </label>
        </div>
      </GenPanelSection>
      <GenPanelSection title="Region" collapsed={false}>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={addBox}
              disabled={disabled}
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:border-zinc-500 hover:text-white disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" />
              Add box
            </button>
            <button
              type="button"
              onClick={deleteSelected}
              disabled={disabled || !selected}
              aria-label="Delete selected region"
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:border-red-500/60 hover:text-red-300 disabled:opacity-40"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
            {actions}
          </div>

          <div className="rounded-xl border border-zinc-800 bg-black/40 p-2">
            <div
              ref={canvasRef}
              role="group"
              aria-label={`Region layout canvas ${aspectRatio}`}
              data-testid="region-layout-canvas"
              onPointerDown={(event) => {
                if (event.target === event.currentTarget) setSelectedId(null);
              }}
              onPointerMove={handlePointerMove}
              onPointerUp={() => {
                interactionRef.current = null;
              }}
              onPointerCancel={() => {
                interactionRef.current = null;
              }}
              className="relative mx-auto overflow-hidden rounded-lg border border-zinc-700 bg-black"
              style={{
                aspectRatio: `${aspectWidth} / ${aspectHeight}`,
                width: ratio >= 1 ? "100%" : `${ratio * 100}%`,
                touchAction: "none",
                backgroundImage:
                  "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)",
                backgroundSize: "20% 20%",
              }}
            >
              {value.elements.map((element, index) => {
                const [yMin, xMin, yMax, xMax] = element.bbox;
                const color = REGION_COLORS[index % REGION_COLORS.length];
                const isSelected = element.id === selected?.id;
                return (
                  <div
                    key={element.id}
                    role="group"
                    tabIndex={disabled ? -1 : 0}
                    aria-label={`Region ${index + 1}: ${
                      element.description || element.text || "Untitled"
                    }`}
                    onClick={() => setSelectedId(element.id)}
                    onPointerDown={(event) =>
                      startInteraction(event, element, "move")
                    }
                    onKeyDown={(event) => moveWithKeyboard(event, element)}
                    className={`absolute overflow-hidden rounded-lg border-2 text-left outline-hidden transition-shadow focus-visible:ring-2 focus-visible:ring-white ${
                      disabled ? "cursor-default" : "cursor-move"
                    }`}
                    style={{
                      top: `${yMin / 10}%`,
                      left: `${xMin / 10}%`,
                      width: `${(xMax - xMin) / 10}%`,
                      height: `${(yMax - yMin) / 10}%`,
                      borderColor: color,
                      backgroundColor: `${color}18`,
                      boxShadow: isSelected
                        ? `0 0 0 2px ${color}55`
                        : undefined,
                    }}
                  >
                    <span className="absolute left-1.5 top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border border-white/35 bg-black/80 px-1 text-[10px] font-semibold text-white">
                      {index + 1}
                    </span>
                    <span className="absolute inset-x-2 bottom-2 line-clamp-3 text-[10px] font-semibold leading-3 text-white [text-shadow:0_1px_2px_#000]">
                      {element.description || element.text || "Describe region"}
                    </span>
                    <button
                      type="button"
                      aria-label={`Resize region ${index + 1}`}
                      disabled={disabled}
                      onClick={(event) => event.stopPropagation()}
                      onPointerDown={(event) =>
                        startInteraction(event, element, "resize")
                      }
                      onKeyDown={(event) => resizeWithKeyboard(event, element)}
                      className="absolute bottom-0 right-0 h-7 w-7 cursor-se-resize disabled:cursor-default"
                    >
                      <span className="absolute bottom-1 right-1 h-3 w-3 border-b-2 border-r-2 border-white" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {selected ? (
            <div
              data-testid="selected-region-settings"
              data-region-color={selectedColor}
              className="rounded-xl border p-3"
              style={{
                borderColor: `${selectedColor}88`,
                backgroundColor: `${selectedColor}0D`,
              }}
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <span
                  className="shrink-0 text-xs font-semibold"
                  style={{ color: selectedColor }}
                >
                  Selected region {selectedDisplayIndex + 1}
                </span>
                <div className="flex min-w-40 flex-1 rounded-md bg-zinc-950 p-0.5">
                  {(["obj", "text"] as const).map((type) => {
                    const active = selected.type === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() =>
                          updateElement(selected.id, (element) => ({
                            ...element,
                            type,
                            description:
                              type === element.type ? element.description : "",
                          }))
                        }
                        disabled={disabled}
                        aria-pressed={active}
                        className="flex-1 rounded px-2 py-1.5 text-[10px] font-medium text-zinc-500 transition-colors hover:text-zinc-300"
                        style={
                          active
                            ? {
                                backgroundColor: `${selectedColor}25`,
                                color: selectedColor,
                              }
                            : undefined
                        }
                      >
                        {type === "obj" ? "Object" : "Text"}
                      </button>
                    );
                  })}
                </div>
              </div>

              {selected.type === "text" ? (
                <div className="space-y-3">
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                      Text Copy
                    </span>
                    <input
                      value={selected.text}
                      onChange={(event) =>
                        updateElement(selected.id, (element) => ({
                          ...element,
                          text: event.target.value,
                        }))
                      }
                      disabled={disabled}
                      aria-label="Text Copy"
                      placeholder="Text Copy Goes Here..."
                      className="w-full rounded-lg border border-zinc-800 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-sky-500 focus:outline-hidden"
                    />
                  </label>
                  <div>
                    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                      Font
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={selectedFontOption}
                        onChange={(event) =>
                          updateElement(selected.id, (element) => ({
                            ...element,
                            font: event.target.value,
                            description: "",
                          }))
                        }
                        disabled={disabled}
                        aria-label="Region font preset"
                        className="min-w-0 rounded-lg border border-zinc-800 bg-black/40 px-2 py-2 text-xs text-white focus:border-sky-500 focus:outline-hidden disabled:opacity-50"
                      >
                        <option value="">Select font</option>
                        {FONT_OPTIONS.map((font) => (
                          <option key={font} value={font}>
                            {font}
                          </option>
                        ))}
                        <option value="custom">Custom</option>
                      </select>
                      <input
                        value={selectedCustomFont}
                        onChange={(event) =>
                          updateElement(selected.id, (element) => ({
                            ...element,
                            font: event.target.value || "custom",
                            description: "",
                          }))
                        }
                        disabled={disabled || selectedFontOption !== "custom"}
                        aria-label="Custom region font"
                        placeholder="Custom font..."
                        className="min-w-0 rounded-lg border border-zinc-800 bg-black/40 px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-sky-500 focus:outline-hidden disabled:opacity-40"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <label className="block">
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                    Region description
                  </span>
                  <textarea
                    value={selected.description}
                    onChange={(event) =>
                      updateElement(selected.id, (element) => ({
                        ...element,
                        description: event.target.value,
                      }))
                    }
                    disabled={disabled}
                    aria-label="Region description"
                    placeholder="Describe subject, appearance, and action..."
                    className="h-20 w-full resize-y rounded-lg border border-zinc-800 bg-black/40 px-3 py-2 text-sm leading-5 text-white placeholder:text-zinc-600 focus:border-sky-500 focus:outline-hidden"
                  />
                </label>
              )}

              <div className="mt-3">
                <ColorSwatches
                  label="Region colors"
                  colors={selected.colorPalette}
                  max={6}
                  disabled={disabled}
                  onChange={(colorPalette) =>
                    updateElement(selected.id, (element) => ({
                      ...element,
                      colorPalette,
                    }))
                  }
                />
              </div>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-zinc-800 px-3 py-4 text-center text-xs text-zinc-600">
              Add or select a box to describe a region.
            </p>
          )}
        </div>
      </GenPanelSection>
      <GenPanelSection title="Style" collapsed={false} borderBottom={false}>
        <div className="space-y-3">
          <div>
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              Medium
            </span>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={mediumOption}
                onChange={(event) =>
                  onChange({
                    ...value,
                    style: { ...value.style, medium: event.target.value },
                  })
                }
                disabled={disabled}
                aria-label="Region medium preset"
                className="min-w-0 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-white focus:border-sky-500 focus:outline-hidden disabled:opacity-50"
              >
                {MEDIUM_OPTIONS.map((medium) => (
                  <option key={medium.value} value={medium.value}>
                    {medium.label}
                  </option>
                ))}
                <option value="custom">Custom</option>
              </select>
              <input
                value={customMedium}
                onChange={(event) =>
                  onChange({
                    ...value,
                    style: {
                      ...value.style,
                      medium: event.target.value || "custom",
                    },
                  })
                }
                disabled={disabled || mediumOption !== "custom"}
                aria-label="Custom region medium"
                placeholder="Custom medium..."
                className="min-w-0 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:border-sky-500 focus:outline-hidden disabled:opacity-40"
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-2 items-center justify-start gap-2">
              {isPhotographMedium(value.style.medium) ? (
                <div>
                  <span className="mb-1 block text-2xs font-semibold uppercase tracking-wide text-zinc-500">
                    Photo
                  </span>
                  <FramingControl
                    value={value.style.cameraSettings}
                    onChange={(cameraSettings) =>
                      onChange({
                        ...value,
                        style: {
                          ...value.style,
                          cameraSettings,
                          photoDescription: "",
                        },
                      })
                    }
                    disabled={disabled}
                    buttonLabel="Camera settings"
                  />
                </div>
              ) : (
                <PromptPresetField
                  label="Art style"
                  options={ART_STYLE_OPTIONS}
                  value={value.style.artStyle}
                  onChange={(artStyle) =>
                    onChange({
                      ...value,
                      style: { ...value.style, artStyle },
                    })
                  }
                  disabled={disabled}
                />
              )}
              <PromptPresetField
                label="Lighting"
                options={LIGHTING_OPTIONS}
                value={value.style.lighting}
                onChange={(lighting) =>
                  onChange({
                    ...value,
                    style: { ...value.style, lighting },
                  })
                }
                disabled={disabled}
              />
            </div>
            <div className="grid grid-cols-2 items-center justify-start gap-2">
              <PromptPresetField
                label="Aesthetics"
                options={AESTHETIC_OPTIONS}
                value={value.style.aesthetics}
                onChange={(aesthetics) =>
                  onChange({
                    ...value,
                    style: { ...value.style, aesthetics },
                  })
                }
                disabled={disabled}
              />
              <ColorSwatches
                label="Global colors"
                colors={value.style.colorPalette}
                max={16}
                disabled={disabled}
                onChange={(colorPalette) =>
                  onChange({
                    ...value,
                    style: { ...value.style, colorPalette },
                  })
                }
              />
            </div>
          </div>
        </div>
      </GenPanelSection>
    </>
  );
}
