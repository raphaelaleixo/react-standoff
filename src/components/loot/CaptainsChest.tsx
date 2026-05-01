import { Box, Stack, Typography } from "@mui/material";
import { palette } from "../../theme/colors";
import { Coin } from "./Coin";

// Central treasure pile. Visual: a wooden chest lid with coins spilling forward.
// `loot` is the existing banknote array — we keep the prop shape so this is a
// drop-in replacement for the old LootPile.
export function CaptainsChest({ loot, centerX, centerY }: {
  loot: { id: string; value: number }[];
  centerX: number;
  centerY: number;
}) {
  const total = loot.reduce((s, n) => s + n.value, 0);
  return (
    <Box
      sx={{
        position: "absolute",
        left: centerX,
        top: centerY,
        marginLeft: "-90px",
        marginTop: "-70px",
        width: 180,
        height: 140,
        zIndex: 5,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <Box
        sx={{
          width: 160,
          height: 70,
          background: `linear-gradient(180deg, #8b5a2b 0%, #5a371d 100%)`,
          border: `3px solid ${palette.ink}`,
          borderRadius: "12px 12px 4px 4px",
          position: "relative",
          boxShadow: `inset 0 -8px 0 ${palette.ink}, 0 4px 12px rgba(0,0,0,0.4)`,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: 28,
            height: 22,
            bgcolor: palette.gold,
            border: `2px solid ${palette.ink}`,
            borderRadius: "2px",
          }}
        />
      </Box>
      <Stack direction="row" spacing={-1} sx={{ marginTop: "-18px", flexWrap: "wrap", justifyContent: "center", maxWidth: 180 }}>
        {loot.slice(0, 8).map(n => (
          <Coin key={n.id} value={n.value} size={26} />
        ))}
      </Stack>
      <Typography
        variant="h6"
        sx={{
          color: palette.ink,
          marginTop: "6px",
          textShadow: `1px 1px 0 ${palette.gold}`,
        }}
      >
        ${total.toLocaleString()}
      </Typography>
    </Box>
  );
}
