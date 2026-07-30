import { Expand, Image, Paintbrush, X } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { detectMediaType } from "../../../lib/media-import";
import type {
  ImageEditAspectMode,
  ImageEditMaskRecipe,
  ImageEditOutpaintRecipe,
} from "../../../types/image-edit";
import type { ModelProfile } from "../../../types/model-profiles";
import { GenPanelSection } from "../components/GenPanelSection";
import type { GenSpaceMediaInput } from "../types";
import { ImageMaskEditorModal } from "./ImageMaskEditorModal";
import { ImageMediaInputs } from "./ImageMediaInputs";
import { ImageOutpaintModal } from "./ImageOutpaintModal";

function imageAspectMode(value: string): ImageEditAspectMode {
  return value === "16:9" || value === "9:16" ? value : "1:1";
}

export function ImageEditMediaInputs({
  image,
  onImageChange,
  references,
  onReferencesChange,
  profile,
  mask,
  onMaskChange,
  outpaint,
  onOutpaintChange,
  aspectRatio,
  onAspectRatioChange,
  disabled,
  resolveInputFileUrl,
  syncInputFileToGallery,
}: {
  image: GenSpaceMediaInput | null;
  onImageChange: (image: GenSpaceMediaInput | null) => void;
  references: GenSpaceMediaInput[];
  onReferencesChange: Dispatch<SetStateAction<GenSpaceMediaInput[]>>;
  profile: ModelProfile | undefined;
  mask: ImageEditMaskRecipe | null;
  onMaskChange: (mask: ImageEditMaskRecipe | null) => void;
  outpaint: ImageEditOutpaintRecipe | null;
  onOutpaintChange: (outpaint: ImageEditOutpaintRecipe | null) => void;
  aspectRatio: string;
  onAspectRatioChange: (aspectRatio: ImageEditAspectMode) => void;
  disabled: boolean;
  resolveInputFileUrl: (
    file: File,
    sync?: (file: File) => Promise<string | null>,
  ) => Promise<string | null>;
  syncInputFileToGallery?: (file: File) => Promise<string | null>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [maskOpen, setMaskOpen] = useState(false);
  const [outpaintOpen, setOutpaintOpen] = useState(false);

  useEffect(() => {
    if (!profile) return;
    if (mask && !profile.capabilities.inpainting) onMaskChange(null);
    if (outpaint && !profile.capabilities.outpainting) onOutpaintChange(null);
  }, [mask, onMaskChange, onOutpaintChange, outpaint, profile]);

  const assignUrl = (url: string) => {
    onImageChange({
      id: crypto.randomUUID(),
      url,
      role: "edit_image",
      type: "image",
    });
    onMaskChange(null);
    onOutpaintChange(null);
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
  const maskedEdit = !!mask || !!outpaint;
  const referencesAvailable =
    !maskedEdit || !!profile?.capabilities.maskedEditReferences;

  return (
    <>
      <GenPanelSection title="Edit image" collapsible={false}>
        <div
          className={`group relative aspect-square w-full overflow-hidden rounded-lg border-2 ${
            dragActive
              ? "border-blue-500 bg-blue-500/10"
              : image
                ? "border-zinc-700 bg-black"
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
            aria-label={image ? "Replace Edit Image" : "Add Edit Image"}
            className="flex h-full w-full items-center justify-center disabled:cursor-not-allowed"
          >
            {image ? (
              <img
                src={image.url}
                alt=""
                className="h-full w-full object-contain"
              />
            ) : (
              <span className="flex flex-col items-center gap-2 text-xs text-zinc-500">
                <Image className="h-6 w-6" />
                Drop or choose Edit Image
              </span>
            )}
          </button>
          {image ? (
            <button
              type="button"
              aria-label="Remove Edit Image"
              onClick={() => {
                onImageChange(null);
                onMaskChange(null);
                onOutpaintChange(null);
              }}
              className="absolute right-2 top-2 rounded-full bg-black/75 p-1.5 text-zinc-300 opacity-0 transition-opacity hover:bg-red-500 hover:text-white group-hover:opacity-100 focus-visible:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
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
        {image &&
        (profile?.capabilities.inpainting ||
          profile?.capabilities.outpainting) ? (
          <div className="mt-2 flex items-center gap-2">
            {profile.capabilities.inpainting ? (
              <button
                type="button"
                disabled={disabled}
                onClick={() => setMaskOpen(true)}
                className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs ${
                  mask
                    ? "border-blue-500 bg-blue-500/15 text-blue-200"
                    : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                <Paintbrush className="h-3.5 w-3.5" />
                Mask
              </button>
            ) : null}
            {profile.capabilities.outpainting ? (
              <button
                type="button"
                disabled={disabled}
                onClick={() => setOutpaintOpen(true)}
                className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs ${
                  outpaint
                    ? "border-blue-500 bg-blue-500/15 text-blue-200"
                    : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                <Expand className="h-3.5 w-3.5" />
                Outpaint
              </button>
            ) : null}
            {mask ? (
              <button
                type="button"
                onClick={() => onMaskChange(null)}
                className="ml-auto text-[11px] text-zinc-500 hover:text-zinc-300"
              >
                Clear mask
              </button>
            ) : null}
            {outpaint ? (
              <button
                type="button"
                onClick={() => onOutpaintChange(null)}
                className="text-[11px] text-zinc-500 hover:text-zinc-300"
              >
                Clear outpaint
              </button>
            ) : null}
          </div>
        ) : null}
      </GenPanelSection>

      {referencePolicy && referencesAvailable ? (
        <ImageMediaInputs
          title="Reference images"
          inputs={references}
          onChange={onReferencesChange}
          policy={referencePolicy}
          resolveInputFileUrl={resolveInputFileUrl}
          syncInputFileToGallery={syncInputFileToGallery}
        />
      ) : maskedEdit && references.length > 0 ? (
        <p className="px-4 py-2 text-xs text-amber-300/80">
          Selected model cannot combine reference images with Mask or Outpaint.
        </p>
      ) : null}

      {image && maskOpen ? (
        <ImageMaskEditorModal
          imageUrl={image.url}
          value={mask}
          onClose={() => setMaskOpen(false)}
          onApply={(next) => {
            onMaskChange(next);
            setMaskOpen(false);
          }}
        />
      ) : null}
      {image && outpaintOpen ? (
        <ImageOutpaintModal
          imageUrl={image.url}
          value={outpaint}
          initialAspectMode={imageAspectMode(aspectRatio)}
          onClose={() => setOutpaintOpen(false)}
          onApply={(next) => {
            onOutpaintChange(next);
            onAspectRatioChange(next.aspectMode);
            setOutpaintOpen(false);
          }}
        />
      ) : null}
    </>
  );
}
