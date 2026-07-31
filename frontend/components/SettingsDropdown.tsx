import { useEffect, useRef, useState, type ReactNode } from "react";

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
  triggerLabel,
}: {
  trigger: ReactNode;
  options: {
    value: string;
    label: string;
    disabled?: boolean;
    tooltip?: string;
    icon?: ReactNode;
    status?: "ready" | "missing";
  }[];
  value: string;
  onChange: (value: string) => void;
  title: string;
  placement?: "top" | "bottom";
  variant?: "default" | "model";
  disabled?: boolean;
  optionLayout?: "list" | "aspect-grid";
  align?: "left" | "right";
  content?: ReactNode;
  triggerLabel?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
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

  return (
    <div
      ref={dropdownRef}
      className={`relative ${variant === "model" ? "w-full" : ""}`}
    >
      <button
        type="button"
        aria-label={triggerLabel}
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex shrink-0 text-xs font-medium tracking-wider text-zinc-200 leading-none bg-zinc-900 items-center px-3 py-1.5 whitespace-nowrap transition-colors ${
          variant === "model"
            ? `w-full justify-between rounded-xl border border-zinc-700 bg-zinc-800/70 px-3 py-2.5 text-left ${
                disabled ? "cursor-not-allowed opacity-50" : "hover:bg-zinc-800"
              }`
            : `gap-1 rounded-md px-1 py-1 ${
                disabled ? "cursor-not-allowed opacity-50" : "hover:bg-blue-500"
              }`
        } ${isOpen && !disabled ? "border-zinc-600 bg-zinc-700 hover:bg-zinc-700" : ""}`}
      >
        {trigger}
      </button>

      {isOpen && (
        <div
          className={`absolute z-9999 w-fit text-nowrap rounded-md border border-zinc-700 bg-zinc-800 p-2 shadow-xl ${
            align === "right" ? "right-0" : "left-0"
          } ${
            variant === "model" ? "right-0" : ""
          } ${placement === "bottom" ? "top-full mt-2" : "bottom-full mb-2"}`}
        >
          <div className="mb-2 text-2xs uppercase tracking-wider text-zinc-500">
            {title}
          </div>
          {content ?? (
            <div
              className={
                optionLayout === "aspect-grid"
                  ? "grid min-w-36 grid-cols-2 gap-1"
                  : "space-y-1"
              }
            >
              {options.map((option) => (
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
                    onClick={() => {
                      if (!option.disabled) {
                        onChange(option.value);
                        setIsOpen(false);
                      }
                    }}
                    className={`flex w-full items-center justify-between rounded-md px-2 py-2 text-left transition-colors ${
                      option.disabled
                        ? "cursor-not-allowed"
                        : value === option.value
                          ? "bg-white/20 hover:bg-white/25"
                          : "hover:bg-zinc-700"
                    }`}
                  >
                    <span
                      className={`flex items-center gap-2.5 text-2xs ${
                        option.disabled
                          ? "text-zinc-600"
                          : value === option.value
                            ? "text-white"
                            : "text-zinc-400"
                      }`}
                    >
                      {option.icon && (
                        <span className="shrink-0">{option.icon}</span>
                      )}
                      <span>{option.label}</span>
                      {option.status && (
                        <span
                          className={`shrink-0 font-medium ${
                            option.status === "ready"
                              ? "text-emerald-400"
                              : "text-red-400"
                          }`}
                        >
                          {option.status === "ready" ? "Ready" : "Missing"}
                        </span>
                      )}
                    </span>
                    {value === option.value && !option.disabled && (
                      <svg
                        className="h-5 w-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </button>
                  {option.disabled && option.tooltip && (
                    <div className="pointer-events-none absolute left-full top-1/2 z-10000 ml-2 -translate-y-1/2 whitespace-nowrap rounded-sm bg-zinc-700 px-2 py-1 text-xs text-zinc-300 opacity-0 transition-opacity group-hover/option:opacity-100">
                      {option.tooltip}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
