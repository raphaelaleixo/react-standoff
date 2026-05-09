import { Box } from "@mui/material";
import { palette } from "../../theme/colors";
import { fonts } from "../../theme/typography";

type Variant = "primary" | "ghost" | "text";

interface ButtonProps {
  variant?: Variant;
  children: React.ReactNode;
  caption?: string;
  emphasis?: boolean;       // primary only — swaps the lift's drop-shadow to gold
  onClick?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  ariaLabel?: string;
}

// How far the "raised key" sits above the frame at rest. The drop-shadow
// uses the same value, so on hover/active the key translates down by this
// amount and the shadow collapses to zero — like pressing a physical key
// down into its well.
const KEY_LIFT = "0.45rem";

export function Button({
  variant = "primary",
  children,
  caption,
  emphasis,
  onClick,
  disabled,
  fullWidth,
  ariaLabel,
}: ButtonProps) {
  const handleClick = () => {
    if (!disabled) onClick?.();
  };
  const handleKey = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.();
    }
  };

  // Primary + ghost both use the raised-key mechanic; only the inner key's
  // background colour differs. Primary is blood (the round's call to action,
  // shouts for attention); ghost is ink (the same paper/ink chrome but
  // visually quieter, for secondary actions).
  if (variant === "primary" || variant === "ghost") {
    const keyBg = variant === "primary" ? palette.bloodDeep : palette.ink;
    const liftShadow = emphasis ? palette.gold : palette.paper;
    return (
      <Box
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={ariaLabel}
        aria-disabled={disabled || undefined}
        data-variant={variant}
        onClick={handleClick}
        onKeyDown={handleKey}
        sx={{
          // Outer frame: invisible "well" the inner key sits in. Bottom
          // padding reserves the lift space so neighbouring layout doesn't
          // shift when the key pushes down on press.
          display: fullWidth ? "block" : "inline-block",
          width: fullWidth ? "100%" : "auto",
          padding: `0 0 ${KEY_LIFT}`,
          background: "transparent",
          border: "none",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.45 : 1,
          "& .raised-key": {
            transition: "transform 0.45s ease, box-shadow 0.45s ease",
          },
          ...(disabled
            ? {}
            : {
                "&:hover .raised-key, &:active .raised-key, &:focus-visible .raised-key":
                  {
                    // Press down: key drops by the lift amount and its drop
                    // shadow collapses to zero. Faster transition on press
                    // than on release so the click feels punchy.
                    transform: `translateY(${KEY_LIFT})`,
                    boxShadow: `0 0 0 0 transparent`,
                    transition: "transform 0.18s ease, box-shadow 0.18s ease",
                  },
              }),
          "&:focus-visible": { outline: "none" },
        }}
      >
        <Box
          className="raised-key"
          sx={{
            position: "relative",
            bottom: KEY_LIFT,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            padding: "0.75rem 1.4rem 1.2rem",
            background: keyBg,
            border: `1.5px solid ${palette.paper}`,
            borderRadius: "4px",
            boxShadow: `0 ${KEY_LIFT} 0 0 ${liftShadow}`,
            color: palette.paper,
            fontFamily: fonts.displayCaps,
            fontFeatureSettings: '"smcp"',
            fontWeight: 700,
            letterSpacing: 0,
            fontSize: "1.45rem",
            textAlign: "center",
            boxSizing: "border-box",
          }}
        >
          <Box sx={{ lineHeight: 1 }}>{children}</Box>
          {/* Caption row always rendered (with a non-breaking space when
              no caption is supplied) so the button keeps the same height
              whether the ready caption is present or not. */}
          <Box
            sx={{
              display: "block",
              fontFamily: fonts.body,
              fontStyle: "italic",
              fontSize: "1.05rem",
              lineHeight: 1.05,
              letterSpacing: 0,
              color: palette.paper,
              marginTop: caption ? 0 : "-0.35rem",
            }}
          >
            {caption ?? " "}
          </Box>
        </Box>
      </Box>
    );
  }

  // Text variant: tertiary action — inline link styling, no lift mechanic.
  return (
    <Box
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      data-variant="text"
      onClick={handleClick}
      onKeyDown={handleKey}
      sx={{
        display: fullWidth ? "block" : "inline-block",
        width: fullWidth ? "100%" : "auto",
        fontFamily: fonts.displayCaps,
        fontFeatureSettings: '"smcp"',
        letterSpacing: 0,
        fontSize: "1.45rem",
        textAlign: "center" as const,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        transition: "transform 0.1s ease",
        border: "none",
        background: "transparent",
        color: palette.paper,
        padding: "0.25rem 0.6rem",
        textDecoration: "none",
        textUnderlineOffset: "4px",
        "&:hover": disabled ? undefined : { textDecoration: "underline" },
        "&:active": disabled ? undefined : { transform: "translateY(1px)" },
        "&:focus-visible": {
          outline: `2px solid ${palette.paper}`,
          outlineOffset: "2px",
          textDecoration: "underline",
        },
      }}
    >
      <Box>{children}</Box>
      <Box
        sx={{
          display: "block",
          fontFamily: fonts.body,
          fontStyle: "italic",
          fontSize: "1.05rem",
          lineHeight: 1.05,
          letterSpacing: 0,
          color: palette.paperDim,
          marginTop: caption ? 0 : "-0.35rem",
        }}
      >
        {caption ?? " "}
      </Box>
    </Box>
  );
}
