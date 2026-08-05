import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GenerateButton } from "./GenerateButton";
import { ImageMediaInputs } from "../image/ImageMediaInputs";
import { MusicMediaInputs } from "../music/MusicMediaInputs";
import { VideoMediaInputs } from "../video/VideoMediaInputs";
import { PromptEditor } from "./PromptEditor";
import type { ModelProfile } from "../../../types/model-profiles";

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

  it("shows the usage chip on occupied media and opens its role menu", async () => {
    render(
      <ImageMediaInputs
        inputs={[
          {
            id: "reference",
            type: "image",
            url: "file:///C:/reference.png",
            role: "reference_subject",
          },
        ]}
        onChange={vi.fn()}
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

    await userEvent.click(
      screen.getByRole("button", { name: "Change Subject usage" }),
    );
    expect(screen.getByText("Image input")).toBeTruthy();
    expect(screen.getAllByText("Subject")).toHaveLength(2);
  });

  it("shows First Frame, Last Frame, and Ref inputs immediately", () => {
    const onChange = vi.fn();
    const profile = {
      inputMedia: {
        supportsImageInputs: true,
        tooltipLabel: "Media inputs",
        maxImages: 4,
        defaultRole: "start_image",
        roles: [
          {
            role: "start_image",
            label: "Start Image",
            description: "Start frame",
            kind: "reference",
          },
          {
            role: "end_image",
            label: "End Image",
            description: "End frame",
            kind: "reference",
          },
        ],
      },
    } as ModelProfile;

    render(
      <VideoMediaInputs
        inputs={[]}
        onChange={onChange}
        profile={profile}
        useAudioTrack
        onUseAudioTrackChange={vi.fn()}
        resolveInputFileUrl={vi.fn(async () => null)}
      />,
    );

    expect(screen.getByTitle("Image 1 (Start)")).toBeTruthy();
    expect(screen.getByTitle("Image 2 (End)")).toBeTruthy();
    expect(
      screen.getByTitle("Click or drop video/audio from gallery"),
    ).toBeTruthy();

    fireEvent.drop(screen.getByTitle("Image 2 (End)").parentElement!, {
      dataTransfer: {
        getData: () =>
          JSON.stringify({
            type: "image",
            url: "file:///C:/last-frame.png",
          }),
        files: [],
      },
    });
    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
    const update = lastCall?.[0] as (
      current: never[],
    ) => Array<{ role: string; url: string }>;
    expect(update([])).toEqual([
      expect.objectContaining({
        role: "end_image",
        url: "file:///C:/last-frame.png",
      }),
    ]);
  });

  it("removes an occupied media input", async () => {
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
    await userEvent.click(
      screen.getByRole("button", { name: "Remove Cover Song" }),
    );

    expect(onInputChange).toHaveBeenCalledWith("cover", null);
  });
});
