import type { ReactNode } from "react";

export function GenPanelSection({
  title,
  children,
  borderBottom = true,
  className = "",
  collapsible = false,
}: {
  title?: string;
  children: ReactNode;
  borderBottom?: boolean;
  className?: string;
  collapsible?: boolean;
}) {
  const sectionClass = `${borderBottom ? "border-b border-zinc-800/60" : ""} px-4 py-3 ${className}`;
  if (collapsible && title) {
    return (
      <details className={sectionClass}>
        <summary className="mb-2 cursor-pointer text-sm font-medium uppercase tracking-wider text-zinc-500">
          {title}
        </summary>
        {children}
      </details>
    );
  }

  return (
    <div className={sectionClass}>
      {title ? (
        <div className="mb-2 text-sm font-medium uppercase tracking-wider text-zinc-500">
          {title}
        </div>
      ) : null}
      {children}
    </div>
  );
}
