import { Image, Music, Video } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { GenPanelSection } from "./GenPanelSection";

type MediaMention = {
  alias: string;
  type: "image" | "video" | "audio";
  url: string;
};

type ActiveMention = { start: number; end: number; query: string };

function getActiveMention(value: string, end: number): ActiveMention | null {
  let start = end;
  while (start > 0 && !/\s/.test(value[start - 1])) start -= 1;
  const token = value.slice(start, end);
  return token.startsWith("@") ? { start, end, query: token.slice(1).toLowerCase() } : null;
}

function MentionIcon({ type }: { type: MediaMention["type"] }) {
  const Icon = type === "image" ? Image : type === "video" ? Video : Music;
  return <Icon className="h-3.5 w-3.5" />;
}

export function PromptEditor({
  title = "",
  value,
  onChange,
  onSubmit,
  canSubmit,
  disabled,
  placeholder,
  leading,
  bottomRight,
  children,
  actions,
  maxLength,
  height = "h-36",
  mediaAliases,
  mediaMentions,
  onAddMedia,
  mediaAddDisabled,
}: {
  title?: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  canSubmit: boolean;
  disabled: boolean;
  placeholder: string;
  leading?: ReactNode;
  bottomRight?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  maxLength?: number;
  height?: string;
  mediaAliases?: string[];
  mediaMentions?: MediaMention[];
  onAddMedia?: (type: MediaMention["type"]) => void;
  mediaAddDisabled?: Partial<Record<MediaMention["type"], boolean>>;
}) {
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const [mention, setMention] = useState<ActiveMention | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const mentionOptions = mention
    ? [
        ...(["image", "video", "audio"] as const).map((type) => ({ kind: "add" as const, type, label: `Add ${type}` })),
        ...(mediaMentions ?? [])
          .filter((item) => item.alias.slice(1).toLowerCase().includes(mention.query))
          .map((item) => ({ kind: "alias" as const, ...item, label: item.alias.slice(1) })),
      ]
    : [];

  useEffect(() => {
    if (!mention) return;
    const close = (event: PointerEvent) => {
      if (menuRef.current?.contains(event.target as Node) || editorRef.current?.contains(event.target as Node)) return;
      setMention(null);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [mention]);

  const updateMention = (target: HTMLTextAreaElement) => {
    setMention(mediaMentions ? getActiveMention(target.value, target.selectionEnd) : null);
    setActiveIndex(0);
  };

  const selectMention = (index: number) => {
    const option = mentionOptions[index];
    if (!mention || !option) return;
    if (option.kind === "add" && mediaAddDisabled?.[option.type]) return;
    const replacement = option.kind === "alias" ? option.alias : "";
    onChange(`${value.slice(0, mention.start)}${replacement}${value.slice(mention.end)}`);
    if (option.kind === "add") onAddMedia?.(option.type);
    setMention(null);
    requestAnimationFrame(() => {
      const caret = mention.start + replacement.length;
      editorRef.current?.focus();
      editorRef.current?.setSelectionRange(caret, caret);
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (mention && mentionOptions.length) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((current) => (current + (event.key === "ArrowDown" ? 1 : mentionOptions.length - 1)) % mentionOptions.length);
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        selectMention(activeIndex);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        setMention(null);
        return;
      }
    }
    if (event.key === "Enter" && !event.shiftKey && !disabled && canSubmit) {
      event.preventDefault();
      onSubmit();
    }
  };

  return (
    <GenPanelSection title={title}>
      <div className="flex items-start rounded-lg border border-zinc-800 bg-zinc-950/35">
        {leading}
        <div className="relative flex min-w-0 flex-1 flex-col">
          {children ?? (
            <textarea
              ref={editorRef}
              value={value}
              onChange={(event) => {
                onChange(event.target.value);
                updateMention(event.target);
              }}
              onKeyDown={handleKeyDown}
              onKeyUp={(event) => {
                if (!["ArrowDown", "ArrowUp", "Enter", "Escape"].includes(event.key)) updateMention(event.currentTarget);
              }}
              onClick={(event) => updateMention(event.currentTarget)}
              onBlur={(event) => {
                if (!menuRef.current?.contains(event.relatedTarget as Node)) setMention(null);
              }}
              aria-expanded={!!mention}
              aria-controls={mention ? menuId : undefined}
              aria-activedescendant={mention ? `${menuId}-option-${activeIndex}` : undefined}
              maxLength={maxLength}
              placeholder={placeholder}
              className={`${height} w-full resize-none overflow-y-auto bg-transparent px-3 pb-3 pt-3 text-sm leading-5 text-white placeholder:text-zinc-500 focus:outline-hidden`}
            />
          )}
          {mention ? (
            <div ref={menuRef} id={menuId} role="listbox" aria-label="Media references" className="absolute left-2 top-12 z-30 w-60 rounded-xl border border-zinc-700 bg-zinc-900 p-1 shadow-xl">
              {mentionOptions.map((option, index) => {
                const disabledOption = option.kind === "add" && mediaAddDisabled?.[option.type];
                return (
                  <button
                    key={option.kind === "add" ? option.type : option.alias}
                    id={`${menuId}-option-${index}`}
                    type="button"
                    role="option"
                    aria-selected={index === activeIndex}
                    disabled={disabledOption}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectMention(index)}
                    className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-zinc-100 disabled:cursor-not-allowed disabled:opacity-45 ${index === activeIndex ? "bg-zinc-700" : "hover:bg-zinc-800"}`}
                  >
                    {option.kind === "alias" && option.type === "image" ? <img src={option.url} alt="" className="h-5 w-5 rounded object-cover" /> : option.kind === "alias" && option.type === "video" ? <video src={option.url} muted playsInline preload="metadata" className="h-5 w-5 rounded object-cover" /> : <span className="flex h-5 w-5 items-center justify-center rounded bg-zinc-800 text-violet-300"><MentionIcon type={option.type} /></span>}
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          ) : null}
          {mediaAliases?.length ? (
            <div className="flex flex-wrap gap-1 border-t border-zinc-800/70 px-2 py-1.5">
              {mediaAliases.map((alias) => (
                <button
                  key={alias}
                  type="button"
                  onClick={() => onChange(value ? `${value} ${alias}` : alias)}
                  className="rounded bg-zinc-800 px-1.5 py-0.5 text-2xs text-zinc-300 hover:bg-zinc-700"
                >
                  {alias}
                </button>
              ))}
            </div>
          ) : null}
          {actions || bottomRight ? (
            <div
              data-testid="prompt-editor-footer"
              className="flex items-center justify-between bg-zinc-800/35 gap-2 px-2 py-1.5 rounded-b-lg"
            >
              <div
                data-testid="prompt-editor-footer-left"
                className="flex min-w-0 items-center"
              >
                {actions}
              </div>
              <div
                data-testid="prompt-editor-footer-right"
                className="ml-auto flex min-w-0 items-center"
              >
                {bottomRight}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </GenPanelSection>
  );
}
