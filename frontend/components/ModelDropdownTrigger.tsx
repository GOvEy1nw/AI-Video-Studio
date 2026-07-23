import { ChevronDown, LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";
import type {
  ModelProfile,
  ModelProfileAvailability,
} from "../types/model-profiles";
import type { ModelDownloadProgress } from "../types/progress";

const availabilityStatus: Record<
  ModelProfileAvailability,
  { label: string; className: string }
> = {
  available: { label: "Ready", className: "text-emerald-400" },
  experimental: {
    label: "Ready · Experimental",
    className: "text-amber-400",
  },
  partially_installed: { label: "Incomplete", className: "text-amber-400" },
  missing_model_files: { label: "Missing", className: "text-red-400" },
  unsupported: { label: "Unsupported", className: "text-red-400" },
  hidden: { label: "Unavailable", className: "text-zinc-500" },
};

export function ModelDropdownTrigger({
  profile,
  icon,
  modelDownload,
}: {
  profile: ModelProfile;
  icon: ReactNode;
  modelDownload?: ModelDownloadProgress | null;
}) {
  const downloading =
    modelDownload !== null &&
    modelDownload !== undefined &&
    (modelDownload.modelType === profile.wangpModelType ||
      modelDownload.modelName === profile.displayName);
  const status = availabilityStatus[profile.availability];

  return (
    <>
      <span className="flex min-w-0 items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center text-zinc-400">
          {icon}
        </span>
        <span className="flex min-w-0 flex-col items-start">
          <span className="max-w-full truncate text-sm font-medium text-zinc-100">
            {profile.displayName}
          </span>
          <span
            className={`mt-0.5 flex items-center gap-1.5 text-xs ${
              downloading ? "text-blue-400" : status.className
            }`}
          >
            {downloading && <LoaderCircle className="h-3 w-3 animate-spin" />}
            {downloading ? "Downloading" : status.label}
          </span>
        </span>
      </span>
      <ChevronDown className="h-4 w-4 shrink-0 text-zinc-500" />
    </>
  );
}
