import { describe, expect, it } from "vitest";
import {
  createEmptyRegionPrompt,
  isRegionPromptReady,
  moveRegionPromptBbox,
  parseRegionPrompt,
  resizeRegionPromptBbox,
  serializeRegionPrompt,
  type RegionPromptState,
} from "./region-prompt";

describe("Ideogram Region prompt", () => {
  it("serializes camera settings, prompt strings, fonts, and six region colors", () => {
    const value: RegionPromptState = {
      highLevelDescription: "A bold travel poster.",
      background: "A midnight-blue sky.",
      style: {
        medium: "photograph",
        aesthetics: "Graphic, Crisp",
        lighting: "Soft rim light",
        artStyle: "",
        cameraSettings: {
          camera: "ARRI Alexa 35",
          lens: "Premium Spherical Prime",
          focalLength: "35mm",
          aperture: "f/2.8",
          shutter: "1/60s",
          iso: "ISO 800",
        },
        photoDescription: "",
        colorPalette: ["#ffffff", "#1b1b2f", "invalid", "#FFFFFF"],
      },
      elements: [
        {
          id: "subject",
          type: "obj",
          bbox: [120, 260, 760, 760],
          description: "A red airship.",
          text: "",
          font: "",
          colorPalette: [
            "#110000",
            "#220000",
            "#330000",
            "#440000",
            "#550000",
            "#660000",
          ],
        },
        {
          id: "headline",
          type: "text",
          bbox: [80, 100, 180, 900],
          description: "",
          text: "EXPLORE",
          font: "Montserrat",
          colorPalette: ["#ffffff"],
        },
      ],
    };

    expect(serializeRegionPrompt(value)).toBe(
      '{"high_level_description":"A bold travel poster.","style_description":{"aesthetics":"Graphic, Crisp","lighting":"Soft rim light","photo":"Shot on ARRI Alexa 35, Premium Spherical Prime, 35mm, f/2.8, 1/60s, ISO 800","medium":"photograph","color_palette":["#FFFFFF","#1B1B2F"]},"compositional_deconstruction":{"background":"A midnight-blue sky.","elements":[{"type":"obj","bbox":[120,260,760,760],"desc":"A red airship.","color_palette":["#110000","#220000","#330000","#440000","#550000","#660000"]},{"type":"text","bbox":[80,100,180,900],"text":"EXPLORE","desc":"Font: Montserrat.","color_palette":["#FFFFFF"]}]}}',
    );
  });

  it("round-trips editable style prompts and preserves legacy text descriptions", () => {
    const serialized =
      '{"high_level_description":"Storybook scene","style_description":{"aesthetics":"Whimsical, Detailed","lighting":"Golden hour","art_style":"Gouache, Art nouveau","medium":"illustration"},"compositional_deconstruction":{"background":"Forest","elements":[{"type":"text","bbox":[0,0,400,300],"text":"HELLO","desc":"Wide white serif headline."}]}}';
    const parsed = parseRegionPrompt(serialized);

    expect(parsed).toMatchObject({
      highLevelDescription: "Storybook scene",
      background: "Forest",
      style: {
        medium: "illustration",
        aesthetics: "Whimsical, Detailed",
        lighting: "Golden hour",
        artStyle: "Gouache, Art nouveau",
        cameraSettings: null,
      },
      elements: [
        {
          type: "text",
          bbox: [0, 0, 400, 300],
          text: "HELLO",
          font: "",
          description: "Wide white serif headline.",
        },
      ],
    });
    expect(JSON.parse(serializeRegionPrompt(parsed))).toMatchObject({
      style_description: {
        art_style: "Gouache, Art nouveau",
      },
      compositional_deconstruction: {
        elements: [{ desc: "Wide white serif headline." }],
      },
    });
    expect(parseRegionPrompt("A quiet beach").highLevelDescription).toBe(
      "A quiet beach",
    );
  });

  it("restores fonts encoded in text descriptions", () => {
    const parsed = parseRegionPrompt(
      '{"high_level_description":"Poster","compositional_deconstruction":{"background":"","elements":[{"type":"text","bbox":[0,0,200,500],"text":"TITLE","desc":"Font: Futura."}]}}',
    );
    expect(parsed.elements[0].font).toBe("Futura");
  });

  it("clamps keyboard and pointer geometry to the normalized canvas", () => {
    expect(moveRegionPromptBbox([100, 100, 400, 500], -300, 900)).toEqual([
      700, 0, 1000, 400,
    ]);
    expect(resizeRegionPromptBbox([100, 100, 400, 500], -900, -900)).toEqual([
      100, 100, 160, 160,
    ]);
    expect(resizeRegionPromptBbox([100, 100, 400, 500], 900, 900)).toEqual([
      100, 100, 1000, 1000,
    ]);
  });

  it("requires content for every box without requiring a text description", () => {
    const empty = createEmptyRegionPrompt();
    expect(isRegionPromptReady(empty)).toBe(false);
    expect(serializeRegionPrompt(empty)).toBe("");

    const textOnly: RegionPromptState = {
      ...empty,
      elements: [
        {
          id: "text",
          type: "text",
          bbox: [0, 0, 100, 100],
          description: "",
          text: "TITLE",
          font: "",
          colorPalette: [],
        },
      ],
    };
    expect(isRegionPromptReady(textOnly)).toBe(true);
    expect(
      isRegionPromptReady({
        ...textOnly,
        style: { ...textOnly.style, medium: "custom" },
      }),
    ).toBe(false);
    expect(
      isRegionPromptReady({
        ...textOnly,
        elements: [{ ...textOnly.elements[0], font: "custom" }],
      }),
    ).toBe(false);
    expect(
      isRegionPromptReady({
        ...textOnly,
        elements: [
          {
            ...textOnly.elements[0],
            type: "obj",
            text: "",
          },
        ],
      }),
    ).toBe(false);
  });
});
