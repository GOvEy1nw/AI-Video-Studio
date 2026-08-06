import { ChevronDown, Wrench, type LucideIcon } from "lucide-react";
import { SettingsDropdown } from "../../../components/SettingsDropdown";

export interface ModeSelectorOption {
  value: string;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
  tooltip?: string;
}

export function ModeSelector({
  options,
  value,
  onChange,
}: {
  options: readonly ModeSelectorOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  const selected =
    options.find((option) => option.value === value) ?? options[0];
  if (!selected) return null;

  const SelectedIcon = selected.icon;
  return (
    <SettingsDropdown
      title=""
      value={selected.value}
      onChange={onChange}
      options={options.map(
        ({ value: optionValue, label, icon: Icon, disabled, tooltip }) => ({
          value: optionValue,
          label,
          icon: <Icon className="h-3.5 w-3.5" />,
          disabled,
          tooltip,
        }),
      )}
      variant="mode"
      triggerLabel="Choose mode"
      trigger={
        <>
          <span className="flex items-center gap-1.5 border-r border-zinc-700 px-2.5 py-2 text-zinc-400">
            Tools
            <ChevronDown className="h-3.5 w-3.5" />
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-2 text-white">
            <SelectedIcon className="h-3.5 w-3.5 text-violet-300" />
            {selected.label}
          </span>
        </>
      }
    />
  );
}
