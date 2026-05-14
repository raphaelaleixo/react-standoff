import { Box } from "@mui/material";
import { keyframes } from "@emotion/react";
import { palette } from "../../theme/colors";
import { durations, popIn } from "../../theme/animations";
import type { ShameMarker } from "../../game/types";

const POP_TIMING = `${durations.base}ms cubic-bezier(.2,.7,.2,1.4) both`;

// Flashing-light shame markers (cop variant, post-reinforcements) get a slow
// red strobe to distinguish them from ordinary yellow shame. The pulse stays
// gentle so a row of mixed markers reads at a glance without strobing.
const shameFlash = keyframes`
  0%, 100% { opacity: 0.65; box-shadow: 0 0 4px rgba(201,58,48,0.5); }
  50%      { opacity: 1;    box-shadow: 0 0 7px rgba(201,58,48,0.95); }
`;

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

// One dot per shame point. `animateNew` triggers the popIn on every
// mounted pip — caller should pass `false` (the default) when rendering a
// static post-game roster, or `true` when rendering the live in-game crew row
// (where existing pips keep their key and only newly-added pips pop in).
//
// Two callsite shapes are supported: pass `count` for plain yellow shame
// (base game), or pass `markers` (ShameMarker[]) for the cop variant — each
// `flashing: true` marker renders as a pulsing red dot instead of yellow.
export function ShamePips({
  count,
  markers,
  animateNew = false,
  size = 8,
}: {
  count?: number;
  markers?: ShameMarker[];
  animateNew?: boolean;
  size?: number;
}) {
  const list: ShameMarker[] =
    markers ?? Array.from({ length: count ?? 0 }, () => ({ flashing: false }));
  if (list.length === 0) return null;
  return (
    <Box sx={{ display: "flex", gap: "2px", alignItems: "center" }}>
      {list.map((m, i) => (
        <Box
          key={i}
          data-pip="shame"
          data-flashing={m.flashing ? "true" : undefined}
          sx={{
            width: size,
            height: size,
            borderRadius: "50%",
            background: m.flashing ? palette.blood : palette.yellow,
            boxShadow: m.flashing
              ? "0 0 5px rgba(201, 58, 48, 0.75)"
              : "0 0 4px rgba(230, 196, 64, 0.55)",
            animation: m.flashing
              ? `${shameFlash} 1100ms ease-in-out infinite`
              : animateNew
                ? `${popIn} ${POP_TIMING}`
                : undefined,
          }}
        />
      ))}
    </Box>
  );
}
