import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ButtonHTMLAttributes } from "react";
import { describe, expect, it, vi } from "vitest";
import { ReferenceDetailsPanel } from "./ReferenceDetailsPanel";

vi.mock("../../components/ui/button", () => ({
  Button: ({ variant: _variant, size: _size, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string }) => (
    <button {...props} />
  ),
}));

vi.mock("../../contexts/ReferenceLibraryContext", () => ({
  useReferenceLibrary: () => ({
    generatedImageForDraft: () => undefined,
    clearGeneratedImage: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock("../../contexts/GenerationQueueContext", () => ({
  useGenerationQueue: () => ({
    active: null,
    queued: [],
    attention: [],
    submit: vi.fn(),
    cancel: vi.fn(),
  }),
}));

describe("ReferenceDetailsPanel", () => {
  it("edits a selected entity without changing its stable id", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <ReferenceDetailsPanel
        entity={{
          id: "beth-id",
          kind: "cast",
          name: "Beth",
          token: "@beth",
          visualDescription: "Short dark hair",
          voiceDescription: "Warm alto",
          fidelity: "exact",
          createdAt: 1,
          updatedAt: 1,
        }}
        onSave={onSave}
      />,
    );

    expect(screen.queryByLabelText("Name")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Edit reference" }));
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Elizabeth" } });
    fireEvent.click(screen.getByRole("button", { name: "Update reference" }));

    await waitFor(() => expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      entity: expect.objectContaining({ id: "beth-id", name: "Elizabeth" }),
    })));
    await waitFor(() => expect(screen.queryByLabelText("Name")).toBeNull());
  });
});
