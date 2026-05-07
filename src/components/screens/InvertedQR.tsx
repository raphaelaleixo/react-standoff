import { Box } from "@mui/material";
import { RoomQRCode } from "react-gameroom";
import { palette } from "../../theme/colors";

interface InvertedQRProps {
  roomId: string;
  url: string;
  size?: number;
}

// RoomQRCode draws black-on-white. We invert via a CSS filter on the wrapper
// so we don't have to fork its render output. Phones decode this fine — it's
// still a strict luminance contrast, just with the modules drawn in cream
// over an ink frame.
export function InvertedQR({ roomId, url, size = 180 }: InvertedQRProps) {
  return (
    <Box
      data-inverted-qr
      sx={{
        width: size,
        height: size,
        background: palette.ink,
        padding: "10px",
        boxSizing: "content-box",
        border: `2px solid ${palette.paper}`,
        boxShadow: `0 0 0 4px ${palette.ink}, 6px 6px 0 ${palette.inkDeep}`,
        filter: "invert(1) hue-rotate(180deg)",
        display: "inline-block",
        lineHeight: 0,
      }}
    >
      <RoomQRCode roomId={roomId} url={url} size={size} />
    </Box>
  );
}
