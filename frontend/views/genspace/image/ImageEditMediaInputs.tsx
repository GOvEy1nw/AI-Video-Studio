import { Image, X } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { detectMediaType } from "../../../lib/media-import";
import type {
  ImageEditMaskRecipe,
  ImageEditOutpaintRecipe,
  ImageEditToolMode,
} from "../../../types/image-edit";
import type { ModelProfile } from "../../../types/model-profiles";
import { GenPanelSection } from "../components/GenPanelSection";
import { ReframeEditor } from "../components/ReframeEditor";
import type { GenSpaceMediaInput } from "../types";
import { ImageMaskEditor } from "./ImageMaskEditor";
import { ImageMediaInputs } from "./ImageMediaInputs";

const EDIT_TOOLS: Array<{ id: ImageEditToolMode; label: string }> = [
  { id: "edit", label: "Edit" },
  { id: "retouch", label: "Retouch" },
  { id: "reframe", label: "Reframe" },
];

const DEFAULT_OUTPAINT: ImageEditOutpaintRecipe = {
  aspectMode: "16:9",
  padding: { top: 0, bottom: 0, left: 0, right: 0 },
};

export function ImageEditMediaInputs({
  image,
  onImageChange,
  references,
  onReferencesChange,
  profile,
  toolMode,
  onToolModeChange,
  mask,
  onMaskChange,
  outpaint,
  onOutpaintChange,
  disabled,
  resolveInputFileUrl,
  syncInputFileToGallery,
  reframeControls,
}: {
  image: GenSpaceMediaInput | null;
  onImageChange: (image: GenSpaceMediaInput | null) => void;
  references: GenSpaceMediaInput[];
  onReferencesChange: Dispatch<SetStateAction<GenSpaceMediaInput[]>>;
  profile: ModelProfile | undefined;
  toolMode: ImageEditToolMode;
  onToolModeChange: (mode: ImageEditToolMode) => void;
  mask: ImageEditMaskRecipe | null;
  onMaskChange: (mask: ImageEditMaskRecipe | null) => void;
  outpaint: ImageEditOutpaintRecipe | null;
  onOutpaintChange: (outpaint: ImageEditOutpaintRecipe | null) => void;
  disabled: boolean;
  resolveInputFileUrl: (
    file: File,
    sync?: (file: File) => Promise<string | null>,
  ) => Promise<string | null>;
  syncInputFileToGallery?: (file: File) => Promise<string | null>;
  reframeControls?: ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [sourceSize, setSourceSize] = useState({ width: 0, height: 0 });
  const sourceAspectRatio =
    sourceSize.width > 0 && sourceSize.height > 0
      ? sourceSize.width / sourceSize.height
      : 1;
  const inpaintingAvailable = !!profile?.capabilities.inpainting;
  const outpaintingAvailable = !!profile?.capabilities.outpainting;

  useEffect(() => {
    setSourceSize({ width: 0, height: 0 });
  }, [image?.url]);

  const handleSourceImageLoad = (width: number, height: number) => {
    if (width > 0 && height > 0) setSourceSize({ width, height });
  };

  const resetTools = () => {
    onToolModeChange("edit");
    onMaskChange(null);
    onOutpaintChange(null);
  };

  const assignUrl = (url: string) => {
    onImageChange({
      id: crypto.randomUUID(),
      url,
      role: "edit_image",
      type: "image",
    });
    resetTools();
  };

  const assignFile = async (file: File) => {
    if (detectMediaType(file.name, file.type) !== "image") return;
    const url = await resolveInputFileUrl(file, syncInputFileToGallery);
    if (url) assignUrl(url);
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const raw = event.dataTransfer.getData("asset");
    if (raw) {
      try {
        const asset = JSON.parse(raw) as { type: string; url: string };
        if (asset.type === "image") assignUrl(asset.url);
      } catch {
        return;
      }
      return;
    }
    const file = event.dataTransfer.files?.[0];
    if (file) await assignFile(file);
  };

  const referenceRoles =
    profile?.inputMedia.roles.filter(({ kind }) => kind === "reference") ?? [];
  const referencePolicy =
    profile && referenceRoles.length > 0 && profile.inputMedia.maxImages > 1
      ? {
          ...profile.inputMedia,
          supportsImageInputs: true,
          tooltipLabel: "Reference Images",
          maxImages: profile.inputMedia.maxImages - 1,
          defaultRole:
            referenceRoles.find(
              ({ role }) => role === profile.inputMedia.defaultRole,
            )?.role ??
            referenceRoles[0]?.role ??
            null,
          roles: referenceRoles,
        }
      : undefined;
  const referencesDisabled = disabled || toolMode !== "edit";

  return (
    <>
      <GenPanelSection collapsible={false}>
        {image ? (
          <div className="relative">
            {toolMode === "retouch" ? (
              <ImageMaskEditor
                imageUrl={image.url}
                sourceAspectRatio={sourceAspectRatio}
                onImageLoad={handleSourceImageLoad}
                value={mask}
                onChange={onMaskChange}
                disabled={disabled}
              />
            ) : toolMode === "reframe" ? (
              <ReframeEditor
                mediaType="image"
                mediaUrl={image.url}
                sourceWidth={sourceSize.width}
                sourceHeight={sourceSize.height}
                value={outpaint ?? DEFAULT_OUTPAINT}
                onChange={onOutpaintChange}
                onSourceDimensionsChange={handleSourceImageLoad}
                headerLabel="Reframe"
                headerTestId="image-edit-header"
                canvasTestId="image-edit-canvas"
                canvasClassName="w-full rounded-lg"
                canvasStyle={{ aspectRatio: sourceAspectRatio }}
                frameInset={0}
                initialZoom={100}
                controls={reframeControls}
                disabled={disabled}
              />
            ) : (
              <>
                <div
                  data-testid="image-edit-header"
                  className="flex h-8 items-center mb-2"
                >
                  <span className="text-2xs font-medium uppercase tracking-wider text-zinc-500">
                    Edit image
                  </span>
                </div>
                <div
                  data-testid="image-edit-canvas"
                  className="relative w-full overflow-hidden rounded-lg"
                  style={{ aspectRatio: sourceAspectRatio }}
                >
                  <img
                    src={image.url}
                    alt="Edit source"
                    draggable={false}
                    onLoad={(event) =>
                      handleSourceImageLoad(
                        event.currentTarget.naturalWidth,
                        event.currentTarget.naturalHeight,
                      )
                    }
                    className="absolute inset-0 h-full w-full select-none object-contain"
                  />
                </div>
              </>
            )}
            <button
              type="button"
              disabled={disabled}
              aria-label="Remove Edit Image"
              onClick={() => {
                onImageChange(null);
                resetTools();
              }}
              className="absolute right-2 top-12 z-20 rounded-full bg-black/80 p-1.5 text-zinc-300 shadow-md hover:bg-red-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <div
              role="tablist"
              aria-label="Image edit workflow"
              className="flex flex-row w-fit mx-auto justify-center mt-2 overflow-hidden rounded-lg gap-2 bg-zinc-800/35 p-2"
            >
              {EDIT_TOOLS.map(({ id, label }) => {
                const supported =
                  id === "edit" ||
                  (id === "retouch"
                    ? inpaintingAvailable
                    : outpaintingAvailable);
                return (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={toolMode === id}
                    disabled={disabled || !supported}
                    title={
                      supported
                        ? undefined
                        : `${label} is not supported by this model`
                    }
                    onClick={() => onToolModeChange(id)}
                    className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors ${
                      toolMode === id
                        ? "bg-blue-500 text-white shadow-sm"
                        : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300"
                    } disabled:cursor-not-allowed disabled:opacity-35`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <>
            <div
              data-testid="image-edit-header"
              className="flex h-8 items-center mb-2"
            >
              <span className="text-2xs font-medium uppercase tracking-wider text-zinc-500">
                Edit image
              </span>
            </div>
            <div
              className={`py-6 w-full overflow-hidden rounded-lg border-2 ${
                dragActive
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-dashed border-zinc-700 bg-zinc-900/50"
              }`}
              onDragEnter={() => setDragActive(true)}
              onDragLeave={() => setDragActive(false)}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = "copy";
              }}
              onDrop={handleDrop}
            >
              <button
                type="button"
                disabled={disabled}
                onClick={() => inputRef.current?.click()}
                aria-label="Add Edit Image"
                className="flex h-full w-full items-center justify-center disabled:cursor-not-allowed"
              >
                <span className="flex flex-col items-center gap-2 text-xs text-zinc-500">
                  <Image className="h-6 w-6" />
                  Drop or choose Edit Image
                </span>
              </button>
            </div>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void assignFile(file);
            event.target.value = "";
          }}
        />
      </GenPanelSection>

      {referencePolicy ? (
        <fieldset
          disabled={referencesDisabled}
          aria-label="Reference image controls"
          aria-disabled={referencesDisabled}
          className={`m-0 min-w-0 border-0 p-0 transition-opacity ${
            referencesDisabled ? "pointer-events-none opacity-40 grayscale" : ""
          }`}
        >
          <ImageMediaInputs
            title="Reference images"
            inputs={references}
            onChange={onReferencesChange}
            policy={referencePolicy}
            resolveInputFileUrl={resolveInputFileUrl}
            syncInputFileToGallery={syncInputFileToGallery}
          />
        </fieldset>
      ) : null}
    </>
  );
}
