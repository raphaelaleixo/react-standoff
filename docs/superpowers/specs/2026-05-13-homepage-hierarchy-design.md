# Homepage hierarchy redesign

**Date:** 2026-05-13
**Scope:** `src/pages/HomePage.tsx` only

## Problem

The current homepage has a visible imbalance:

- **Logo** renders at `width=300` → ~102px tall (412:140 aspect)
- **Button block** is ~256px tall (three raised-key buttons, each with a reserved caption row even when empty)
- **No vertical centering** — outer Box has `minHeight: 100vh` but no `justifyContent`, so content hugs the top edge

Net effect: the button block is ~2.5× taller than the logo and the entire panel sits pinned to the top of the viewport. Reads as button-heavy and top-anchored rather than brand-led and centered.

## Goal

Rebalance the homepage so the brand (logo + tagline) is the focal point, the primary action is prominent, and the page sits centered between top and footer — without changing the in-game button language or touching other pages.

## Design

### Layout structure

```
<Outer  minHeight:100vh, flex column>
  <CenterWrap  flex:1, justifyContent:center, alignItems:center>
    <PageCanvas>
      Logo (larger)
      Subtitle
      New Game     ← primary chunky button (unchanged Button)
      Resume Game  ← ghost chunky button (unchanged Button)
      How to Play  ← plain italic text link (NOT the Button text variant)
    </PageCanvas>
  </CenterWrap>
  <Footer />        ← unchanged, sits at the bottom
</Outer>
```

### Concrete changes (all in `src/pages/HomePage.tsx`)

1. **Vertical centering.** Wrap `PageCanvas` in a `flex: 1` container with `display: flex`, `flexDirection: column`, `justifyContent: center`, `alignItems: center`. The footer remains a sibling below it, no longer crowding the panel. Outer Box stays `minHeight: 100vh`, `flex column`.

2. **Logo size.** Change `<StandoffLogo width={300} />` to `<StandoffLogo width="min(440px, 100%)" />`. At 440px the logo renders ~149px tall, roughly filling the canvas's usable inner width (~496px after PageCanvas padding).

3. **"How to Play" link.** Replace `<Button variant="text" fullWidth onClick={() => navigate("/how-to-play")}>{t("home.howToPlay")}</Button>` with a MUI `Link` styled as:
   - `fonts.body`, `fontStyle: italic`, `fontSize: ~1rem`
   - color `palette.paperDim`, underline on hover only (`underline="hover"`)
   - centered (sits inside the same vertical button column, but without `fullWidth` background)
   - same navigation behavior (`onClick` → `navigate("/how-to-play")`)
   - keep a small `marginTop` (e.g. ~0.4rem) so it visually separates from the chunky Resume button above

4. **Buttons unchanged.** New Game (primary) and Resume Game (ghost) keep their current `<Button>` usage — same chunky raised-key treatment as today.

### What stays the same

- `Button` component — no new props, no compact variant
- `PageCanvas` framing — keep the panel
- Subtitle styling and copy
- Footer (Ludoratory + made-by + license) — pinned at the bottom
- All i18n strings (`home.newGame`, `home.resumeGame`, `home.howToPlay`)
- Background / atmospheric treatment — out of scope for this change
- All other pages

## Expected outcome

- Logo grows from ~102px → ~149px tall, ~85% of the panel's inner width
- Button block: New Game (~78px) + Resume (~78px) + How to Play link (~22px italic line) ≈ 200px total — comparable to brand block (logo ~149 + subtitle ~36 + gaps ≈ 200px)
- Vertical centering anchors the panel between top of viewport and footer
- Hierarchy reads: Brand → tagline → primary CTA → recovery CTA → quiet help link

## Out of scope (deferred)

- Atmospheric background motion (fog, parallax, etc.) — possible follow-up
- Animated logo / hero element — possible follow-up
- Changes to the `Button` component itself
- Changes to other pages, including matching mock pages

## Files touched

- `src/pages/HomePage.tsx` (only)
