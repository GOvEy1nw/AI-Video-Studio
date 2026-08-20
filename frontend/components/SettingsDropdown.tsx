import { ChevronDown } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { FloatingMenu, type FloatingMenuPlacement } from "./FloatingMenu";

interface SettingsDropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
  tooltip?: string;
  icon?: ReactNode;
  status?: "ready" | "missing";
  modelGroup?: string;
  modelGroupLabel?: string;
  variantLabel?: string;
}

export function SettingsDropdown({
  trigger,
  options,
  value,
  onChange,
  title,
  placement = "top",
  variant = "default",
  disabled = false,
  optionLayout = "list",
  align = "left",
  content,
  footer,
  triggerLabel,
  triggerTitle = "Model",
  triggerControls,
}: {
  trigger: ReactNode;
  options: SettingsDropdownOption[];
  value: string;
  onChange: (value: string) => void;
  title: string;
  placement?: "top" | "bottom";
  variant?: "default" | "model" | "mode";
  disabled?: boolean;
  optionLayout?: "list" | "aspect-grid";
  align?: "left" | "right";
  content?: ReactNode;
  footer?: ReactNode;
  triggerLabel?: string;
  triggerTitle?: string;
  triggerControls?: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const modelTriggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const preferredPlacement: FloatingMenuPlacement =
    placement === "bottom"
      ? align === "right" || variant === "model" || variant === "mode"
        ? "bottom-end"
        : "bottom-start"
      : align === "right" || variant === "model" || variant === "mode"
        ? "bottom-start"
        : "top-start";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !menuRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (disabled) setIsOpen(false);
  }, [disabled]);

  const selectOption = (option: SettingsDropdownOption) => {
    if (option.disabled) return;
    onChange(option.value);
    setIsOpen(false);
  };

  const modelOptionGroups = new Map<
    string,
    { label?: string; options: SettingsDropdownOption[] }
  >();
  for (const option of options) {
    const key = option.modelGroup ?? option.value;
    const group = modelOptionGroups.get(key);
    if (group) group.options.push(option);
    else {
      modelOptionGroups.set(key, {
        label: option.modelGroupLabel,
        options: [option],
      });
    }
  }

  const renderOption = (option: SettingsDropdownOption) => (
    <div
      key={option.value}
      className={`group/option relative ${
        optionLayout === "aspect-grid" && option.value === "1:1"
          ? "col-span-2 mx-auto w-1/2"
          : ""
      }`}
    >
      <button
        type="button"
        aria-label={
          option.disabled && option.tooltip
            ? `${option.label}: ${option.tooltip}`
            : undefined
        }
        disabled={option.disabled}
        title={option.disabled ? option.tooltip : undefined}
        onClick={() => selectOption(option)}
        className={`flex w-full items-center justify-between rounded-md px-2 py-2 text-2xs text-left transition-colors ${
          option.disabled
            ? "cursor-not-allowed"
            : value === option.value
              ? "bg-surface-selected hover:bg-surface-hover"
              : "hover:bg-surface-hover hover:text-foreground"
        }`}
      >
        <span
          className={`flex items-center gap-2.5 text-2xs ${
            option.disabled
              ? "text-subtle-foreground"
              : value === option.value
                ? "text-foreground"
                : ""
          }`}
        >
          {option.icon && <span className="shrink-0">{option.icon}</span>}
          <span>{option.label}</span>
          {option.status && (
            <span
              className={`shrink-0 font-medium ${
                option.status === "ready" ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {option.status === "ready" ? "Ready" : "Missing"}
            </span>
          )}
        </span>
      </button>
      {option.disabled && option.tooltip && (
        <div className="pointer-events-none absolute left-full top-1/2 z-10000 ml-2 -translate-y-1/2 whitespace-nowrap rounded-sm bg-popover px-2 py-1 text-xs text-muted-foreground opacity-0 transition-opacity group-hover/option:opacity-100">
          {option.tooltip}
        </div>
      )}
    </div>
  );

  return (
    <div
      ref={dropdownRef}
      data-genspace-theme-ignore={
        variant === "model" || variant === "mode" ? "" : undefined
      }
      className={`relative ${variant === "model" ? "w-full" : ""}`}
    >
      {variant === "model" ? (
        <div
          ref={modelTriggerRef}
          className={`flex flex-col w-full min-w-[165px] p-2.5 justify-between rounded-xl border bg-input transition-colors ${
            disabled
              ? "cursor-not-allowed border-border opacity-50"
              : isOpen
                ? "border-border-strong bg-surface-selected"
                : "border-border hover:bg-surface-hover"
          }`}
        >
          <button
            type="button"
            aria-label={triggerLabel}
            aria-expanded={isOpen}
            onClick={() => setIsOpen(!isOpen)}
            disabled={disabled}
            className="flex min-w-0 flex-1 items-center text-left"
          >
            <span className="mb-0.5 text-2xs w-full text-muted-foreground">
              {triggerTitle}
            </span>
          </button>
          <div className="flex w-full items-center justify-between gap-2.5">
            <button
              type="button"
              aria-label={triggerLabel}
              aria-expanded={isOpen}
              onClick={() => setIsOpen(!isOpen)}
              disabled={disabled}
              className="flex min-w-0 flex-1 items-center text-left"
            >
              {trigger}
            </button>
            {triggerControls}
            <button
              type="button"
              aria-label={triggerLabel ?? "Open model picker"}
              aria-expanded={isOpen}
              onClick={() => setIsOpen(!isOpen)}
              disabled={disabled}
              className="flex shrink-0 items-center justify-center text-subtle-foreground transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring"
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          aria-label={triggerLabel}
          aria-expanded={isOpen}
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className={`${
            variant === "mode"
              ? "flex items-center overflow-hidden rounded-xl border border-border bg-input text-xs font-medium text-foreground transition-colors hover:border-border-strong hover:bg-surface-hover"
              : "flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md bg-card px-1 py-1 text-2xs font-medium leading-none tracking-wider text-foreground transition-colors"
          } ${
            disabled
              ? "cursor-not-allowed opacity-50"
              : variant === "mode"
                ? ""
                : "hover:bg-blue-500"
          } ${isOpen && !disabled ? "border-border-strong bg-surface-selected hover:bg-surface-selected" : ""}`}
        >
          {trigger}
        </button>
      )}

      {isOpen && (
        <FloatingMenu
          ref={menuRef}
          anchorRef={variant === "model" ? modelTriggerRef : dropdownRef}
          matchAnchorWidth={variant === "model"}
          placement={preferredPlacement}
          gap={8}
          className="w-fit text-nowrap rounded-md border border-border bg-popover p-2 text-foreground shadow-xl"
        >
          {title && (
            <div className="mb-2 text-2xs uppercase tracking-wider text-subtle-foreground">
              {title}
            </div>
          )}
          {content ?? (
            <div
              className={
                optionLayout === "aspect-grid"
                  ? "grid max-h-60 min-w-36 grid-cols-2 gap-1 overflow-y-auto pr-1"
                  : "max-h-60 space-y-1 overflow-y-auto overflow-x-hidden pr-1"
              }
            >
              {variant === "model"
                ? [...modelOptionGroups.entries()].map(([key, group]) =>
                    group.options.some((option) => option.variantLabel) ? (
                      <div
                        key={key}
                        className={`flex w-full px-2 py-2 gap-2 text-2xs items-center justify-between rounded-md text-left transition-colors hover:bg-surface-hover hover:text-foreground ${
                          value === group.options[0]?.value ||
                          value === group.options[1]?.value
                            ? "bg-surface-selected text-foreground"
                            : ""
                        }`}
                      >
                        <button
                          type="button"
                          aria-label={`Select ${group.label}`}
                          disabled={group.options[0]?.disabled}
                          onClick={() => selectOption(group.options[0])}
                          className="flex w-full items-center text-left transition-colors"
                        >
                          {group.label}
                        </button>
                        <span className="flex items-center gap-1">
                          {group.options.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              aria-label={option.label}
                              aria-pressed={value === option.value}
                              title={option.label}
                              disabled={option.disabled}
                              onClick={() => selectOption(option)}
                              className={`rounded-lg px-2 py-1 text-xs font-semibold leading-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 ${
                                value === option.value
                                  ? "bg-emerald-500 text-white"
                                  : "bg-surface-selected text-foreground hover:bg-surface-hover"
                              }`}
                            >
                              {option.variantLabel}
                            </button>
                          ))}
                        </span>
                      </div>
                    ) : (
                      group.options.map(renderOption)
                    ),
                  )
                : options.map(renderOption)}
            </div>
          )}
          {footer && (
            <div className="mt-2 border-t border-border pt-2">{footer}</div>
          )}
        </FloatingMenu>
      )}
    </div>
  );
}
