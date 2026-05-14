# Homepage hierarchy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebalance the homepage so the brand (logo + tagline) is the focal point, the panel is vertically centered in the viewport, and "How to Play" is demoted from a Button to a quiet italic link.

**Architecture:** Single-file presentation change in `src/pages/HomePage.tsx`. Wrap `PageCanvas` in a `flex: 1` centering container, bump the logo width, and replace the `<Button variant="text">` for "How to Play" with a styled MUI `<Link>` (already imported in the file).

**Tech Stack:** React 19 + TypeScript, MUI (`@emotion`), Vite. Verification is visual via `npm run dev` plus `tsc -b` and `npm test` for regressions.

**Spec:** `docs/superpowers/specs/2026-05-13-homepage-hierarchy-design.md`

---

### Task 1: Rebalance the homepage layout

**Files:**
- Modify: `src/pages/HomePage.tsx`

This is a presentation change. The page has no unit tests today and we are not adding any — the visible changes are pixel/typography decisions that we verify visually in `npm run dev`. Type checking and the existing test suite cover the regression risk for the rest of the app.

The full new `HomePage.tsx` body is given in Step 3 so the engineer can replace the JSX cleanly. The change set in plain language:

1. Wrap `PageCanvas` in a `flex: 1, justifyContent: center` Box so it sits centered between the top of the viewport and the footer.
2. Bump `<StandoffLogo width={300} />` → `<StandoffLogo width="min(440px, 100%)" />`.
3. Replace the `<Button variant="text" fullWidth onClick={() => navigate("/how-to-play")}>{t("home.howToPlay")}</Button>` with a MUI `<Link>` styled as italic body text in `palette.paperDim`, with a small `marginTop` to separate it from the chunky Resume button above.
4. Keep `<Button>` (New Game, Resume Game), `PageCanvas`, `Ludoratory`, and the footer block exactly as they are.

- [ ] **Step 1: Read the current file to confirm starting state**

Run: `cat src/pages/HomePage.tsx | head -160`

Expected: matches the file as committed; in particular `<StandoffLogo width={300} />` on what is currently line 62 and the `<Button variant="text" ...>How to Play</Button>` block on what is currently lines 92–94.

- [ ] **Step 2: Confirm `Link` is already imported from `@mui/material`**

Run: `grep -n 'from "@mui/material"' src/pages/HomePage.tsx`

Expected output: `import { Alert, Box, Link } from "@mui/material";` (no new import needed — the footer already uses `Link`).

- [ ] **Step 3: Apply the edits**

Replace the contents of the `return (...)` block in `src/pages/HomePage.tsx` so the file body becomes:

```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert, Box, Link } from "@mui/material";
import { palette } from "../theme/colors";
import { fonts } from "../theme/typography";
import { PageCanvas } from "../components/shell/PageCanvas";
import { Button } from "../components/shell/Button";
import { StandoffLogo } from "../components/shell/StandoffLogo";
import { Ludoratory } from "../components/shell/Ludoratory";
import { createRoom } from "../lib/createRoom";

export default function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onNewGame = async () => {
    if (creating) return;
    setCreating(true);
    setError(null);
    try {
      const id = await createRoom();
      navigate(`/room/${id}`);
    } catch (e) {
      console.error("createRoom failed:", e);
      setError((e as Error).message);
      setCreating(false);
    }
  };
  return (
    <Box
      sx={{
        position: "relative",
        zIndex: 1,
        minHeight: "100vh",
        padding: "2rem 8px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
        }}
      >
        <PageCanvas sx={{ width: "min(560px, 100%)", padding: "2rem 2rem" }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1.2rem",
              padding: "1rem",
            }}
          >
            <Box
              sx={{
                color: palette.paper,
                filter: "drop-shadow(0 0 16px rgba(255, 195, 120, 0.18))",
              }}
            >
              <StandoffLogo width="min(440px, 100%)" />
            </Box>
            <Box
              sx={{
                fontFamily: fonts.body,
                fontStyle: "italic",
                textAlign: "center",
                color: palette.paperDim,
                fontSize: "1.125em",
                lineHeight: 1.3,
              }}
            >
              {t("home.subtitle")}
            </Box>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.7rem",
                width: "min(320px, 100%)",
                marginTop: "1rem",
              }}
            >
              <Button fullWidth onClick={onNewGame} disabled={creating}>
                {(creating ? t("home.newGameSubmitting") : t("home.newGame")).toUpperCase()}
              </Button>
              {error && <Alert severity="error">{error}</Alert>}
              <Button variant="ghost" fullWidth onClick={() => navigate("/join")} disabled={creating}>
                {t("home.resumeGame").toUpperCase()}
              </Button>
              <Link
                component="button"
                type="button"
                onClick={() => navigate("/how-to-play")}
                underline="hover"
                sx={{
                  marginTop: "0.4rem",
                  fontFamily: fonts.body,
                  fontStyle: "italic",
                  fontSize: "1rem",
                  color: palette.paperDim,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  "&:hover": { color: palette.paper },
                }}
              >
                {t("home.howToPlay")}
              </Link>
            </Box>
          </Box>
        </PageCanvas>
      </Box>
      <Box
        component="footer"
        sx={{
          width: "min(560px, 100%)",
          padding: "1rem 1.2rem 0.6rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "0.7rem",
          color: palette.paper,
          borderTop: `1px solid ${palette.rule}`,
        }}
      >
        <Ludoratory size={32} />
        <Box
          sx={{
            fontFamily: fonts.body,
            fontSize: "0.78rem",
            lineHeight: 1.45,
            color: palette.paperDim,
            textAlign: "center",
          }}
        >
          <Box>
            {t("footer.madeByPrefix")}
            <Link
              href="https://ludoratory.com"
              target="_blank"
              rel="noopener noreferrer"
              underline="none"
              sx={{ color: "inherit" }}
            >
              {t("footer.madeByLink")}
            </Link>
            {t("footer.madeBySuffix")}
          </Box>
          <Box>
            {t("footer.licensePrefix")}
            <Link
              href="https://creativecommons.org/licenses/by-nc-sa/4.0/"
              target="_blank"
              rel="noopener noreferrer"
              underline="none"
              sx={{ color: "inherit" }}
            >
              {t("footer.licenseLink")}
            </Link>
            {t("footer.licenseSuffix")}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
```

Key diffs vs the previous file:
- Removed `gap: "0.4rem"` from the outer Box (the new flex-center wrapper replaces the need for it).
- Added a new wrapper Box with `flex: 1, justifyContent: center, alignItems: center, width: 100%` between the outer Box and `PageCanvas`. This is what vertically centers the panel.
- `<StandoffLogo width={300} />` → `<StandoffLogo width="min(440px, 100%)" />`.
- The third action in the inner button column changed from `<Button variant="text" fullWidth ...>How to Play</Button>` to the `<Link component="button" ...>` block above (no `fullWidth` — sits centered as an inline italic link).
- The inner button column now uses `alignItems: "center"` so the Link sits centered even though it isn't `fullWidth`.

- [ ] **Step 4: Type-check the change**

Run: `npx tsc -b`

Expected: no errors. (The `StandoffLogo` component's `width` prop already accepts `number | string`, so passing `"min(440px, 100%)"` is type-safe; `Link` from `@mui/material` accepts `component="button"`.)

- [ ] **Step 5: Run the existing test suite to catch regressions**

Run: `npm test -- --run`

Expected: all currently-passing tests still pass. We don't touch any of the components under `src/components/`, so no test should change behavior.

- [ ] **Step 6: Visual verification (manual)**

Run: `npm run dev` and open the room URL printed in the terminal (typically `http://localhost:5173/`).

Check, on both desktop and a phone-sized viewport (use browser devtools responsive mode at ~390px wide):
- Logo visibly larger than before; reads as the dominant element on the panel.
- The panel sits vertically centered between the top of the viewport and the footer (with normal viewport heights — on very short viewports it may still scroll, which is fine).
- "How to Play" appears as small italic body text in `palette.paperDim`, centered, no border or raised-key affordance. Hovering shows underline and brightens to `palette.paper`.
- Clicking "How to Play" still navigates to `/how-to-play`.
- "New Game" and "Resume Game" are visually unchanged.
- Footer (Ludoratory + made-by + license) is unchanged and sits at the bottom.

If anything looks wrong, fix in place and re-verify before moving on.

- [ ] **Step 7: Commit**

```bash
git add src/pages/HomePage.tsx
git commit -m "feat(home): rebalance hierarchy — bigger logo, vertical center, link-style How to Play

Spec: docs/superpowers/specs/2026-05-13-homepage-hierarchy-design.md"
```

---

## Notes

- Per the project memory, no PR step is needed — direct commit on `main` is fine.
- `MockBigScreen` is not affected (it's the big-screen mock, not the homepage). No mirror edit required.
- Atmospheric/animated treatments are deferred to a future change — out of scope here.
