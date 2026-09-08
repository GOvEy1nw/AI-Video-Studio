import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

export type MentionRange = { start: number; end: number; query: string };
export type MentionOption = {
  id: string;
  group: string;
  label: string;
  disabled?: boolean;
  disabledReason?: string;
  leading?: ReactNode;
};

export function getActiveMention(value: string, end: number): MentionRange | null {
  let start = end;
  while (start > 0 && !/\s/.test(value[start - 1])) start -= 1;
  const token = value.slice(start, end);
  return token.startsWith("@")
    ? { start, end, query: token.slice(1).toLowerCase() }
    : null;
}

export function MentionTextarea({
  value,
  onChange,
  options,
  onSelect,
  onSubmit,
  canSubmit = false,
  disabled = false,
  placeholder,
  className,
  maxLength,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options?: (query: string) => MentionOption[];
  onSelect?: (option: MentionOption, replace: (text: string, caretOffset?: number) => void) => void;
  onSubmit?: () => void;
  canSubmit?: boolean;
  disabled?: boolean;
  placeholder: string;
  className?: string;
  maxLength?: number;
  ariaLabel?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const [mention, setMention] = useState<MentionRange | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const choices = mention && options ? options(mention.query) : [];
  const close = () => setMention(null);
  const updateMention = (target: HTMLTextAreaElement) => {
    setMention(options ? getActiveMention(target.value, target.selectionEnd) : null);
    setActiveIndex(0);
  };
  const replace = (text: string, caretOffset = text.length) => {
    if (!mention) return;
    const caret = mention.start + caretOffset;
    onChange(`${value.slice(0, mention.start)}${text}${value.slice(mention.end)}`);
    close();
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(caret, caret);
    });
  };
  const choose = (option: MentionOption) => {
    if (!option.disabled) onSelect?.(option, replace);
  };

  useEffect(() => {
    if (!mention) return;
    const dismiss = (event: PointerEvent) => {
      if (textareaRef.current?.contains(event.target as Node) || menuRef.current?.contains(event.target as Node)) return;
      close();
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [mention]);

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (mention && choices.length) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((index) => (index + (event.key === "ArrowDown" ? 1 : choices.length - 1)) % choices.length);
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        choose(choices[activeIndex]);
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
    }
    if (event.key === "Enter" && !event.shiftKey && !disabled && canSubmit) {
      event.preventDefault();
      onSubmit?.();
    }
  };
  let previousGroup: string | null = null;

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        className={className}
        maxLength={maxLength}
        aria-label={ariaLabel}
        aria-expanded={!!mention}
        aria-controls={mention ? menuId : undefined}
        aria-activedescendant={mention ? `${menuId}-option-${activeIndex}` : undefined}
        onChange={(event) => { onChange(event.target.value); updateMention(event.target); }}
        onKeyDown={onKeyDown}
        onKeyUp={(event) => { if (!["ArrowDown", "ArrowUp", "Enter", "Escape"].includes(event.key)) updateMention(event.currentTarget); }}
        onClick={(event) => updateMention(event.currentTarget)}
      />
      {mention ? (
        <div ref={menuRef} id={menuId} role="listbox" aria-label="References" className="absolute left-0 top-full z-30 mt-1 w-64 rounded-xl border border-border bg-popover p-1 shadow-xl">
          {choices.map((option, index) => {
            const groupChanged = option.group !== previousGroup;
            previousGroup = option.group;
            return (
              <div key={option.id}>
                {groupChanged ? <p className="px-2 pb-1 pt-2 text-2xs font-medium uppercase tracking-wide text-subtle-foreground">{option.group}</p> : null}
                <button
                  id={`${menuId}-option-${index}`}
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  disabled={option.disabled}
                  title={option.disabledReason}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(option)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm disabled:cursor-not-allowed disabled:opacity-45 ${index === activeIndex ? "bg-surface-selected" : "hover:bg-surface-hover"}`}
                >
                  {option.leading}
                  <span>{option.label}</span>
                </button>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
