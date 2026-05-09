// Font-family tokens. The three-face broadside stack:
//   - blackletter:    masthead title, standoff numeral
//   - displayCaps:    UI labels, button text, headings, status pills, column heads
//   - body:           italic captions, nicknames, flavor lines, hints
//
// Crimson Pro is a single family on Google Fonts — small caps come from the
// OpenType `smcp` feature. Pair `displayCaps` with `fontFeatureSettings:
// '"smcp"'` at the call site (or via the theme variant) to get true small caps.
//
// Loaded via Google Fonts <link> in index.html.

export const fonts = {
  blackletter: '"Grenze Gotisch", Georgia, serif',
  displayCaps: '"Crimson Pro", Georgia, serif',
  body: '"Crimson Pro", Georgia, serif',
} as const;
