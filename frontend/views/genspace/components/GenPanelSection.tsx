import type { ReactNode } from "react";

export function GenPanelSection({
  title,
  children,
  borderBottom = false,
  className = "",
  collapsible = true,
  collapsed = false,
  padding = "px-4 py-3",
}: {
  title?: string;
  children: ReactNode;
  borderBottom?: boolean;
  className?: string;
  collapsible?: boolean;
  collapsed?: boolean;
  padding?: string;
}) {
  const sectionClass = `${borderBottom ? "border-b border-border" : ""} ${padding} ${className}`;
  if (collapsible && title) {
    return (
      <details className={sectionClass} open={!collapsed}>
        <summary className="mb-2 cursor-pointer text-2xs font-medium uppercase tracking-wider text-subtle-foreground">
          {title}
        </summary>
        {children}
      </details>
    );
  }

  return (
    <div className={sectionClass}>
      {title ? (
        <div className="mb-2 w-full text-xs font-medium uppercase tracking-wider text-subtle-foreground">
          {title}
        </div>
      ) : null}
      {children}
    </div>
  );
}
