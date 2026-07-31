import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SettingsDropdown } from "./SettingsDropdown";

afterEach(cleanup);

describe("SettingsDropdown", () => {
  it("does not open when disabled", () => {
    const onChange = vi.fn();
    render(
      <SettingsDropdown
        title="ASPECT RATIO"
        value="16:9"
        onChange={onChange}
        disabled
        trigger={<span>16:9</span>}
        options={[
          { value: "16:9", label: "16:9" },
          { value: "1:1", label: "1:1" },
        ]}
      />,
    );

    const trigger = screen.getByRole("button", { name: "16:9" });
    expect((trigger as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(trigger);
    expect(screen.queryByText("ASPECT RATIO")).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("renders model readiness and allows selecting a missing model", () => {
    const onChange = vi.fn();
    render(
      <SettingsDropdown
        title="IMAGE MODEL"
        value="ready"
        onChange={onChange}
        variant="model"
        trigger={<span>Choose model</span>}
        options={[
          { value: "ready", label: "Ready model", status: "ready" },
          { value: "missing", label: "Missing model", status: "missing" },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Choose model" }));

    expect(screen.getByText("Ready").classList.contains("text-emerald-400")).toBe(
      true,
    );
    expect(screen.getByText("Missing").classList.contains("text-red-400")).toBe(
      true,
    );

    const missing = screen.getByRole("button", {
      name: /Missing model.*Missing/,
    }) as HTMLButtonElement;
    expect(missing.disabled).toBe(false);
    fireEvent.click(missing);
    expect(onChange).toHaveBeenCalledWith("missing");
  });
});
