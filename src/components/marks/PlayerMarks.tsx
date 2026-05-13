import { Box } from "@mui/material";
import { palette } from "../../theme/colors";
import { durations, popIn } from "../../theme/animations";

const POP_TIMING = `${durations.base}ms cubic-bezier(.2,.7,.2,1.4) both`;

// Wound boxes — filled boxes show a red cross, empty boxes show a small
// circle outline. Lifted out of CrewRow so the Reckoning screen and any other
// consumer can render the same pip language.
//
// `slots` controls how many wound boxes are rendered. Defaults to 3 (the
// normal death threshold); Ironhide holders bump this to 4 when their save
// is in flight so the extra circle is visible immediately on reveal.
//
// `freshIndex`: when set, that pip pops in on mount with a slightly stronger
// drop-shadow. Used for the just-applied wound during the BBB / Shots reveal.
export function WoundPips({
  count,
  freshIndex,
  size = 12,
  slots = 3,
}: {
  count: number;
  freshIndex?: number;
  size?: number;
  slots?: number;
}) {
  return (
    <Box sx={{ display: "flex", gap: "3px" }}>
      {Array.from({ length: slots }, (_, i) => i).map(i => {
        const filled = i < count;
        const fresh = filled && freshIndex === i;
        return (
          <Box
            key={i}
            data-pip={filled ? "filled" : "empty"}
            sx={{
              width: size,
              height: size,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: fresh ? `${popIn} ${POP_TIMING}` : undefined,
            }}
          >
            {filled ? (
              <svg
                width={size}
                height={size}
                viewBox="0 0 10 10"
                style={{
                  filter: fresh
                    ? "drop-shadow(0 0 2px rgba(201,58,48,0.85))"
                    : "drop-shadow(0 0 1.5px rgba(201,58,48,0.55))",
                }}
              >
                <line x1="2" y1="2" x2="8" y2="8" stroke={palette.blood} strokeWidth="2.2" strokeLinecap="round" />
                <line x1="8" y1="2" x2="2" y2="8" stroke={palette.blood} strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            ) : (
              <Box sx={{ width: size * 0.66, height: size * 0.66, borderRadius: "50%", border: `1px solid ${palette.paper}`, opacity: 0.55 }} />
            )}
          </Box>
        );
      })}
    </Box>
  );
}

// One yellow dot per shame point. `animateNew` triggers the popIn on every
// mounted pip — caller should pass `false` (the default) when rendering a
// static post-game roster, or `true` when rendering the live in-game crew row
// (where existing pips keep their key and only newly-added pips pop in).
export function ShamePips({ count, animateNew = false, size = 8 }: { count: number; animateNew?: boolean; size?: number }) {
  if (count === 0) return null;
  return (
    <Box sx={{ display: "flex", gap: "2px", alignItems: "center" }}>
      {Array.from({ length: count }).map((_, i) => (
        <Box
          key={i}
          data-pip="shame"
          sx={{
            width: size,
            height: size,
            borderRadius: "50%",
            background: palette.yellow,
            boxShadow: "0 0 4px rgba(230, 196, 64, 0.55)",
            animation: animateNew ? `${popIn} ${POP_TIMING}` : undefined,
          }}
        />
      ))}
    </Box>
  );
}
