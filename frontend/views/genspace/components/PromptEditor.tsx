import type { KeyboardEvent, ReactNode } from "react";
import { GenPanelSection } from "./GenPanelSection";

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
}) {
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !disabled && canSubmit) {
      event.preventDefault();
      onSubmit();
    }
  };

  return (
    <GenPanelSection title={title}>
      <div className="flex items-start rounded-lg border border-zinc-800 bg-zinc-950/35">
        {leading}
        <div className="relative flex min-w-0 flex-1 flex-col py-1">
          {children ?? (
            <textarea
              value={value}
              onChange={(event) => onChange(event.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={maxLength}
              placeholder={placeholder}
              className={`${height} w-full resize-none overflow-y-auto bg-transparent px-3 pb-3 pt-3 text-sm leading-5 text-white placeholder:text-zinc-500 focus:outline-hidden`}
            />
          )}
          {actions || bottomRight ? (
            <div
              data-testid="prompt-editor-footer"
              className="flex items-center justify-between gap-2 px-2 pb-0.5 pt-1"
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
