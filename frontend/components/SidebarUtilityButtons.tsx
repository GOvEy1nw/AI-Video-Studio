import { Moon, Settings, Sun } from "lucide-react";
import { useAppSettings } from "../contexts/AppSettingsContext";
import { ConnectionIndicator } from "./ModelStatusDropdown";

export function SidebarUtilityButtons() {
  const { settings, setUiTheme } = useAppSettings();
  const nextTheme = settings.uiTheme === "dark" ? "light" : "dark";

  return (
    <div className="flex w-full flex-col items-center gap-1 pt-2">
      <ConnectionIndicator />
      <button
        type="button"
        aria-label={`Switch to ${nextTheme} theme`}
        title={`Switch to ${nextTheme} theme`}
        onClick={() => setUiTheme(nextTheme)}
        className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {settings.uiTheme === "dark" ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )}
      </button>
      <button
        type="button"
        aria-label="Settings"
        title="Settings"
        onClick={() => window.dispatchEvent(new CustomEvent("open-settings"))}
        className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <Settings className="h-4 w-4" />
      </button>
    </div>
  );
}
