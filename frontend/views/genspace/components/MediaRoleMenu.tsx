import { Scissors } from "lucide-react";
import { useRef, type ReactNode } from "react";
import { FloatingMenu } from "../../../components/FloatingMenu";

export interface MediaRoleOption {
  role: string;
  label: string;
  description?: string;
  icon?: ReactNode;
}

export function MediaRoleMenu({
  title,
  options,
  selectedRole,
  onSelect,
  onTrim,
  extra,
}: {
  title: string;
  options: MediaRoleOption[];
  selectedRole: string;
  onSelect: (role: string) => void;
  onTrim?: () => void;
  extra?: ReactNode;
}) {
  const anchorRef = useRef<HTMLSpanElement>(null);
  return (
    <>
      <span ref={anchorRef} className="absolute left-0 top-full" />
      <FloatingMenu
        anchorRef={anchorRef}
        placement="bottom-start"
        gap={8}
        data-media-menu
        role="menu"
        className="w-fit text-nowrap rounded-md border border-border bg-popover p-2 shadow-xl"
      >
        <div className="mb-2 text-2xs uppercase tracking-wider text-muted">
          {title}
        </div>
        <div className="max-h-60 space-y-1 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.role}
              type="button"
              role="menuitem"
              onClick={() => onSelect(option.role)}
              title={option.description}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition-colors ${
                selectedRole === option.role
                  ? "bg-surface-selected text-foreground"
                  : "text-muted hover:bg-surface-hover"
              }`}
            >
              {option.icon}
              <span className="min-w-0">
                <span className="block text-xs font-medium">{option.label}</span>
              </span>
            </button>
          ))}
          {onTrim ? (
            <>
              {options.length ? <div className="my-1 h-px bg-border" /> : null}
              <button
                type="button"
                role="menuitem"
                onClick={onTrim}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-foreground transition-colors hover:bg-surface-hover"
              >
                <Scissors className="h-3.5 w-3.5" />
                <span className="text-xs">Trim</span>
              </button>
            </>
          ) : null}
          {extra}
        </div>
      </FloatingMenu>
    </>
  );
}
