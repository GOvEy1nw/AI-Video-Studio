import { Image } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { detectMediaType } from "../../../lib/media-import";
import type { ModelProfileInputMedia } from "../../../types/model-profiles";
import {
  getDefaultImageInputRole,
  normalizeImageInputsForProfile,
  removeMediaInput,
} from "../logic/media-inputs";
import type { GenSpaceMediaInput } from "../types";
import { GenPanelSection } from "../components/GenPanelSection";
import { CroppableMediaInputSlot } from "../components/CroppableMediaInputSlot";
import { MediaInputSlot } from "../components/MediaInputSlot";
import { MediaRoleMenu } from "../components/MediaRoleMenu";

export function ImageMediaInputs({
  title = "References",
  inputs,
  onChange,
  policy,
  resolveInputFileUrl,
  syncInputFileToGallery,
}: {
  title?: string;
  inputs: GenSpaceMediaInput[];
  onChange: Dispatch<SetStateAction<GenSpaceMediaInput[]>>;
  policy: ModelProfileInputMedia | undefined;
  resolveInputFileUrl: (
    file: File,
    sync?: (file: File) => Promise<string | null>,
  ) => Promise<string | null>;
  syncInputFileToGallery?: (file: File) => Promise<string | null>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fallbackRole = getDefaultImageInputRole(policy);
  const canAdd =
    !!policy?.supportsImageInputs && inputs.length < policy.maxImages;

  useEffect(() => {
    const normalized = normalizeImageInputsForProfile(inputs, policy);
    const changed =
      normalized.length !== inputs.length ||
      normalized.some(
        (input, index) =>
          input.id !== inputs[index]?.id || input.role !== inputs[index]?.role,
      );
    if (changed) onChange(normalized);
    if (activeId && !normalized.some(({ id }) => id === activeId)) {
      setActiveId(null);
    }
  }, [activeId, inputs, onChange, policy]);

  useEffect(() => {
    if (!activeId) return;
    const close = (event: PointerEvent) => {
      if (
        event.target instanceof Element &&
        event.target.closest("[data-media-menu]")
      ) {
        return;
      }
      setActiveId(null);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [activeId]);

  const addUrl = (url: string) => {
    if (!canAdd) return;
    const next = {
      id: crypto.randomUUID(),
      url,
      role: fallbackRole,
      type: "image" as const,
    };
    onChange([...inputs, next]);
    setActiveId(next.id);
  };

  const addFile = async (file: File) => {
    if (detectMediaType(file.name, file.type) !== "image") return;
    const url = await resolveInputFileUrl(file, syncInputFileToGallery);
    if (url) addUrl(url);
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    const raw = event.dataTransfer.getData("asset");
    if (raw) {
      try {
        const asset = JSON.parse(raw) as { type: string; url: string };
        if (asset.type === "image") addUrl(asset.url);
      } catch {
        return;
      }
      return;
    }
    const file = event.dataTransfer.files?.[0];
    if (file) await addFile(file);
  };

  if (!policy?.supportsImageInputs) return null;

  return (
    <GenPanelSection title={title} collapsible={false}>
      <div className="relative flex items-center gap-2 overflow-visible">
        {inputs.map((input) => {
          const role = policy.roles.find(({ role }) => role === input.role);
          return (
            <CroppableMediaInputSlot
              key={input.id}
              item={input}
              kind="image"
              badge={role?.label ?? input.role}
              title={role?.label ?? policy.tooltipLabel}
              active={activeId === input.id}
              removeLabel={role?.label ?? "image input"}
              onRemove={() => {
                onChange(removeMediaInput(inputs, input.id));
                setActiveId(null);
              }}
              onToggle={() =>
                setActiveId((current) =>
                  current === input.id ? null : input.id,
                )
              }
              onDrop={handleDrop}
              onCropChange={(crop) =>
                onChange((current) =>
                  current.map((item) =>
                    item.id === input.id
                      ? { ...item, crop: crop ?? undefined }
                      : item,
                  ),
                )
              }
              menu={
                <MediaRoleMenu
                  title="Image input"
                  selectedRole={input.role}
                  options={policy.roles.map((option) => ({
                    ...option,
                    icon: <Image className="h-3.5 w-3.5 shrink-0" />,
                  }))}
                  onSelect={(nextRole) => {
                    onChange(
                      inputs.map((item) =>
                        item.id === input.id
                          ? { ...item, role: nextRole }
                          : item,
                      ),
                    );
                    setActiveId(null);
                  }}
                />
              }
            />
          );
        })}
        {canAdd ? (
          <div
            onDragEnter={() => setIsDragOver(true)}
            onDragLeave={() => setIsDragOver(false)}
          >
            <MediaInputSlot
              kind="image"
              label={policy.tooltipLabel}
              title={policy.tooltipLabel}
              dragActive={isDragOver}
              inputRef={inputRef}
              onDrop={handleDrop}
            />
          </div>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void addFile(file);
          event.target.value = "";
        }}
      />
    </GenPanelSection>
  );
}
