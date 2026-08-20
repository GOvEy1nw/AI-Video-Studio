import { useRef, type DragEvent } from "react";
import { WandSparkles } from "lucide-react";
import { SettingsDropdown } from "../../../components/SettingsDropdown";
import { detectMediaType } from "../../../lib/media-import";
import { fileUrlToPath } from "../../../lib/url-to-path";
import type {
  UpscaleMediaKind,
  UpscaleMethod,
  UpscaleMethodId,
} from "../../../types/upscale";
import type { GenSpaceMediaInput } from "../types";
import { MediaInputSlot } from "./MediaInputSlot";

export function UpscalePanel({
  mediaKind,
  input,
  onInputChange,
  methods,
  method,
  onMethodChange,
  scale,
  onScaleChange,
  catalogError,
  isCatalogLoading,
  onRetryCatalog,
  disabled,
  resolveInputFileUrl,
  syncInputFileToGallery,
}: {
  mediaKind: UpscaleMediaKind;
  input: GenSpaceMediaInput | null;
  onInputChange: (input: GenSpaceMediaInput | null) => void;
  methods: UpscaleMethod[];
  method: UpscaleMethodId | null;
  onMethodChange: (method: UpscaleMethodId) => void;
  scale: number | null;
  onScaleChange: (scale: number) => void;
  catalogError: string | null;
  isCatalogLoading: boolean;
  onRetryCatalog: () => void;
  disabled: boolean;
  resolveInputFileUrl: (
    file: File,
    sync?: (file: File) => Promise<string | null>,
  ) => Promise<string | null>;
  syncInputFileToGallery?: (file: File) => Promise<string | null>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = methods.find((item) => item.id === method) ?? methods[0];
  const scales = selected?.scales ?? [];
  const scaleIndex = scale === null ? 0 : Math.max(0, scales.indexOf(scale));
  const setSource = (
    url: string,
    path?: string,
    assetId?: string,
    mediaDuration?: number,
  ) =>
    onInputChange({
      id: crypto.randomUUID(),
      assetId,
      url,
      path,
      mediaDuration,
      role: "upscale_source",
      type: mediaKind,
    });
  const addFile = async (file: File) => {
    if (detectMediaType(file.name, file.type) !== mediaKind) return;
    const url = await resolveInputFileUrl(file, syncInputFileToGallery);
    if (url) setSource(url, fileUrlToPath(url) ?? undefined);
  };
  const onDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const raw = event.dataTransfer.getData("asset");
    if (raw)
      try {
        const asset = JSON.parse(raw) as {
          id?: string;
          type?: string;
          url?: string;
          path?: string;
          duration?: number;
        };
        if (asset.type === mediaKind && asset.url)
          setSource(asset.url, asset.path, asset.id, asset.duration);
        return;
      } catch {
        return;
      }
    const file = event.dataTransfer.files?.[0];
    if (file) await addFile(file);
  };
  return (
    <div className="space-y-3 border-b border-zinc-800/60 bg-zinc-950/20 p-4">
      <SettingsDropdown
        title="UPSCALE METHOD"
        value={method ?? ""}
        onChange={(value) => {
          const next = value as UpscaleMethodId;
          onMethodChange(next);
          const first = methods.find((item) => item.id === next)?.scales[0];
          if (first !== undefined) onScaleChange(first);
        }}
        options={methods.map((item) => ({
          value: item.id,
          label: item.label,
        }))}
        placement="bottom"
        variant="model"
        triggerTitle="Method"
        trigger={
          <span className="min-w-0 flex-1">
            <span className="flex min-h-[20px] min-w-0 items-center gap-3">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center text-zinc-400">
                <WandSparkles className="h-4 w-4" />
              </span>
              <span className="max-w-full truncate text-xs font-semibold text-zinc-100">
                {selected?.label ??
                  (isCatalogLoading ? "Loading…" : "No methods")}
              </span>
            </span>
          </span>
        }
        triggerLabel="Upscale method"
        disabled={disabled || methods.length === 0}
      />
      <div className="flex w-full items-center gap-3">
        <MediaInputSlot
          item={input ?? undefined}
          kind={mediaKind}
          sizeClassName="w-full aspect-square"
          label="Source"
          title={`Choose ${mediaKind} to upscale`}
          ariaLabel={`Choose ${mediaKind} to upscale`}
          disabled={disabled}
          inputRef={inputRef}
          onRemove={() => onInputChange(null)}
          onDrop={onDrop}
        />
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={
          mediaKind === "image"
            ? "image/*,.png,.jpg,.jpeg,.webp"
            : "video/*,.mp4,.mov,.mkv,.avi,.webm"
        }
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void addFile(file);
          event.target.value = "";
        }}
      />
      <label className="block text-2xs text-zinc-400">
          <span className="mb-2 flex items-center justify-between gap-4">
            <span>Scale</span>
            <span className="font-mono text-zinc-200">
              {scale === null ? "—" : `${scale}×`}
            </span>
          </span>
          <input
            type="range"
            min={0}
            max={Math.max(0, scales.length - 1)}
            step={1}
            value={scaleIndex}
            onChange={(event) => {
              const next = scales[Number(event.currentTarget.value)];
              if (next !== undefined) onScaleChange(next);
            }}
            disabled={disabled || scales.length <= 1}
            aria-label="Upscale scale"
            aria-valuetext={scale === null ? "No scale" : `${scale}x`}
            className="w-full cursor-pointer accent-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          />
      </label>
      {catalogError ? (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 text-xs text-red-300"
        >
          <span>{catalogError}</span>
          <button
            type="button"
            onClick={onRetryCatalog}
            disabled={disabled}
            className="rounded bg-zinc-800 px-2 py-1 text-zinc-100 hover:bg-zinc-700 disabled:opacity-50"
          >
            Retry
          </button>
        </div>
      ) : null}
    </div>
  );
}
