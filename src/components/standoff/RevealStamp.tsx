import { Box } from "@mui/material";
import { palette } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { popIn } from "../../theme/animations";

interface RevealStampProps {
  label: string;
}

// Phase-label overlay for the reveal beats — replaces the older red
// broadside / kill banners. Sits centred on the targeting map in
// blackletter and pops in on each label change.
export function RevealStamp({ label }: RevealStampProps) {
  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 5,
      }}
    >
      <Box
        key={label}
        sx={{
          fontFamily: fonts.blackletter,
          fontSize: "7rem",
          lineHeight: 1,
          color: palette.blood,
          textShadow: "0 0 20px rgba(201, 58, 48, 0.55), 0 0 40px rgba(201, 58, 48, 0.3)",
          // Blackletter glyphs sit low in their em-box, plus we want the
          // label visually above the map's centre rather than dead-on it.
          transform: "translateY(-0.6em)",
          animation: `${popIn} 360ms cubic-bezier(.2,.7,.2,1.4) both`,
        }}
      >
        {label}
      </Box>
    </Box>
  );
}
