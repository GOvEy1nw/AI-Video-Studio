import { SettingsDropdown } from "../../../components/SettingsDropdown";
import { AspectIcon } from "./AspectIcon";

export const ASPECT_RATIO_OPTIONS = [
  "1:1",
  "16:9",
  "9:16",
  "21:9",
  "9:21",
  "4:3",
  "3:4",
  "3:2",
  "2:3",
] as const;

export type AspectRatioOption = (typeof ASPECT_RATIO_OPTIONS)[number];

export function AspectRatioDropdown({
  value,
  onChange,
  allowedAspectRatios = ASPECT_RATIO_OPTIONS,
  disabled = false,
  placement = "top",
}: {
  value: string;
  onChange: (value: AspectRatioOption) => void;
  allowedAspectRatios?: readonly string[];
  disabled?: boolean;
  placement?: "top" | "bottom";
}) {
  const allowed = new Set(allowedAspectRatios);
  const options = ASPECT_RATIO_OPTIONS.filter((ratio) => allowed.has(ratio));

  return (
    <SettingsDropdown
      title="ASPECT RATIO"
      value={value}
      onChange={(next) => onChange(next as AspectRatioOption)}
      disabled={disabled}
      align="right"
      placement={placement}
      optionLayout="aspect-grid"
      options={options.map((ratio) => ({
        value: ratio,
        label: ratio,
        icon: <AspectIcon ratio={ratio} className="h-4 w-4" />,
      }))}
      trigger={
        <>
          {disabled ? null : (
            <AspectIcon ratio={value} className="h-3.5 w-3.5" />
          )}
          <span>{disabled ? "Auto" : value}</span>
        </>
      }
    />
  );
}
