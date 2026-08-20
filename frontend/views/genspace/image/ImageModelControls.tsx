import { useEffect } from "react";
import { AlertCircle, Monitor, Sparkles } from "lucide-react";
import { ModelDownloadButton } from "../../../components/ModelDownloadButton";
import { ModelPicker } from "../../../components/ModelPicker";
import { SettingsDropdown } from "../../../components/SettingsDropdown";
import { isModelProfileInstalled } from "../../../lib/model-profile-availability";
import type { ModelProfile } from "../../../types/model-profiles";
import type { ModelDownloadProgress } from "../../../types/progress";
import { AspectRatioDropdown } from "../components/AspectRatioDropdown";
import type { ImageGenSettings } from "../types";

// Profile-driven image-mode controls. Reads the curated profile list
// from the backend and drives the model/resolution/aspect dropdowns
// from the selected profile. When the user switches models, the current
// aspect ratio / resolution tier are kept if the new model supports
// them, otherwise they fall back to the new model's defaults. Per the
// Phase 4 brief: never silently keep an invalid resolution from the
// previous model.
export function ImageModelControls({
  settings,
  onSettingsChange,
  imageProfiles,
  section = "all",
  menuPlacement = "top",
  modelDownload,
  aspectRatioDisabled = false,
  showAspectRatio = true,
}: {
  settings: ImageGenSettings;
  onSettingsChange: (patch: Partial<ImageGenSettings>) => void;
  imageProfiles: ModelProfile[];
  section?: "all" | "model" | "output";
  menuPlacement?: "top" | "bottom";
  modelDownload?: ModelDownloadProgress | null;
  aspectRatioDisabled?: boolean;
  showAspectRatio?: boolean;
}) {
  const installedProfiles = imageProfiles.filter((profile) =>
    isModelProfileInstalled(profile.availability),
  );
  const selectedProfileId = settings.profileId || "z_image_turbo";
  const selectedProfile =
    installedProfiles.find((p) => p.id === selectedProfileId) ||
    installedProfiles[0];

  // If the selected profile doesn't support the current aspect ratio or
  // resolution tier, fall back to the profile's defaults. This runs on
  // every render but only emits a change when the values actually need
  // to shift, so it won't loop.
  useEffect(() => {
    if (!selectedProfile || section === "output") return;
    const allowedAspects = selectedProfile.ui.allowedAspectRatios;
    const allowedTiers = selectedProfile.ui.allowedResolutionTiers;
    const patch: Partial<ImageGenSettings> = {};
    if (settings.profileId !== selectedProfile.id) {
      patch.profileId = selectedProfile.id;
    }
    if (!allowedAspects.includes(settings.aspectRatio)) {
      patch.aspectRatio = selectedProfile.ui.defaultAspectRatio;
    }
    if (!allowedTiers.includes(settings.resolution)) {
      patch.resolution = selectedProfile.ui.defaultResolutionTier;
    }
    if (Object.keys(patch).length) onSettingsChange(patch);
  }, [section, selectedProfile, settings, onSettingsChange]);

  if (!selectedProfile) {
    if (section === "output") return null;
    if (imageProfiles.length) return <ModelDownloadButton />;

    // Profiles not loaded yet — show a placeholder.
    return (
      <div className="flex items-center gap-1.5 rounded-md bg-surface-raised px-2 py-1 text-xs text-subtle-foreground">
        <AlertCircle className="h-3.5 w-3.5" />
        <span>Loading models…</span>
      </div>
    );
  }

  return (
    <>
      {section !== "output" && (
        <>
          {selectedProfile ? (
            <ModelPicker
              profiles={installedProfiles}
              value={selectedProfile.id}
              onChange={(profileId) => onSettingsChange({ profileId })}
              placement={menuPlacement}
              modelDownload={modelDownload}
              icon={<Sparkles className="h-5 w-5" />}
            />
          ) : (
            <ModelDownloadButton />
          )}
        </>
      )}

      {section !== "model" && (
        <>
          <SettingsDropdown
            title="RESOLUTION"
            value={settings.resolution}
            onChange={(resolution) => onSettingsChange({ resolution })}
            options={selectedProfile.ui.allowedResolutionTiers.map((tier) => ({
              value: tier,
              label: tier,
            }))}
            placement={menuPlacement}
            trigger={
              <>
                <Monitor className="h-3.5 w-3.5" />
                <span>{settings.resolution.replace("p", "")}</span>
              </>
            }
          />

          {showAspectRatio ? (
            <AspectRatioDropdown
              value={settings.aspectRatio}
              onChange={(aspectRatio) => onSettingsChange({ aspectRatio })}
              disabled={aspectRatioDisabled}
              allowedAspectRatios={selectedProfile.ui.allowedAspectRatios}
              placement={menuPlacement}
            />
          ) : null}
        </>
      )}
    </>
  );
}
