// Font-family tokens. The four-face broadside stack:
//   - blackletter:    masthead title, standoff numeral
//   - displayCaps:    UI labels, button text, headings, status pills, column heads
//   - body:           italic captions, nicknames, flavor lines, hints
//   - bodySc:         small caps for masthead sub-rule
//
// EB Garamond is a single family on Google Fonts — small caps come from the
// OpenType `smcp` feature. Pair `displayCaps` and `bodySc` with
// `fontFeatureSettings: '"smcp"'` at the call site (or via the theme variant)
// to get true small caps.
//
// Loaded via Google Fonts <link> in index.html.

export const fonts = {
  blackletter: '"Germania One", Georgia, serif',
  displayCaps: '"EB Garamond", Georgia, serif',
  body: '"EB Garamond", Georgia, serif',
  bodySc: '"EB Garamond", Georgia, serif',
} as const;
