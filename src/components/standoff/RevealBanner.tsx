import { Box } from "@mui/material";
import { palette } from "../../theme/colors";
import { fonts } from "../../theme/typography";

type Kind = "broadside" | "kill";

interface RevealBannerProps {
  kind: Kind;
  struckCount?: number;
  name?: string;
}

export function RevealBanner({ kind, struckCount, name }: RevealBannerProps) {
  const headline = kind === "broadside" ? "BROADSIDE!" : "— WALKED THE PLANK —";
  const sub =
    kind === "broadside"
      ? `they double-loaded the powder · ${struckCount ?? 0} struck`
      : (name ?? "");
  return (
    <Box
      role="alert"
      sx={{
        position: "absolute",
        top: "10%",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 10,
        background: palette.blood,
        color: palette.paper,
        padding: "0.5rem 1.6rem",
        border: `3px solid ${palette.paper}`,
        boxShadow: `0 0 0 4px ${palette.blood}, 6px 6px 0 ${palette.inkDeep}`,
        textAlign: "center",
        fontFamily: fonts.displayCaps,
        fontSize: "1.6rem",
        letterSpacing: "0.32em",
      }}
    >
      {headline}
      <Box
        sx={{
          fontFamily: fonts.body,
          fontStyle: "italic",
          fontSize: "0.85rem",
          letterSpacing: "0.04em",
          marginTop: "0.1rem",
          fontWeight: 400,
        }}
      >
        {sub}
      </Box>
    </Box>
  );
}
