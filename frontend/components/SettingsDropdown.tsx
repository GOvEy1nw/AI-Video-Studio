import { useEffect, useRef, useState, type ReactNode } from "react";

export function SettingsDropdown({
  trigger,
  options,
  value,
  onChange,
  title,
  placement = "top",
  variant = "default",
}: {
  trigger: ReactNode;
  options: {
    value: string;
    label: string;
    disabled?: boolean;
    tooltip?: string;
    icon?: ReactNode;
  }[];
  value: string;
  onChange: (value: string) => void;
  title: string;
  placement?: "top" | "bottom";
  variant?: "default" | "model";
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div
      ref={dropdownRef}
      className={`relative ${variant === "model" ? "w-full" : ""}`}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex shrink-0 items-center whitespace-nowrap transition-colors ${
          variant === "model"
            ? "w-full justify-between rounded-xl border border-zinc-700 bg-zinc-800/70 px-3 py-2.5 text-left hover:border-zinc-600 hover:bg-zinc-800"
            : "gap-1 rounded-md px-2 py-1.5 hover:bg-zinc-800"
        } ${isOpen ? "border-zinc-600 bg-zinc-700 hover:bg-zinc-700" : ""}`}
      >
        {trigger}
      </button>

      {isOpen && (
        <div
          className={`absolute left-0 z-[9999] min-w-[160px] rounded-md border border-zinc-700 bg-zinc-800 p-2 shadow-xl ${
            variant === "model" ? "right-0" : ""
          } ${
            placement === "bottom" ? "top-full mt-2" : "bottom-full mb-2"
          }`}
        >
          <div className="mb-2 text-[10px] uppercase tracking-wider text-zinc-500">
            {title}
          </div>
          <div className="space-y-1">
            {options.map((option) => (
              <div key={option.value} className="group/option relative">
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
                    className={`flex items-center gap-2.5 text-sm ${
                      option.disabled
                        ? "text-zinc-600"
                        : value === option.value
                          ? "text-white"
                          : "text-zinc-400"
                    }`}
                  >
                    {option.icon && <span className="shrink-0">{option.icon}</span>}
                    {option.label}
                  </span>
                  {value === option.value && !option.disabled && (
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                {option.disabled && option.tooltip && (
                  <div className="pointer-events-none absolute left-full top-1/2 z-[10000] ml-2 -translate-y-1/2 whitespace-nowrap rounded bg-zinc-700 px-2 py-1 text-xs text-zinc-300 opacity-0 transition-opacity group-hover/option:opacity-100">
                    {option.tooltip}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
