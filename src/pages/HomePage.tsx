import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert, Box } from "@mui/material";
import { palette } from "../theme/colors";
import { fonts } from "../theme/typography";
import { PageCanvas } from "../components/shell/PageCanvas";
import { Button } from "../components/shell/Button";
import { StandoffLogo } from "../components/shell/StandoffLogo";
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
          <Box
            sx={{
              color: palette.paper,
              filter: "drop-shadow(0 0 16px rgba(255, 195, 120, 0.18))",
            }}
          >
            <StandoffLogo width={300} />
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
              gap: "0.7rem",
              width: "min(320px, 100%)",
              marginTop: "1rem",
            }}
          >
            <Button fullWidth onClick={onNewGame} disabled={creating}>
              {(creating ? t("home.newGameSubmitting") : t("home.newGame")).toUpperCase()}
            </Button>
            {error && <Alert severity="error">{error}</Alert>}
            <Button variant="ghost" fullWidth onClick={() => navigate("/join")} disabled={creating}>
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
