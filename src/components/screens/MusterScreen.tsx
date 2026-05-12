import { Box } from "@mui/material";
import type { RoomState } from "react-gameroom";
import { useTranslation } from "react-i18next";
import type { Player as GamePlayer } from "../../game/types";
import { palette, flagColor } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { PageCanvas } from "../shell/PageCanvas";
import { Masthead } from "../shell/Masthead";
import { FullscreenButton } from "../shell/FullscreenButton";
import { SectionHeader } from "../shell/SectionHeader";
import { Button } from "../shell/Button";
import { InvertedQR } from "./InvertedQR";
import { FlagFor } from "../flags";
import { jollyRogerForColor } from "../flags/jollyRogerForColor";
import { toRoman } from "../../lib/navyHours";
import { useBigScreenZoom } from "../../hooks/useBigScreenZoom";

interface MusterScreenProps {
  roomState: RoomState<GamePlayer>;
  joinUrl: string;
  canStart: boolean;
  onStart: () => void;
  variantSlot?: React.ReactNode;
}

export function MusterScreen({ roomState, joinUrl, canStart, onStart, variantSlot }: MusterScreenProps) {
  const { t } = useTranslation();
  useBigScreenZoom();
  const claimed = roomState.players.filter(p => p.status !== "empty");
  const empty = roomState.players.filter(p => p.status === "empty");
  const minPlayers = roomState.config.minPlayers;
  const enoughAboard = claimed.length >= minPlayers;

  return (
    <Box sx={{ width: "100vw", height: "100vh" }}>
      <PageCanvas aspectRatio="16 / 9" sx={{ width: "100%", height: "100%" }}>
        <Masthead
          left={<>{t("shell.room")} <em>{roomState.roomId}</em></>}
          right={<FullscreenButton />}
        />

        <Box
          sx={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            minHeight: 0,
          }}
        >
          {/* LEFT: join column */}
          <Box
            sx={{
              padding: "1rem 1.4rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: "0.7rem",
            }}
          >
            <SectionHeader title={t("room.scanToJoin")} subtitle={t("room.scanHint")} />
            <InvertedQR roomId={roomState.roomId} url={joinUrl} size={180} />
            <Box sx={{ fontFamily: fonts.body, fontStyle: "italic", color: palette.paperDim }}>
              {t("room.orPunchIn")}
            </Box>
            <Box
              sx={{
                fontFamily: fonts.displayCaps,
                fontFeatureSettings: '"smcp"',
                fontSize: "4.4rem",
                letterSpacing: "0.36em",
                lineHeight: 1,
                color: palette.paper,
                borderTop: `2px solid ${palette.ruleStrong}`,
                borderBottom: `2px solid ${palette.ruleStrong}`,
                padding: "0.4rem 1rem 0.4rem 1.36rem", // extra right pad for the wide letter-spacing
              }}
            >
              {roomState.roomId}
            </Box>
          </Box>

          {/* RIGHT: crew column */}
          <Box
            sx={{
              padding: "1rem 1.4rem",
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
            }}
          >
            <SectionHeader title={t("room.playersHeading")} subtitle={t("room.playersHint")} />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "0.7rem",
                marginTop: "0.6rem",
                alignContent: "start",
              }}
            >
              {claimed.map(p => {
                const flagId = p.data?.colorOrAvatar ?? "generic";
                return (
                  <CrewCard
                    key={p.id}
                    flagId={flagId}
                    displayName={p.name ?? p.data?.displayName ?? ""}
                  />
                );
              })}
              {empty.map(p => (
                <EmptyCard
                  key={p.id}
                  label={t("room.emptySeat")}
                />
              ))}
            </Box>
            <Box
              sx={{
                display: "flex",
                justifyContent: "flex-start",
                alignItems: "baseline",
                gap: "1.4rem",
                paddingTop: "2rem",
              }}
            >
              <Button
                variant="primary"
                emphasis
                disabled={!canStart}
                onClick={onStart}
                caption={t("room.startGameSub")}
              >
                {t("room.startGame").toUpperCase()}
              </Button>
              <Box
                sx={{
                  fontFamily: fonts.displayCaps,
                  fontFeatureSettings: '"smcp"',
                  fontSize: "1.1rem",
                  letterSpacing: "0.28em",
                  color: palette.paperDim,
                }}
              >
                {t("room.seatsLeft", { n: toRoman(empty.length) })}
                {!enoughAboard && (
                  <Box
                    component="span"
                    sx={{
                      fontFamily: fonts.body,
                      fontStyle: "italic",
                      letterSpacing: "0.04em",
                      color: palette.blood,
                      paddingLeft: "0.5em",
                    }}
                  >
                    {t("room.aboardWaitingCry")}
                  </Box>
                )}
              </Box>
            </Box>
            {variantSlot && (
              <Box sx={{ paddingTop: "1.2rem" }}>{variantSlot}</Box>
            )}
          </Box>
        </Box>
      </PageCanvas>
    </Box>
  );
}

function CrewCard({
  flagId,
  displayName,
}: {
  flagId: string;
  displayName: string;
}) {
  return (
    <Box
      sx={{
        background: palette.inkUp,
        border: `2px solid ${palette.paper}`,
        boxShadow: `3px 3px 0 ${palette.inkDeep}`,
        padding: "1.2rem 0.55rem",
        textAlign: "center",
      }}
    >
      <Box
        sx={{
          width: "5.2rem",
          height: "3.6rem",
          margin: "0 auto",
          background: flagColor(flagId),
          color: palette.paper,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <FlagFor id={jollyRogerForColor(flagId)} size="2.4rem" />
      </Box>
      <Box
        sx={{
          fontFamily: fonts.displayCaps,
          fontSize: "1.2rem",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginTop: "0.5rem",
          color: palette.paper,
        }}
      >
        {displayName || " "}
      </Box>
    </Box>
  );
}

function EmptyCard({ label }: { label: string }) {
  return (
    <Box
      sx={{
        border: `2px dashed ${palette.paperFaint}`,
        padding: "1.2rem 0.55rem",
        textAlign: "center",
      }}
    >
      <Box
        sx={{
          width: "5.2rem",
          height: "3.6rem",
          margin: "0 auto",
        }}
      />
      <Box
        sx={{
          fontFamily: fonts.displayCaps,
          fontSize: "1.2rem",
          fontWeight: 700,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          marginTop: "0.5rem",
          color: palette.paperFaint,
        }}
      >
        {label}
      </Box>
    </Box>
  );
}

