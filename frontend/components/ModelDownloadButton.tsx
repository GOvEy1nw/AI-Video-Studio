import { Download } from "lucide-react";

export function ModelDownloadButton() {
  return (
    <button
      type="button"
      onClick={() =>
        window.dispatchEvent(
          new CustomEvent("open-settings", { detail: { tab: "models" } }),
        )
      }
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-500/60 bg-blue-500/10 px-3 py-2 text-xs font-medium text-blue-200 transition-colors hover:bg-blue-500/20"
    >
      <Download className="h-3.5 w-3.5" />
      Download models
    </button>
  );
}
