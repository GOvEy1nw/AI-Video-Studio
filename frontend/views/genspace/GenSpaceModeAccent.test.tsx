import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup } from "@testing-library/react";
import { SeedControl } from "../../components/SeedControl";
import { GenerateButton } from "./components/GenerateButton";
import { MediaInputSlot } from "./components/MediaInputSlot";

afterEach(cleanup);

describe("GenSpace mode accent hooks", () => {
  it("marks generate, seed, and active drop-zone controls", () => {
    render(
      <div>
        <GenerateButton
          onClick={() => undefined}
          disabled={false}
          loading={false}
          label="Generate"
          icon={null}
        />
        <SeedControl
          seedLocked
          lockedSeed={42}
          onChange={() => undefined}
        />
        <MediaInputSlot
          kind="image"
          title="Add image"
          ariaLabel="Add image"
          dragActive
          onDrop={() => undefined}
        />
      </div>,
    );

    expect(
      screen.getByRole("button", { name: "Generate" }).hasAttribute(
        "data-genspace-generate",
      ),
    ).toBe(true);
    expect(
      screen.getByRole("button", { name: "Add image" }).dataset.dragActive,
    ).toBe("true");
    expect(
      screen
        .getByRole("button", { name: "Add image" })
        .hasAttribute("data-genspace-dropzone"),
    ).toBe(true);
    expect(
      screen.getByRole("button", { name: "Locked seed: 42" }).getAttribute(
        "aria-pressed",
      ),
    ).toBe("true");
  });
});
