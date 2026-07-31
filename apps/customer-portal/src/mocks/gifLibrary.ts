/**
 * Stand-in for a real GIF search API (e.g. Giphy/Tenor). A curated set of
 * brand-toned motion stickers keeps the paper/seal motif intact without
 * pulling in a network dependency for the demo.
 */
export interface GifTile {
  id: string;
  label: string;
  emoji: string;
  gradient: string;
}

export const GIF_LIBRARY: GifTile[] = [
  { id: "confetti", label: "Confetti burst", emoji: "🎉", gradient: "from-mulberry via-plum to-ink" },
  { id: "warm-hug", label: "Warm hug", emoji: "🤗", gradient: "from-rose via-mulberry to-plum" },
  { id: "cheers", label: "Cheers", emoji: "🥂", gradient: "from-champagne via-mulberry to-plum" },
  { id: "balloons", label: "Balloons rising", emoji: "🎈", gradient: "from-periwinkle via-mulberry to-plum" },
  { id: "sparkle", label: "Little sparkle", emoji: "✨", gradient: "from-champagne via-plum to-ink" },
  { id: "dancing", label: "Dancing along", emoji: "💃", gradient: "from-moss via-mulberry to-plum" },
];

export function findGifTile(id: string | undefined) {
  return GIF_LIBRARY.find((tile) => tile.id === id);
}
