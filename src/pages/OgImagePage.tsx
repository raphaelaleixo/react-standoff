import { useTranslation } from "react-i18next";
import { Box } from "@mui/material";
import { palette } from "../theme/colors";
import { fonts } from "../theme/typography";
import { StandoffLogo } from "../components/shell/StandoffLogo";
import { FlagFor } from "../components/flags";
import { jollyRogerForColor } from "../components/flags/jollyRogerForColor";

// Static 1200×630 surface used as the og:image source. Visit /og-image in
// dev, screenshot the page, drop the PNG into public/. The route is dev-
// only because it's a build-time artefact — not a runtime URL we'd ship.
const W = 1200;
const H = 630;

const CREW_COLORS = [
  "calico_jack",
  "blackbeard",
  "edward_low",
  "stede_bonnet",
  "black_bart",
  "henry_avery",
] as const;

export default function OgImagePage() {
  const { t } = useTranslation();
  return (
    <Box
      sx={{
        width: `${W}px`,
        height: `${H}px`,
        background: palette.ink,
        position: "relative",
        overflow: "hidden",
        // Reset any inherited body padding/margin so the canvas fills the
        // viewport exactly for the screenshot tool.
        margin: 0,
        // Subtle vignette so the centred logo lifts off the ink.
        boxShadow: `inset 0 0 200px rgba(0,0,0,0.6)`,
      }}
    >
      {/* Crew rail along the top — six jolly rogers, evenly spaced. Reads
          as "the table" at a glance. */}
      <Box
        sx={{
          position: "absolute",
          top: 48,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: "2.4rem",
          opacity: 0.85,
        }}
      >
        {CREW_COLORS.map(c => (
          <Box
            key={c}
            sx={{
              width: 88,
              height: 58,
              border: `2.5px solid ${palette.paper}`,
              background: palette.inkUp,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: palette.paper,
              boxShadow: `4px 4px 0 ${palette.inkDeep}`,
            }}
          >
            <FlagFor id={jollyRogerForColor(c)} size={36} />
          </Box>
        ))}
      </Box>

      {/* Centred logo + tagline */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "2rem",
          paddingTop: "40px",
        }}
      >
        <Box
          sx={{
            color: palette.paper,
            filter: "drop-shadow(0 0 32px rgba(255, 195, 120, 0.22))",
          }}
        >
          <StandoffLogo width={620} />
        </Box>
        <Box
          sx={{
            fontFamily: fonts.body,
            fontStyle: "italic",
            color: palette.paperDim,
            fontSize: "2rem",
            lineHeight: 1.2,
            textAlign: "center",
            maxWidth: "900px",
          }}
        >
          {t("home.subtitle")}
        </Box>
      </Box>

      {/* Foot — domain mark */}
      <Box
        sx={{
          position: "absolute",
          bottom: 36,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: fonts.displayCaps,
          fontFeatureSettings: '"smcp"',
          fontSize: "1.1rem",
          letterSpacing: "0.4em",
          color: palette.paperFaint,
        }}
      >
        standoff.ludoratory.com
      </Box>
    </Box>
  );
}
