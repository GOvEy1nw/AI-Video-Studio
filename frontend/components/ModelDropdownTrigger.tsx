import { LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";
import type { ModelProfile } from "../types/model-profiles";
import type { ModelDownloadProgress } from "../types/progress";

export function ModelDropdownTrigger({
  profile,
  label = profile.displayName,
  icon,
  modelDownload,
}: {
  profile: ModelProfile;
  label?: string;
  icon: ReactNode;
  modelDownload?: ModelDownloadProgress | null;
}) {
  const downloading =
    modelDownload !== null &&
    modelDownload !== undefined &&
    (modelDownload.modelType === profile.wangpModelType ||
      modelDownload.modelName === profile.displayName);

  return (
    <span className="min-w-0 flex-1">
      <span className="flex min-w-0 min-h-[20px] items-center gap-3">
        <span className="flex h-4 w-4 shrink-0 items-center justify-center text-zinc-400">
          {icon}
        </span>
        <span className="flex min-w-0 items-center gap-1.5">
          {downloading && (
            <LoaderCircle className="h-3 w-3 shrink-0 animate-spin text-blue-400" />
          )}
          <span className="max-w-full truncate text-xs font-semibold text-zinc-100">
            {label}
          </span>
        </span>
      </span>
    </span>
  );
}
