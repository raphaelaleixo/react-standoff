import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Button, Container, Stack, Typography } from "@mui/material";
import { palette } from "../theme/colors";
import { GenericFlag } from "../components/flags/GenericFlag";

export default function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Stack spacing={4} sx={{ alignItems: "center", textAlign: "center" }}>
        <Box sx={{ color: palette.ink }}>
          <GenericFlag size={120} />
        </Box>
        <Typography variant="h1" sx={{ fontSize: { xs: "3rem", md: "4.5rem" } }}>
          {t("home.title")}
        </Typography>
        <Typography variant="h6" sx={{ color: palette.paperDim, fontFamily: "Iowan Old Style, Georgia, serif" }}>
          {t("home.subtitle")}
        </Typography>
        <Stack spacing={2} sx={{ width: "100%", maxWidth: 320 }}>
          <Button variant="contained" size="large" onClick={() => navigate("/join")}>
            {t("home.newGame")}
          </Button>
          <Button variant="outlined" size="large" onClick={() => navigate("/join")}>
            {t("home.resumeGame")}
          </Button>
          <Button variant="text" size="large" onClick={() => navigate("/how-to-play")}>
            {t("home.howToPlay")}
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}
