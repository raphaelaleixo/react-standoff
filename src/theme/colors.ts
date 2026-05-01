// Semantic color tokens for the pirate theme. The palette is two-color (parchment +
// ink) with three accent roles (gold, signal, yellow ribbon). Each flag also has a
// signature accent used on player cards and chips.

export const palette = {
  parchment: "#e8d8b0",
  parchmentDark: "#c9a874",
  ink: "#5a371d",
  inkSoft: "#7a4d2a",
  gold: "#d4a85a",
  goldDeep: "#a8842c",
  signal: "#c93a30",
  yellow: "#e6c440",
} as const;

// Per-flag signature color used for card borders, target-picker accents, and chips.
// Keys match flag ids in `playerFlags.ts`.
export const flagSignatureColors = {
  calico_jack: "#c93a30",   // red
  blackbeard: "#1e2a3a",    // deep navy
  black_bart: "#a8842c",    // gold
  henry_avery: "#2a6b5a",   // sea green
  edward_low: "#7a1f1f",    // burgundy
  stede_bonnet: "#5a2a6b",  // purple
  generic: "#5a371d",       // ink (fallback)
} as const;

export type FlagId = keyof typeof flagSignatureColors;

export function flagColor(id: string): string {
  return (flagSignatureColors as Record<string, string>)[id] ?? flagSignatureColors.generic;
}
