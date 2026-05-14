import { Box } from "@mui/material";
import { palette } from "../../../theme/colors";

interface Props {
  size?: number;
}

// Small cream-paper coin showing a stylized crown — same shape and
// styling family as the super-powers PowerBadge so the Privateer's
// mark reads as a peer-level "I'm someone special" pip. Used on the
// reckoning to mark the Privateer wherever they appear.
export function Crown({ size = 28 }: Props) {
  const inner = size * 0.62;
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: "50%",
        bgcolor: palette.paper,
        color: palette.ink,
        border: `1.5px solid ${palette.inkDeep}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: `1px 1px 0 ${palette.inkDeep}`,
        flexShrink: 0,
      }}
    >
      <Box sx={{ width: inner, height: inner, lineHeight: 0 }}>
        <svg viewBox="0 0 24 24" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          {/* Crown body — five-peak silhouette in ink */}
          <path
            d="M 3 19 L 3 9 L 7 13 L 12 5 L 17 13 L 21 9 L 21 19 Z"
            fill={palette.ink}
            stroke={palette.ink}
            strokeWidth={0.5}
            strokeLinejoin="round"
          />
          {/* Headband line cut out in paper for definition */}
          <line
            x1={4}
            y1={17}
            x2={20}
            y2={17}
            stroke={palette.paper}
            strokeWidth={0.9}
          />
          {/* Jewels in royal gold */}
          <circle cx={7} cy={11.5} r={1.2} fill={palette.gold} />
          <circle cx={12} cy={3.7} r={1.5} fill={palette.gold} />
          <circle cx={17} cy={11.5} r={1.2} fill={palette.gold} />
        </svg>
      </Box>
    </Box>
  );
}
