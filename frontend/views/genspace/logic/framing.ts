import type { FramingSettings } from "../types";

export interface FramingPreset {
  id: string;
  name: string;
  description: string;
  settings: FramingSettings;
}

export const FRAMING_OPTIONS = {
  camera: [
    "iPhone 15 Pro",
    "Canon EOS R5",
    "RED Komodo Cinema",
    "ARRI Alexa 35",
    "Sony Venice 2",
  ],
  lens: [
    "Premium Spherical Prime",
    "Anamorphic Cinema",
    "Canon EF Photo Zoom",
    "Macro Lens",
    "iPhone Natural Lens",
  ],
  focalLength: [
    "10mm",
    "14mm",
    "20mm",
    "24mm",
    "28mm",
    "35mm",
    "42mm",
    "50mm",
    "75mm",
    "85mm",
    "135mm",
    "200mm",
    "400mm",
    "500mm",
    "600mm",
  ],
  aperture: [
    "f/0.95",
    "f/1.4",
    "f/2",
    "f/2.8",
    "f/4",
    "f/5.6",
    "f/8",
    "f/11",
    "f/16",
    "f/22",
  ],
  shutter: [
    "1/2s",
    "1/4s",
    "1/8s",
    "1/15s",
    "1/30s",
    "1/60s",
    "1/125s",
    "1/250s",
    "1/500s",
    "1/1000s",
    "1/2000s",
    "1/4000s",
    "1/8000s",
  ],
  iso: [
    "ISO 50",
    "ISO 100",
    "ISO 200",
    "ISO 400",
    "ISO 800",
    "ISO 1600",
    "ISO 3200",
    "ISO 6400",
    "ISO 12800",
    "ISO 25600",
    "ISO 51200",
  ],
} satisfies Record<keyof FramingSettings, string[]>;

export const FRAMING_PRESETS: FramingPreset[] = [
  {
    id: "cinematic-arri",
    name: "Cinematic ARRI",
    description: "Clean studio cinema",
    settings: {
      camera: "ARRI Alexa 35",
      lens: "Premium Spherical Prime",
      focalLength: "35mm",
      aperture: "f/2.8",
      shutter: "1/60s",
      iso: "ISO 800",
    },
  },
  {
    id: "dslr-portrait",
    name: "DSLR Portrait",
    description: "Soft background",
    settings: {
      camera: "Canon EOS R5",
      lens: "Canon EF Photo Zoom",
      focalLength: "85mm",
      aperture: "f/2",
      shutter: "1/125s",
      iso: "ISO 200",
    },
  },
  {
    id: "red-product",
    name: "RED Product",
    description: "Crisp commercial",
    settings: {
      camera: "RED Komodo Cinema",
      lens: "Macro Lens",
      focalLength: "50mm",
      aperture: "f/5.6",
      shutter: "1/125s",
      iso: "ISO 400",
    },
  },
  {
    id: "iphone-natural",
    name: "iPhone Natural",
    description: "Casual realism",
    settings: {
      camera: "iPhone 15 Pro",
      lens: "iPhone Natural Lens",
      focalLength: "24mm",
      aperture: "f/2",
      shutter: "1/125s",
      iso: "ISO 100",
    },
  },
  {
    id: "vintage-anamorphic",
    name: "Vintage Anamorphic",
    description: "Wide cinematic flare",
    settings: {
      camera: "Sony Venice 2",
      lens: "Anamorphic Cinema",
      focalLength: "50mm",
      aperture: "f/2",
      shutter: "1/60s",
      iso: "ISO 800",
    },
  },
];

export const DEFAULT_FRAMING_SETTINGS: FramingSettings = {
  ...FRAMING_PRESETS[0].settings,
};

export function buildFramingPrefix(settings: FramingSettings) {
  return `Shot on ${settings.camera}, ${settings.lens}, ${settings.focalLength}, ${settings.aperture}, ${settings.shutter}, ${settings.iso}`;
}

export function applyFramingPrefix(
  prompt: string,
  settings: FramingSettings | null,
) {
  return settings
    ? `${buildFramingPrefix(settings)}. ${prompt.trim()}`
    : prompt;
}

export function formatFramingIndicator(settings: FramingSettings) {
  return [
    settings.camera,
    settings.lens,
    settings.focalLength,
    settings.aperture,
    settings.shutter,
    settings.iso,
  ].join("-");
}
