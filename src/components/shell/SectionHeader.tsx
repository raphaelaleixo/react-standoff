import { Box } from "@mui/material";
import { palette } from "../../theme/colors";
import { fonts } from "../../theme/typography";

interface SectionHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
}

export function SectionHeader({ title, subtitle }: SectionHeaderProps) {
  return (
    <Box
      sx={{
        textAlign: "center",
        fontFamily: fonts.blackletter,
        fontSize: "2rem",
        fontWeight: 700,
        lineHeight: 1,
        color: palette.paperDim,
        paddingBlock: "0.8rem",
        marginBottom: "0.45rem",
      }}
    >
      {title}
      {subtitle && (
        <Box sx={{ fontFamily: fonts.body, fontStyle: "italic", fontSize: "1.1rem", fontWeight: 500, letterSpacing: "normal", color: palette.paper, marginTop: "0.05rem" }}>
          {subtitle}
        </Box>
      )}
    </Box>
  );
}
