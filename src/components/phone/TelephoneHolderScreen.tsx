import { Box } from "@mui/material";
import { useTranslation } from "react-i18next";
import { palette } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { Lantern } from "../screens/icons/Lantern";

interface Props {
  isCop: boolean;
  // Whether this holder is the last in the pass order. Unused by current
  // UI but exposed for future tweaks (e.g. label change for last holder).
  isLastHolder: boolean;
  onPass: () => void;
  // Cop tap: writes the call AND advances the holder order in one go.
  // Mafia tap: ignored — the parent routes their Light tap through
  // onPass so the phone-side experience is indistinguishable from cop's.
  onCall: () => void;
}

// Phone full-screen for the current lantern-holder. Both ribbons advance
// the holder order immediately on tap with no visible confirmation, so a
// shoulder-watcher can't tell from the phone alone what choice was made
// (or which role you hold). The big screen handles the public reveal —
// the lantern only lights up there when a real cop calls.
export function TelephoneHolderScreen({ isCop, onPass, onCall }: Props) {
  const { t } = useTranslation();

  // Light tap routes to onCall for the cop (which writes the call AND
  // advances) and to onPass for mafia (decoy bluff — no engine effect,
  // just advance). Either way the screen vanishes the same instant.
  const handleLightTap = () => {
    if (isCop) onCall();
    else onPass();
  };

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.2rem",
        padding: "1.6rem 1rem",
        background: palette.ink,
      }}
    >
      <Box
        sx={{
          fontFamily: fonts.displayCaps,
          fontFeatureSettings: '"smcp"',
          fontSize: "1.05rem",
          letterSpacing: "0.3em",
          color: palette.paper,
          textAlign: "center",
        }}
      >
        {t("cop.telephone.heading")}
      </Box>

      <Lantern lit={false} size={96} />

      <ActionRibbon
        label={t("cop.telephone.light").toUpperCase()}
        subline={t("cop.telephone.lightSub")}
        tone="warm"
        onTap={handleLightTap}
      />
      <ActionRibbon
        label={t("cop.telephone.pass").toUpperCase()}
        subline={t("cop.telephone.passSub")}
        tone="cool"
        onTap={onPass}
      />
    </Box>
  );
}

// One-shot action ribbon — same notched-banner recipe as YieldRibbon but
// without the toggle. Two tones: "warm" (gold, the consequential pick)
// and "cool" (ink, the default pick). Tapping advances the parent flow
// immediately; the ribbon itself has no committed state to show.
function ActionRibbon({
  label,
  subline,
  tone,
  onTap,
}: {
  label: string;
  subline: string;
  tone: "warm" | "cool";
  onTap: () => void;
}) {
  const warm = tone === "warm";
  return (
    <Box
      role="button"
      tabIndex={0}
      onClick={onTap}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onTap();
        }
      }}
      sx={{
        position: "relative",
        width: "100%",
        background: warm ? palette.gold : palette.ink,
        color: warm ? palette.ink : palette.paper,
        textAlign: "center",
        border: `3px solid ${warm ? palette.ink : palette.paper}`,
        boxShadow: warm
          ? `5px 5px 0 ${palette.ink}`
          : `5px 5px 0 ${palette.inkDeep}`,
        padding: "1.2rem 1.4rem 1.3rem",
        cursor: "pointer",
        userSelect: "none",
        transition: "transform 0.1s ease",
        "&:active": { transform: "translate(1px, 1px)" },
        "&:focus-visible": {
          outline: `2px solid ${palette.blood}`,
          outlineOffset: "3px",
        },
        // Notched ends — triangular bite cut into either edge so it
        // reads as a banner with cut tips. Matches YieldRibbon exactly.
        "&::before, &::after": {
          content: '""',
          position: "absolute",
          top: "50%",
          width: "16px",
          height: "calc(100% + 6px)",
          background: palette.ink,
          transform: "translateY(-50%)",
          pointerEvents: "none",
        },
        "&::before": {
          left: "-3px",
          clipPath: "polygon(0 0, 100% 50%, 0 100%)",
        },
        "&::after": {
          right: "-3px",
          clipPath: "polygon(100% 0, 0 50%, 100% 100%)",
        },
      }}
    >
      <Box
        sx={{
          fontFamily: fonts.blackletter,
          fontWeight: 700,
          fontSize: "2.4rem",
          lineHeight: 1,
          letterSpacing: "0.04em",
        }}
      >
        {label}
      </Box>
      <Box
        sx={{
          fontFamily: fonts.body,
          fontStyle: "italic",
          fontSize: "0.85rem",
          letterSpacing: "0.05em",
          marginTop: "0.4rem",
          opacity: 0.85,
        }}
      >
        {subline}
      </Box>
    </Box>
  );
}
