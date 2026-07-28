import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GenerateButton } from "./GenerateButton";
import { ImageMediaInputs } from "../image/ImageMediaInputs";
import { MusicMediaInputs } from "../music/MusicMediaInputs";
import { PromptEditor } from "./PromptEditor";

afterEach(cleanup);

describe("GenSpace shared controls", () => {
  it("submits on Enter but not Shift+Enter", async () => {
    const submit = vi.fn();
    render(
      <PromptEditor
        value="prompt"
        onChange={vi.fn()}
        onSubmit={submit}
        canSubmit
        disabled={false}
        placeholder="Prompt"
      />,
    );
    const editor = screen.getByRole("textbox");
    editor.focus();
    await userEvent.keyboard("{Shift>}{Enter}{/Shift}");
    expect(submit).not.toHaveBeenCalled();
    await userEvent.keyboard("{Enter}");
    expect(submit).toHaveBeenCalledOnce();
  });

  it("keeps Generate disabled when submission is invalid", async () => {
    const submit = vi.fn();
    render(
      <GenerateButton
        onClick={submit}
        disabled
        loading={false}
        label="Generate"
        icon={null}
      />,
    );
    const button = screen.getByRole("button", { name: "Generate" });
    expect((button as HTMLButtonElement).disabled).toBe(true);
    await userEvent.click(button);
    expect(submit).not.toHaveBeenCalled();
  });

  it("accepts a gallery image drop with the profile default role", () => {
    const onChange = vi.fn();
    render(
      <ImageMediaInputs
        inputs={[]}
        onChange={onChange}
        policy={{
          supportsImageInputs: true,
          tooltipLabel: "Reference image",
          maxImages: 2,
          defaultRole: "reference_subject",
          roles: [
            {
              role: "reference_subject",
              label: "Subject",
              description: "Reference subject",
              kind: "reference",
            },
          ],
        }}
        resolveInputFileUrl={vi.fn(async () => null)}
      />,
    );
    const slot = screen.getByTitle("Reference image").parentElement;
    fireEvent.drop(slot!, {
      dataTransfer: {
        getData: () =>
          JSON.stringify({
            type: "image",
            url: "file:///C:/reference.png",
          }),
        files: [],
      },
    });

    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({
        url: "file:///C:/reference.png",
        role: "reference_subject",
        type: "image",
      }),
    ]);
  });

  it("accepts Cover Song and Transfer Timbre gallery drops", () => {
    const onInputChange = vi.fn();
    render(
      <MusicMediaInputs
        coverInput={null}
        referenceTimbreInput={null}
        coverStrength={100}
        onInputChange={onInputChange}
        onCoverStrengthChange={vi.fn()}
        resolveInputFileUrl={vi.fn(async () => null)}
      />,
    );

    fireEvent.drop(screen.getByRole("button", { name: "Add Cover Song" }), {
      dataTransfer: {
        getData: () =>
          JSON.stringify({
            type: "audio",
            url: "file:///C:/reference.wav",
            duration: 12,
          }),
        files: [],
      },
    });

    expect(onInputChange).toHaveBeenNthCalledWith(1, "cover", {
      url: "file:///C:/reference.wav",
      mediaDuration: 12,
      role: "cover",
    });

    fireEvent.drop(
      screen.getByRole("button", { name: "Add Transfer Timbre" }),
      {
        dataTransfer: {
          getData: () =>
            JSON.stringify({
              type: "audio",
              url: "file:///C:/voice.wav",
              duration: 9,
            }),
          files: [],
        },
      },
    );

    expect(onInputChange).toHaveBeenNthCalledWith(2, "reference-timbre", {
      url: "file:///C:/voice.wav",
      mediaDuration: 9,
      role: "reference-timbre",
    });
  });

  it("opens media menus below the header and removes from the slot control", async () => {
    const onInputChange = vi.fn();
    render(
      <MusicMediaInputs
        coverInput={{
          url: "file:///C:/reference.wav",
          role: "cover",
        }}
        referenceTimbreInput={null}
        coverStrength={100}
        onInputChange={onInputChange}
        onCoverStrengthChange={vi.fn()}
        resolveInputFileUrl={vi.fn(async () => null)}
      />,
    );

    await userEvent.click(
      screen.getByRole("button", { name: "Cover Song actions" }),
    );
    expect(
      screen
        .getByText("Audio input")
        .closest("[data-media-menu]")
        ?.classList.contains("top-full"),
    ).toBe(true);
    expect(screen.queryByRole("button", { name: "Remove" })).toBeNull();

    await userEvent.click(
      screen.getByRole("button", { name: "Remove Cover Song" }),
    );

    expect(onInputChange).toHaveBeenCalledWith("cover", null);
  });
});
