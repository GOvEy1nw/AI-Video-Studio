import type { ReactNode } from "react";
import type { ModelProfile } from "../types/model-profiles";
import type { ModelDownloadProgress } from "../types/progress";
import { ModelDownloadButton } from "./ModelDownloadButton";
import { ModelDropdownTrigger } from "./ModelDropdownTrigger";
import { SettingsDropdown } from "./SettingsDropdown";

export interface ModelProfileGroup {
  key: string;
  label: string;
  variants: { profile: ModelProfile; label: string }[];
  grouped: boolean;
}

function groupFamilyProfiles(
  family: string,
  profiles: ModelProfile[],
): ModelProfileGroup[] {
  if (profiles.length < 2) {
    const profile = profiles[0];
    return profile
      ? [
          {
            key: profile.id,
            label: profile.displayName,
            variants: [{ profile, label: profile.displayName }],
            grouped: false,
          },
        ]
      : [];
  }

  const names = profiles.map((profile) => profile.displayName.split(/\s+/));
  const commonWords: string[] = [];
  for (let index = 0; index < names[0].length; index += 1) {
    const word = names[0][index];
    if (
      names.every(
        (name) => name[index]?.toLocaleLowerCase() === word.toLocaleLowerCase(),
      )
    ) {
      commonWords.push(word);
    } else {
      break;
    }
  }

  const variants = profiles.map((profile, index) => ({
    profile,
    label: names[index].slice(commonWords.length).join(" "),
  }));
  if (!commonWords.length || variants.some((variant) => !variant.label)) {
    return profiles.flatMap((profile) =>
      groupFamilyProfiles(profile.id, [profile]),
    );
  }

  return [
    {
      key: family,
      label: commonWords.join(" "),
      variants,
      grouped: true,
    },
  ];
}

export function groupModelProfiles(
  profiles: ModelProfile[],
): ModelProfileGroup[] {
  const families = new Map<string, ModelProfile[]>();
  for (const profile of profiles) {
    const family = profile.wangpMetadata?.family || profile.id;
    const familyProfiles = families.get(family);
    if (familyProfiles) familyProfiles.push(profile);
    else families.set(family, [profile]);
  }

  return [...families.entries()].flatMap(([family, familyProfiles]) =>
    groupFamilyProfiles(family, familyProfiles),
  );
}

export function ModelPicker({
  profiles,
  value,
  onChange,
  icon,
  modelDownload,
  placement = "bottom",
}: {
  profiles: ModelProfile[];
  value: string;
  onChange: (profileId: string) => void;
  icon: ReactNode;
  modelDownload?: ModelDownloadProgress | null;
  placement?: "top" | "bottom";
}) {
  const groups = groupModelProfiles(profiles);
  const selectedProfile =
    profiles.find((profile) => profile.id === value) ?? profiles[0];
  const selectedGroup = groups.find((group) =>
    group.variants.some(
      (variant) => variant.profile.id === selectedProfile?.id,
    ),
  );

  if (!selectedProfile || !selectedGroup) return null;

  return (
    <SettingsDropdown
      title=""
      value={selectedProfile.id}
      onChange={onChange}
      options={groups.flatMap((group) =>
        group.variants.map((variant) => ({
          value: variant.profile.id,
          label:
            variant.profile.displayName +
            (variant.profile.status === "experimental"
              ? " (experimental)"
              : ""),
          modelGroup: group.grouped ? group.key : undefined,
          modelGroupLabel: group.grouped ? group.label : undefined,
          variantLabel: group.grouped ? variant.label : undefined,
        })),
      )}
      placement={placement}
      variant="model"
      footer={<ModelDownloadButton className="w-full mx-auto" />}
      trigger={
        <ModelDropdownTrigger
          profile={selectedProfile}
          label={selectedGroup.label}
          modelDownload={modelDownload}
          icon={icon}
        />
      }
      triggerControls={
        selectedGroup.grouped ? (
          <span className="flex shrink-0 items-center gap-1">
            {selectedGroup.variants.map((variant) => {
              const selected = variant.profile.id === selectedProfile.id;
              return (
                <button
                  key={variant.profile.id}
                  type="button"
                  aria-label={`Select ${selectedGroup.label} ${variant.label}`}
                  aria-pressed={selected}
                  title={variant.profile.displayName}
                  onClick={() => onChange(variant.profile.id)}
                  className={`rounded-lg px-2 py-1 text-xs font-semibold leading-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 ${
                    selected
                      ? "bg-emerald-500 text-white"
      : "bg-surface-hover text-foreground hover:bg-surface-selected"
                  }`}
                >
                  {variant.label}
                </button>
              );
            })}
          </span>
        ) : undefined
      }
    />
  );
}
