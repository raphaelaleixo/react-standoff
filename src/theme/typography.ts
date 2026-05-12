// Font-family tokens. The three-face broadside stack:
//   - blackletter:    masthead title, standoff numeral
//   - displayCaps:    UI labels, button text, headings, status pills, column heads
//   - body:           italic captions, nicknames, flavor lines, hints
//
// Platypi is a single family on Google Fonts. Loaded via Google Fonts <link>
// in index.html. Note: unlike Crimson Pro, Platypi does not ship an OpenType
// `smcp` (small caps) feature — call sites that previously relied on it will
// fall back to regular caps via `textTransform: 'uppercase'`.

export const fonts = {
  blackletter: '"Grenze Gotisch", Georgia, serif',
  displayCaps: '"Platypi", Georgia, serif',
  body: '"Platypi", Georgia, serif',
} as const;
