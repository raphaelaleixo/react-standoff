// Font-family tokens. The four-face broadside stack:
//   - blackletter:    masthead title, standoff numeral
//   - displayCaps:    UI labels, button text, headings, status pills, column heads
//   - body:           italic captions, nicknames, flavor lines, hints
//   - bodySc:         small caps for masthead sub-rule
//
// Loaded via Google Fonts <link> in index.html.

export const fonts = {
  blackletter: '"UnifrakturCook", "IM Fell DW Pica SC", Georgia, serif',
  displayCaps: '"IM Fell DW Pica SC", Georgia, serif',
  body: '"IM Fell English", Georgia, serif',
  bodySc: '"IM Fell English SC", Georgia, serif',
} as const;
