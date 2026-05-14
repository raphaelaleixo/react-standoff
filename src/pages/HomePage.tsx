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
                width: "100%",
                marginTop: "1rem",
              }}
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                  gap: "0.7rem",
                  width: { xs: "min(320px, 100%)", sm: "min(480px, 100%)" },
                  // When the chunky buttons sit side-by-side on sm+, the in-game
                  // 2.6rem horizontal padding leaves too little room for "RESUME
                  // GAME" and forces it to wrap. Slim that padding only here.
                  "& .raised-key": {
                    paddingLeft: { sm: "1rem" },
                    paddingRight: { sm: "1rem" },
                  },
                }}
              >
                <Button fullWidth onClick={onNewGame} disabled={creating}>
                  <Box component="span" sx={{ whiteSpace: "nowrap" }}>
                    {(creating ? t("home.newGameSubmitting") : t("home.newGame")).toUpperCase()}
                  </Box>
                </Button>
                <Button variant="ghost" fullWidth onClick={() => navigate("/join")} disabled={creating}>
                  <Box component="span" sx={{ whiteSpace: "nowrap" }}>
                    {t("home.resumeGame").toUpperCase()}
                  </Box>
                </Button>
              </Box>
              {error && (
                <Alert severity="error" sx={{ width: { xs: "min(320px, 100%)", sm: "min(480px, 100%)" } }}>
                  {error}
                </Alert>
              )}
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
