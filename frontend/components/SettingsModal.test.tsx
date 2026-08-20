import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ButtonHTMLAttributes } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_APP_SETTINGS,
  useAppSettings,
  type AppSettings,
} from "../contexts/AppSettingsContext";
import { useModelProfiles } from "../contexts/ModelProfilesContext";
import { SettingsModal } from "./SettingsModal";

vi.mock("../contexts/AppSettingsContext", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../contexts/AppSettingsContext")>();
  return { ...actual, useAppSettings: vi.fn() };
});

vi.mock("../contexts/ModelProfilesContext", () => ({ useModelProfiles: vi.fn() }));
vi.mock("./ModelPackManager", () => ({ ModelPackManager: () => null }));
vi.mock("./ui/button", () => ({
  Button: ({
    children,
    variant: _variant,
    size: _size,
    ...props
  }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string }) => (
    <button {...props}>{children}</button>
  ),
}));

afterEach(() => cleanup());

describe("SettingsModal appearance", () => {
  const setUiTheme = vi.fn();
  let settings: AppSettings;

  beforeEach(() => {
    settings = { ...DEFAULT_APP_SETTINGS, uiTheme: "dark" };
    setUiTheme.mockReset();
    setUiTheme.mockImplementation((uiTheme) => {
      settings = { ...settings, uiTheme };
    });
    vi.mocked(useAppSettings).mockImplementation(() => ({
      settings,
      isLoaded: true,
      updateSettings: vi.fn(),
      saveSettings: vi.fn(),
      refreshSettings: vi.fn(),
      setUiTheme,
    }));
    vi.mocked(useModelProfiles).mockReturnValue({
      all: [],
      loading: false,
      stale: false,
      error: null,
      refresh: vi.fn().mockResolvedValue(true),
      refreshAfterModelPackMutation: vi.fn().mockResolvedValue(true),
    });
    Object.defineProperty(window, "electronAPI", {
      configurable: true,
      value: {
        getProjectAssetsPathStatus: vi.fn().mockResolvedValue({
          path: "C:\\AiVS",
          needsReselection: false,
        }),
        getCheckpointsLocation: vi.fn().mockResolvedValue({
          path: "C:\\Models",
          custom: false,
          defaultPath: "C:\\Models",
        }),
        getLorasLocation: vi.fn().mockResolvedValue({
          path: "C:\\LoRAs",
          custom: false,
          defaultPath: "C:\\LoRAs",
        }),
      },
    });
  });

  it("offers labelled radios and applies the selected theme", () => {
    const view = render(<SettingsModal isOpen onClose={vi.fn()} />);
    const dark = screen.getByRole("radio", { name: "Dark" });
    const light = screen.getByRole("radio", { name: "Light" });

    expect((dark as HTMLInputElement).checked).toBe(true);
    expect((light as HTMLInputElement).checked).toBe(false);

    fireEvent.click(light);
    expect(setUiTheme).toHaveBeenCalledWith("light");

    view.rerender(<SettingsModal isOpen onClose={vi.fn()} />);
    expect((light as HTMLInputElement).checked).toBe(true);
  });
});
