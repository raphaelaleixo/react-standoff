// Semantic color tokens. The broadside metaphor is preserved: "ink" is the dark
// tone, "paper" is the cream tone. Their roles are inverted vs. a printed page —
// the canvas is ink, the type is paper.

export const palette = {
  // Page surfaces — dark
  ink: "#14110d",
  inkDeep: "#0a0807",
  inkUp: "#2a2118",

  // Type & line work — cream
  paper: "#ede0c4",
  paperDim: "#b8a888",
  paperFaint: "#6e5c40",

  // Hairlines & rules — translucent cream
  rule: "rgba(237, 224, 196, 0.22)",
  ruleStrong: "rgba(237, 224, 196, 0.45)",

  // Accents — calibrated for dark backgrounds
  blood: "#c93a30",
  bloodDeep: "#8a2018",
  gold: "#d4a85a",
  goldDeep: "#a8842c",
  yellow: "#e6c440",
  jewelPurple: "#b48ac8",
  silverGray: "#d8d2c4",
} as const;

// Per-flag signature color used for card borders, target-picker accents, and chips.
// Lifted vs. previous values where dark contrast required it (blackbeard, edward_low).
export const flagSignatureColors = {
  calico_jack: "#ea6e3c",  // terracotta — pushed warmer, into orange-red territory
  blackbeard: "#4a7ec8",   // cobalt blue — cleaner, more saturated
  black_bart: "#d4a85a",   // gold
  henry_avery: "#4ea84e",  // leaf green — pushed away from teal
  edward_low: "#bc5e72",   // dusty rose/wine — cool/purple-leaning red, lifted further
  stede_bonnet: "#9069a8", // purple, lifted
  generic: "#b8a888",      // paperDim (was ink — unusable on dark)
} as const;

export type FlagId = keyof typeof flagSignatureColors;

export function flagColor(id: string): string {
  return (flagSignatureColors as Record<string, string>)[id] ?? flagSignatureColors.generic;
}
