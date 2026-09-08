import { fireEvent, render, screen } from "@testing-library/react";
import type { ButtonHTMLAttributes } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReferenceEntityForm } from "./ReferenceEntityForm";

const clearGeneratedImage = vi.fn();

vi.mock("../../components/ui/button", () => ({
  Button: ({ variant: _variant, size: _size, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string }) => (
    <button {...props} />
  ),
}));

vi.mock("../../contexts/ReferenceLibraryContext", () => ({
  useReferenceLibrary: () => ({
    generatedImageForDraft: () => undefined,
    clearGeneratedImage,
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

describe("ReferenceEntityForm", () => {
  beforeEach(() => clearGeneratedImage.mockClear());

  it("clears an unsaved new-reference draft", () => {
    render(
      <ReferenceEntityForm
        entity={null}
        initialKind="cast"
        onSave={vi.fn()}
        allowReferenceImageGeneration
      />,
    );

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Beth" } });
    fireEvent.change(screen.getByLabelText("Visual description"), {
      target: { value: "Short dark hair" },
    });
    expect((screen.getByRole("button", { name: "Generate Reference Image" }) as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "Clear new reference" }));

    expect((screen.getByLabelText("Name") as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText("Visual description") as HTMLTextAreaElement).value).toBe("");
    expect((screen.getByRole("button", { name: "Generate Reference Image" }) as HTMLButtonElement).disabled).toBe(true);
    expect(clearGeneratedImage).toHaveBeenCalled();
  });
});
