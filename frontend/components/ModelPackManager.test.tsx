import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ButtonHTMLAttributes } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ModelPackProgress } from "../types/progress";
import { ModelPackManager } from "./ModelPackManager";

vi.mock("./ui/button", () => ({
  Button: ({
    children,
    ...props
  }: ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

const originalElectronAPI = window.electronAPI;

const packs = [
  {
    id: "ace_step_15_turbo",
    name: "ACE-Step 1.5 Fast",
    estimatedSize: "12.0 GB",
    installed: false,
    groupId: "ace_step_15",
    groupName: "ACE-Step 1.5",
    variantName: "Fast",
    mediaTypes: ["audio"],
    features: ["generate"],
  },
  {
    id: "ace_step_15_xl_turbo",
    name: "ACE-Step 1.5 XL",
    estimatedSize: "20.0 GB",
    installed: true,
    groupId: "ace_step_15",
    groupName: "ACE-Step 1.5",
    variantName: "XL",
    mediaTypes: ["audio"],
    features: ["generate"],
  },
  {
    id: "ltx2_turbo",
    name: "LTX 2.3 Turbo 1.1",
    estimatedSize: "42.8 GB",
    installed: false,
    mediaTypes: ["video"],
    features: ["generate", "reframe"],
  },
  {
    id: "ideogram4_int8",
    name: "Ideogram 4 Standard",
    estimatedSize: "26.4 GB",
    installed: false,
    groupId: "ideogram4",
    groupName: "Ideogram 4",
    variantName: "Standard",
    mediaTypes: ["image"],
    features: ["region"],
  },
  {
    id: "ideogram4_turbotime_int8",
    name: "Ideogram 4 TurboTime",
    estimatedSize: "18.3 GB",
    installed: false,
    groupId: "ideogram4",
    groupName: "Ideogram 4",
    variantName: "TurboTime",
    mediaTypes: ["image"],
    features: ["region"],
  },
];

let downloadModelPacks: ReturnType<typeof vi.fn>;
let deleteModelPack: ReturnType<typeof vi.fn>;
let emitModelPackProgress: (progress: ModelPackProgress) => void;
let confirm: ReturnType<typeof vi.fn>;

beforeEach(() => {
  downloadModelPacks = vi.fn(async () => true);
  deleteModelPack = vi.fn(async () => undefined);
  confirm = vi.fn(() => true);
  vi.stubGlobal("confirm", confirm);
  Object.defineProperty(window, "electronAPI", {
    configurable: true,
    writable: true,
    value: {
      getModelPacks: vi.fn(async () => packs),
      refreshModelPacks: vi.fn(async () => packs),
      getModelPackProgress: vi.fn(async () => null),
      onModelPackProgress: vi.fn(
        (callback: (progress: ModelPackProgress) => void) => {
          emitModelPackProgress = callback;
        },
      ),
      removeModelPackProgress: vi.fn(),
      downloadModelPacks,
      cancelModelPackDownload: vi.fn(async () => undefined),
      deleteModelPack,
    } as unknown as Window["electronAPI"],
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  Object.defineProperty(window, "electronAPI", {
    configurable: true,
    writable: true,
    value: originalElectronAPI,
  });
});

describe("ModelPackManager", () => {
  it("groups variants with one selection dot per chip and one per standalone card", async () => {
    render(<ModelPackManager />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "ACE-Step 1.5" }),
      ).toBeTruthy();
    });

    expect(screen.getAllByText("ACE-Step 1.5")).toHaveLength(1);
    for (const label of [
      "Available",
      "Failed",
      "Missing",
      "Selected",
      "Downloading",
    ]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    expect(
      screen.getByRole("button", {
        name: "Select ACE-Step 1.5 Fast (Missing)",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", {
        name: "Select ACE-Step 1.5 XL (Available)",
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", {
        name: "Select LTX 2.3 Turbo 1.1 (Missing)",
      }),
    ).toBeTruthy();
    expect(screen.getByText("LTX 2.3 Turbo 1.1")).toBeTruthy();
    expect(screen.queryByText("Ready")).toBeNull();
    expect(
      screen.queryByRole("button", { name: /Delete ACE-Step/i }),
    ).toBeNull();

    fireEvent.click(
      screen.getByRole("button", {
        name: "Select ACE-Step 1.5 XL (Available)",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Select ACE-Step 1.5 Fast (Missing)",
      }),
    );
    expect(
      screen.getByRole("button", {
        name: "Deselect ACE-Step 1.5 Fast (Selected)",
      }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Download" }));
    await waitFor(() => {
      expect(downloadModelPacks).toHaveBeenCalledWith([
        "ace_step_15_turbo",
      ]);
    });

    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    await waitFor(() => {
      expect(confirm).toHaveBeenCalledTimes(1);
      expect(deleteModelPack).toHaveBeenCalledWith("ace_step_15_xl_turbo");
    });
  });

  it("keeps downloading and failed variant state on its own chip", async () => {
    render(<ModelPackManager />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: "Select ACE-Step 1.5 Fast (Missing)",
        }),
      ).toBeTruthy();
    });

    act(() => {
      emitModelPackProgress({
        status: "downloading",
        packId: "ace_step_15_turbo",
        packName: "ACE-Step 1.5 Fast",
        packIndex: 1,
        packCount: 1,
        message: null,
        transfer: null,
      });
    });
    expect(screen.getByRole("progressbar")).toBeTruthy();
    expect(
      screen.getByRole("button", {
        name: "Select ACE-Step 1.5 Fast (Downloading)",
      }),
    ).toBeTruthy();

    act(() => {
      emitModelPackProgress({
        status: "error",
        packId: "ace_step_15_turbo",
        packName: "ACE-Step 1.5 Fast",
        packIndex: 1,
        packCount: 1,
        message: "Download failed",
        transfer: null,
      });
    });
    expect(
      screen.getByRole("button", {
        name: "Select ACE-Step 1.5 Fast (Failed)",
      }),
    ).toBeTruthy();
  });

  it("downloads both Ideogram 4 chip variants by their WanGP profile IDs", async () => {
    render(<ModelPackManager />);

    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Ideogram 4" }),
      ).toBeTruthy();
    });

    fireEvent.click(
      screen.getByRole("button", {
        name: "Select Ideogram 4 Standard (Missing)",
      }),
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "Select Ideogram 4 TurboTime (Missing)",
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Download" }));

    await waitFor(() => {
      expect(downloadModelPacks).toHaveBeenCalledWith([
        "ideogram4_int8",
        "ideogram4_turbotime_int8",
      ]);
    });
  });

  it("filters model packs by media and workflow feature", async () => {
    render(<ModelPackManager />);

    await waitFor(() => {
      expect(screen.getByText("LTX 2.3 Turbo 1.1")).toBeTruthy();
    });

    fireEvent.click(screen.getByRole("button", { name: "image models" }));
    expect(screen.queryByText("LTX 2.3 Turbo 1.1")).toBeNull();
    expect(screen.getByText("Ideogram 4")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "region" }));
    expect(screen.getByText("Ideogram 4")).toBeTruthy();
    expect(screen.queryByText("ACE-Step 1.5")).toBeNull();
  });
});
