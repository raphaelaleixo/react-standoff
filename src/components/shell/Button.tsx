import { Box } from "@mui/material";
import { palette } from "../../theme/colors";
import { fonts } from "../../theme/typography";

type Variant = "primary" | "ghost" | "text";

interface ButtonProps {
  variant?: Variant;
  children: React.ReactNode;
  caption?: string;
  emphasis?: boolean;       // primary only — adds the blood drop-shadow (HOIST THE COLOURS)
  onClick?: () => void;
  disabled?: boolean;
  fullWidth?: boolean;
  ariaLabel?: string;
}

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
  const baseSx = {
    display: fullWidth ? "block" : "inline-block",
    width: fullWidth ? "100%" : "auto",
    fontFamily: fonts.displayCaps,
    fontFeatureSettings: '"smcp"',
    letterSpacing: "0.32em",
    fontSize: "1.17rem",
    textAlign: "center" as const,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.45 : 1,
    transition: "transform 0.1s ease, box-shadow 0.1s ease",
    border: "none",
    "&:active": disabled ? undefined : { transform: "translateY(1px)" },
    "&:focus-visible": {
      outline: `2px solid ${palette.paper}`,
      outlineOffset: "2px",
    },
  };

  const variantSx =
    variant === "primary"
      ? {
          background: palette.paper,
          color: palette.ink,
          padding: "0.85rem 1.4rem",
          boxShadow: emphasis
            ? `0 0 0 4px ${palette.ink}, 5px 5px 0 ${palette.blood}`
            : `5px 5px 0 ${palette.inkDeep}`,
        }
      : variant === "ghost"
      ? {
          background: "transparent",
          color: palette.paper,
          padding: "0.7rem 1.2rem",
          border: `1.5px solid ${palette.paper}`,
        }
      : {
          background: "transparent",
          color: palette.paper,
          padding: "0.4rem 0.6rem",
          textDecoration: "underline",
          textUnderlineOffset: "4px",
        };

  return (
    <Box
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      data-variant={variant}
      onClick={() => !disabled && onClick?.()}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (disabled) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      sx={{ ...baseSx, ...variantSx }}
    >
      <Box>{children}</Box>
      {caption && (
        <Box
          sx={{
            display: "block",
            fontFamily: fonts.body,
            fontStyle: "italic",
            fontSize: "0.89rem",
            letterSpacing: "0.04em",
            color: variant === "primary" ? palette.paperFaint : palette.paperDim,
            marginTop: "0.15rem",
          }}
        >
          {caption}
        </Box>
      )}
    </Box>
  );
}
