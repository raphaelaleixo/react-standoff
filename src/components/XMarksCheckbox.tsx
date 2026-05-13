import { Box } from "@mui/material";
import { palette } from "../theme/colors";
import { fonts } from "../theme/typography";
import { popIn, slashDraw } from "../theme/animations";

interface Props {
  checked: boolean;
  onChange?: (next: boolean) => void;
  // Main caption next to the chip (small-caps display).
  label: string;
  // Optional italic subline below the row.
  hint?: string;
  // When set, the toggle is non-interactive. Used for one-shot actions
  // like the armed grenade where the choice can't be undone.
  disabled?: boolean;
  // ARIA label override — defaults to `label`.
  ariaLabel?: string;
}

// "X marks the spot" toggle — paper-stroked ink chip; when checked, two
// blood-red slashes stamp in. Shared by the lobby variant toggle, the
// Phantom Pain arm, and the Pocket Inferno reveal so all commit-time
// selections read the same visually.
export function XMarksCheckbox({
  checked,
  onChange,
  label,
  hint,
  disabled,
  ariaLabel,
}: Props) {
  const interactive = !!onChange && !disabled;
  const handleToggle = () => {
    if (interactive) onChange!(!checked);
  };
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
      <Box
        role="checkbox"
        aria-checked={checked}
        aria-disabled={disabled || undefined}
        aria-label={ariaLabel ?? label}
        tabIndex={interactive ? 0 : -1}
        onClick={handleToggle}
        onKeyDown={e => {
          if (!interactive) return;
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            handleToggle();
          }
        }}
        sx={{
          display: "flex",
          alignItems: "flex-start",
          gap: "0.7rem",
          cursor: interactive ? "pointer" : "default",
          userSelect: "none",
          opacity: disabled && !checked ? 0.55 : 1,
          "&:focus-visible": {
            outline: `2px solid ${palette.paper}`,
            outlineOffset: "4px",
          },
        }}
      >
        {/* X-marks chip: paper-stroked ink box. When checked, two blood-red
            slashes stroke in (left-leaning first, then right-leaning) with
            a tiny pop on the chip — like a stamp being smacked down.
            Strokes overshoot the chip edges and use slight angle variation
            so they read as hand-drawn, not CAD. */}
        <Box
          sx={{
            position: "relative",
            width: 32,
            height: 32,
            border: `1.5px solid ${palette.paper}`,
            background: palette.inkUp,
            boxShadow: `2px 2px 0 ${palette.inkDeep}`,
            flexShrink: 0,
            overflow: "visible",
            animation: checked
              ? `${popIn} 280ms cubic-bezier(.2,.7,.2,1.4) both`
              : undefined,
          }}
        >
          {checked && (
            <Box
              component="svg"
              viewBox="-10 -10 120 120"
              aria-hidden="true"
              sx={{
                position: "absolute",
                inset: "-10px",
                width: "calc(100% + 20px)",
                height: "calc(100% + 20px)",
                overflow: "visible",
                "& path": {
                  fill: "none",
                  stroke: palette.blood,
                  strokeWidth: 14,
                  strokeLinecap: "round",
                  strokeDasharray: 100,
                },
              }}
            >
              <path
                d="M 8 14 L 92 88"
                pathLength={100}
                style={{
                  animation: `${slashDraw} 200ms cubic-bezier(0.7, 0, 0.3, 1) both`,
                }}
              />
              <path
                d="M 94 10 L 6 90"
                pathLength={100}
                style={{
                  animation: `${slashDraw} 220ms cubic-bezier(0.7, 0, 0.3, 1) 180ms both`,
                }}
              />
            </Box>
          )}
        </Box>
        <Box
          sx={{
            fontFamily: fonts.displayCaps,
            fontFeatureSettings: '"smcp"',
            fontSize: "1.05rem",
            lineHeight: 1,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: palette.paper,
            // Pull the cap-height up so it sits flush with the chip's top
            // edge — without this the line-box's implicit ascent padding
            // floats the text a few pixels below where the eye expects it.
            marginTop: "-0.1em",
          }}
        >
          {label}
        </Box>
      </Box>
      {hint && (
        <Box
          sx={{
            marginLeft: "calc(32px + 0.7rem)",
            fontFamily: fonts.body,
            fontStyle: "italic",
            fontSize: "0.85rem",
            lineHeight: 1.2,
            color: palette.paperDim,
          }}
        >
          {hint}
        </Box>
      )}
    </Box>
  );
}
