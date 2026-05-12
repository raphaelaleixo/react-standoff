import { Box } from "@mui/material";
import { RoomQRCode } from "react-gameroom";
import { palette } from "../../theme/colors";

interface InvertedQRProps {
  roomId: string;
  url: string;
  size?: number;
}

// Renders the RoomQRCode (black-on-white) inside a paper tile so the modules
// stay in their native dark-on-light orientation — most reliable for phone
// cameras and battery-saver scanner modes.
export function InvertedQR({ roomId, url, size = 180 }: InvertedQRProps) {
  return (
    <Box
      data-inverted-qr
      sx={{
        width: size,
        height: size,
        background: palette.paper,
        padding: "10px",
        boxSizing: "content-box",
        border: `2px solid ${palette.paper}`,
        boxShadow: `6px 6px 0 ${palette.inkDeep}`,
        display: "inline-block",
        lineHeight: 0,
      }}
    >
      <RoomQRCode roomId={roomId} url={url} size={size} />
    </Box>
  );
}
