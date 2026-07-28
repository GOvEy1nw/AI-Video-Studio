export const MUSIC_KEYWORDS = {
  Genre: ["Ambient", "Cinematic", "Pop", "Rock", "Electronic", "Hip-Hop", "Jazz", "Orchestral", "Folk", "R&B", "House", "Drum & Bass", "Lo-Fi", "Metal", "Funk"],
  Mood: ["Uplifting", "Melancholic", "Tense", "Hopeful", "Dreamy", "Energetic", "Intimate", "Mysterious", "Triumphant", "Playful", "Dark", "Peaceful"],
  Instruments: ["Piano", "Acoustic Guitar", "Electric Guitar", "Strings", "Synth Pads", "Drums", "Bass", "Brass", "Woodwinds", "Choir", "Percussion", "Arpeggiated Synth"],
  Vibe: ["Modern", "Retro", "Epic", "Minimal", "Organic", "Glossy", "Raw", "Atmospheric", "Trailer-Like", "Radio-Ready", "Experimental", "Warm"],
} as const;

function tokens(description: string): string[] {
  return description.split(",").map((token) => token.trim()).filter(Boolean);
}

export function hasMusicKeyword(description: string, keyword: string): boolean {
  return tokens(description).some(
    (token) => token.toLocaleLowerCase() === keyword.toLocaleLowerCase(),
  );
}

export function toggleMusicKeyword(
  description: string,
  keyword: string,
  maxLength = 512,
): string {
  const current = tokens(description);
  const normalized = keyword.trim().toLocaleLowerCase();
  const existingIndex = current.findIndex(
    (token) => token.toLocaleLowerCase() === normalized,
  );
  if (existingIndex >= 0) {
    current.splice(existingIndex, 1);
    return current.join(", ");
  }
  const next = [...current, keyword.trim()].join(", ");
  return next.length <= maxLength ? next : description;
}
