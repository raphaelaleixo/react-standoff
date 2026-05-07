import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box } from "@mui/material";
import { palette } from "../theme/colors";
import { fonts } from "../theme/typography";
import { PageCanvas } from "../components/shell/PageCanvas";
import { Button } from "../components/shell/Button";
import { GenericFlag } from "../components/flags/GenericFlag";

export default function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <Box
      sx={{
        width: "100vw",
        minHeight: "100vh",
        padding: "8px",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <PageCanvas sx={{ width: "min(560px, 100%)", padding: "3rem 2rem" }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "1.2rem",
            padding: "1rem",
          }}
        >
          <Box sx={{ color: palette.paper }}>
            <GenericFlag size={96} />
          </Box>
          <Box
            sx={{
              fontFamily: fonts.blackletter,
              fontWeight: 700,
              fontSize: "4rem",
              lineHeight: 0.9,
              color: palette.paper,
              textShadow: "0 0 12px rgba(255, 195, 120, 0.18)",
              textAlign: "center",
            }}
          >
            {t("home.title")}
          </Box>
          <Box
            sx={{
              fontFamily: fonts.body,
              fontStyle: "italic",
              textAlign: "center",
              color: palette.paperDim,
              fontSize: "1rem",
            }}
          >
            {t("home.subtitle")}
          </Box>
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: "0.7rem",
              width: "min(320px, 100%)",
              marginTop: "1rem",
            }}
          >
            <Button fullWidth onClick={() => navigate("/join")}>
              {t("home.newGame").toUpperCase()}
            </Button>
            <Button variant="ghost" fullWidth onClick={() => navigate("/join")}>
              {t("home.resumeGame").toUpperCase()}
            </Button>
            <Button variant="text" fullWidth onClick={() => navigate("/how-to-play")}>
              {t("home.howToPlay")}
            </Button>
          </Box>
        </Box>
      </PageCanvas>
    </Box>
  );
}
