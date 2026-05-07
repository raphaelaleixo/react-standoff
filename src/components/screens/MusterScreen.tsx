import { Box } from "@mui/material";
import type { RoomState } from "react-gameroom";
import { useTranslation } from "react-i18next";
import type { Player as GamePlayer } from "../../game/types";
import { palette, flagColor } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { PageCanvas } from "../shell/PageCanvas";
import { Masthead } from "../shell/Masthead";
import { Button } from "../shell/Button";
import { InvertedQR } from "./InvertedQR";
import { FlagFor } from "../flags";
import { FLAG_LABELS } from "../../game/playerFlags";
import { toRoman } from "../../lib/navyHours";

interface MusterScreenProps {
  roomState: RoomState<GamePlayer>;
  joinUrl: string;
  canStart: boolean;
  onStart: () => void;
}

export function MusterScreen({ roomState, joinUrl, canStart, onStart }: MusterScreenProps) {
  const { t } = useTranslation();
  const claimed = roomState.players.filter(p => p.status !== "empty");
  const empty = roomState.players.filter(p => p.status === "empty");
  const minPlayers = roomState.config.minPlayers;
  const enoughAboard = claimed.length >= minPlayers;

  return (
    <Box sx={{ width: "100vw", height: "100vh", padding: 2, boxSizing: "border-box" }}>
      <PageCanvas aspectRatio="16 / 9" sx={{ width: "100%", height: "100%" }}>
        <Masthead
          left={t("room.lobbyTitle").toUpperCase()}
          right={t("room.lobbyEyebrow")}
        />

        <Box
          sx={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "38% 1fr",
            borderTop: `4px double ${palette.ruleStrong}`,
            borderBottom: `4px double ${palette.ruleStrong}`,
            minHeight: 0,
          }}
        >
          {/* LEFT: join column */}
          <Box
            sx={{
              borderRight: `1px solid ${palette.ruleStrong}`,
              padding: "1rem 1.4rem",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              gap: "0.7rem",
            }}
          >
            <SectionEyebrow heading={t("room.scanToJoin")} hint={t("room.scanHint")} />
            <InvertedQR roomId={roomState.roomId} url={joinUrl} size={180} />
            <Box sx={{ fontFamily: fonts.body, fontStyle: "italic", color: palette.paperDim }}>
              {t("room.orPunchIn")}
            </Box>
            <Box
              sx={{
                fontFamily: fonts.displayCaps,
                fontFeatureSettings: '"smcp"',
                fontSize: "2.6rem",
                letterSpacing: "0.36em",
                lineHeight: 1,
                color: palette.paper,
                borderTop: `2px solid ${palette.ruleStrong}`,
                borderBottom: `2px solid ${palette.ruleStrong}`,
                padding: "0.4rem 1rem 0.4rem 1.36rem", // extra right pad for the wide letter-spacing
                boxShadow: `4px 4px 0 ${palette.inkDeep}`,
              }}
            >
              {roomState.roomId}
            </Box>
            <Box
              sx={{
                fontFamily: fonts.displayCaps,
                fontFeatureSettings: '"smcp"',
                fontSize: "0.6rem",
                letterSpacing: "0.3em",
                color: palette.paperDim,
              }}
            >
              {t("room.codeUrl")}
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
            <SectionEyebrow heading={t("room.playersHeading")} hint={t("room.playersHint")} />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "0.7rem",
                marginTop: "0.6rem",
                flex: 1,
                alignContent: "start",
              }}
            >
              {claimed.map(p => {
                const flagId = p.data?.colorOrAvatar ?? "generic";
                const pirateName = (FLAG_LABELS as Record<string, string>)[flagId] ?? flagId;
                return (
                  <CrewCard
                    key={p.id}
                    flagId={flagId}
                    pirateName={pirateName}
                    displayName={p.name ?? p.data?.displayName ?? ""}
                  />
                );
              })}
              {empty.map(p => (
                <EmptyCard
                  key={p.id}
                  label={t("room.emptySeat")}
                  hint={t("room.emptySeatHint")}
                />
              ))}
            </Box>
          </Box>
        </Box>

        {/* Foot row — start button at center, aboard / seats counts on the flanks. */}
        <Box
          sx={{
            padding: "0.7rem 1.5rem 0.8rem",
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            gap: "1rem",
          }}
        >
          <CountChip
            line1={t("room.aboard", { n: toRoman(claimed.length) })}
            cry={enoughAboard ? t("room.aboardEnoughCry") : t("room.aboardWaitingCry")}
            cryColor={palette.blood}
            line1Color={enoughAboard ? palette.paper : palette.paperDim}
            align="left"
          />
          <Button
            variant="primary"
            emphasis
            disabled={!canStart}
            onClick={onStart}
            caption={t("room.startGameSub")}
          >
            {t("room.startGame").toUpperCase()}
          </Button>
          <CountChip
            line1={t("room.seatsLeft", { n: toRoman(empty.length) })}
            cry={t("room.seatsCap")}
            cryColor={palette.paperDim}
            line1Color={palette.paperDim}
            align="right"
          />
        </Box>
      </PageCanvas>
    </Box>
  );
}

function SectionEyebrow({ heading, hint }: { heading: string; hint: string }) {
  return (
    <Box
      sx={{
        textAlign: "center",
        fontFamily: fonts.displayCaps,
        fontFeatureSettings: '"smcp"',
        fontSize: "0.75rem",
        letterSpacing: "0.4em",
        color: palette.paperDim,
      }}
    >
      {heading.toUpperCase()}
      <Box
        sx={{
          fontFamily: fonts.body,
          fontStyle: "italic",
          fontSize: "0.85rem",
          letterSpacing: "0.04em",
          color: palette.paper,
          marginTop: "0.15rem",
        }}
      >
        {hint}
      </Box>
    </Box>
  );
}

function CrewCard({
  flagId,
  pirateName,
  displayName,
}: {
  flagId: string;
  pirateName: string;
  displayName: string;
}) {
  return (
    <Box
      sx={{
        background: palette.inkUp,
        border: `2px solid ${palette.paper}`,
        boxShadow: `3px 3px 0 ${palette.inkDeep}`,
        padding: "0.55rem",
        textAlign: "center",
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          margin: "0 auto",
          border: `2px solid ${palette.paper}`,
          background: flagColor(flagId),
          color: palette.paper,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <FlagFor id={flagId} size={40} />
      </Box>
      <Box
        sx={{
          fontFamily: fonts.displayCaps,
          fontFeatureSettings: '"smcp"',
          fontSize: "0.78rem",
          letterSpacing: "0.16em",
          marginTop: "0.45rem",
          color: palette.paper,
        }}
      >
        {pirateName.toUpperCase()}
      </Box>
      <Box
        sx={{
          fontFamily: fonts.body,
          fontStyle: "italic",
          fontSize: "0.7rem",
          color: palette.paperDim,
          marginTop: "0.1rem",
        }}
      >
        {displayName ? `— ${displayName} —` : " "}
      </Box>
    </Box>
  );
}

function EmptyCard({ label, hint }: { label: string; hint: string }) {
  return (
    <Box
      sx={{
        border: `2px dashed ${palette.paperFaint}`,
        padding: "0.55rem",
        textAlign: "center",
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          margin: "0 auto",
          border: `2px dashed ${palette.paperFaint}`,
          color: palette.paperFaint,
        }}
      />
      <Box
        sx={{
          fontFamily: fonts.displayCaps,
          fontFeatureSettings: '"smcp"',
          fontSize: "0.78rem",
          letterSpacing: "0.16em",
          marginTop: "0.45rem",
          color: palette.paperFaint,
        }}
      >
        {label}
      </Box>
      <Box
        sx={{
          fontFamily: fonts.body,
          fontStyle: "italic",
          fontSize: "0.7rem",
          color: palette.paperFaint,
          marginTop: "0.1rem",
        }}
      >
        {hint}
      </Box>
    </Box>
  );
}

function CountChip({
  line1,
  cry,
  cryColor,
  line1Color,
  align,
}: {
  line1: string;
  cry: string;
  cryColor: string;
  line1Color: string;
  align: "left" | "right";
}) {
  return (
    <Box
      sx={{
        fontFamily: fonts.displayCaps,
        fontFeatureSettings: '"smcp"',
        fontSize: "0.85rem",
        letterSpacing: "0.32em",
        color: line1Color,
        textAlign: align,
      }}
    >
      {line1}
      <Box
        component="span"
        sx={{
          fontFamily: fonts.body,
          fontStyle: "italic",
          letterSpacing: "0.04em",
          color: cryColor,
          paddingLeft: "0.5em",
        }}
      >
        {cry}
      </Box>
    </Box>
  );
}
