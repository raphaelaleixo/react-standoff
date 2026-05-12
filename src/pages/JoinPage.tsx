import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Alert, Box, useMediaQuery, useTheme } from "@mui/material";
import { palette } from "../theme/colors";
import { fonts } from "../theme/typography";
import { PageCanvas } from "../components/shell/PageCanvas";
import { PhoneHeader } from "../components/shell/PhoneHeader";
import { Masthead } from "../components/shell/Masthead";
import { Button } from "../components/shell/Button";
import { roomExists } from "../hooks/useFirebaseRoom";

type Destination = "host" | "player";

export default function JoinPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  // Pick the header that matches the device shape rather than the page width.
  // < sm (≈600px) ⇒ phone header; everything else gets the in-game masthead
  // so a desktop browser landing on /join feels continuous with the room view.
  const isPhone = useMediaQuery(theme.breakpoints.down("sm"));
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<Destination | null>(null);

  const onJoin = async (dest: Destination) => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setSubmitting(dest);
    setError(null);
    try {
      const exists = await roomExists(trimmed);
      if (!exists) {
        setError(t("join.notFound"));
        setSubmitting(null);
        return;
      }
      navigate(dest === "host" ? `/room/${trimmed}` : `/room/${trimmed}/player`);
    } catch (e) {
      console.error("join failed:", e);
      setError((e as Error).message);
      setSubmitting(null);
    }
  };

  const codeReady = !!code.trim() && submitting === null;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        padding: "8px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: isPhone ? "stretch" : "flex-start",
      }}
    >
      {!isPhone && <Masthead onLogoClick={() => navigate("/")} />}
      <Box
        sx={{
          flex: isPhone ? 1 : "0 0 auto",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginTop: isPhone ? 0 : "2rem",
        }}
      >
        <PageCanvas
          borderRadius={isPhone ? 28 : undefined}
          sx={{
            width: "min(480px, 100%)",
            ...(isPhone && { height: "100%", maxWidth: "440px" }),
          }}
        >
          {isPhone && <PhoneHeader />}
          <Box
            component="form"
            onSubmit={(e: React.FormEvent) => {
              e.preventDefault();
              // Enter on the code field defaults to joining as a player (the
              // most common path); host route is a deliberate click.
              if (codeReady) onJoin("player");
            }}
            sx={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <Box
              sx={{
                fontFamily: fonts.blackletter,
                fontWeight: 700,
                fontSize: "2rem",
                lineHeight: 1,
                textAlign: "center",
                color: palette.paper,
              }}
            >
              {t("join.title")}
            </Box>

            <Box sx={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
              <Box
                sx={{
                  fontFamily: fonts.displayCaps,
                  fontFeatureSettings: '"smcp"',
                  fontSize: "0.62rem",
                  letterSpacing: "0.36em",
                  color: palette.paperDim,
                  textAlign: "center",
                }}
              >
                {t("join.codeLabel").toUpperCase()}
              </Box>
              <Box
                component="input"
                value={code}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCode(e.target.value.toUpperCase())}
                placeholder={t("join.codePlaceholder")}
                autoFocus
                maxLength={8}
                sx={{
                  background: "transparent",
                  border: "none",
                  borderBottom: `2px solid ${palette.paper}`,
                  textAlign: "center",
                  fontFamily: fonts.displayCaps,
                  fontFeatureSettings: '"smcp"',
                  fontSize: "2rem",
                  letterSpacing: "0.36em",
                  color: palette.paper,
                  padding: "0.4rem 0.4rem 0.3rem",
                  textTransform: "uppercase",
                  // Placeholder reads as a quiet hint — drop the small-caps,
                  // tracking, and uppercase so it doesn't compete visually
                  // with the room code the player is about to type in.
                  "&::placeholder": {
                    color: palette.paperFaint,
                    opacity: 1,
                    fontFamily: fonts.body,
                    fontStyle: "italic",
                    fontFeatureSettings: "normal",
                    letterSpacing: "0.02em",
                    textTransform: "none",
                    fontSize: "1.05rem",
                  },
                  "&:focus": { outline: "none", borderColor: palette.blood },
                }}
              />
            </Box>

            {error && <Alert severity="error">{error}</Alert>}

            <Box sx={{ display: "flex", flexDirection: "column", gap: "0.7rem", marginTop: "1rem" }}>
              <Button
                fullWidth
                disabled={!codeReady}
                onClick={() => onJoin("host")}
              >
                {(submitting === "host" ? t("join.joinSubmitting") : t("join.joinAsHost")).toUpperCase()}
              </Button>
              <Button
                variant="ghost"
                fullWidth
                disabled={!codeReady}
                onClick={() => onJoin("player")}
              >
                {(submitting === "player" ? t("join.joinSubmitting") : t("join.joinAsPlayer")).toUpperCase()}
              </Button>
            </Box>
          </Box>
        </PageCanvas>
      </Box>
    </Box>
  );
}
