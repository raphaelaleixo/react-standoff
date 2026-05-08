import { useEffect, useLayoutEffect, useRef } from "react";
import { Box } from "@mui/material";
import { palette, flagColor } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { FlagFor, jollyRogerForColor } from "../flags";
import { WoundPips, ShamePips } from "../marks/PlayerMarks";
import { cashTotal } from "../../lib/score";
import type { Player } from "../../game/types";

interface TargetListProps {
  opponents: Player[];
  selectedId?: string | null;
  onPick?: (id: string) => void;
}

const SIZE = 240;
const ARROW_BUTTON = 36;

// Commit-phase target picker. The flintlock barrel is the viewport: opponents'
// jolly rogers slide horizontally inside the disc, the crosshair lines stay
// fixed, and whichever flag is centred under them is the picked mark. Left/
// right chevrons flank the disc for tap-to-step navigation; swiping inside the
// disc itself works on touch devices too. Sweeping the sights across the line
// maps the metaphor cleanly — you're aiming, not picking from a list.
export function TargetList({ opponents, selectedId, onPick }: TargetListProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const programmaticRef = useRef(false);
  const initialMountRef = useRef(true);

  const selectedIdx = selectedId
    ? Math.max(0, opponents.findIndex(o => o.id === selectedId))
    : 0;
  const selected = opponents[selectedIdx] ?? null;

  // Keep the parent's selection in sync with what the disc is actually
  // showing. If selectedId is null (initial mount) or stale (e.g. a mock
  // SEAT swap changed opponents and the previous pick is no longer in the
  // list), fire onPick with the centred opponent so the parent's commit-
  // button-enabled state matches the visual.
  useEffect(() => {
    if (!opponents.length) return;
    const hit = selectedId && opponents.some(o => o.id === selectedId);
    if (!hit) onPick?.(opponents[selectedIdx]?.id ?? opponents[0].id);
  }, [opponents, selectedId, selectedIdx, onPick]);

  // Sync the scroll position to the selected opponent. First mount is
  // instant so the picker shows up already centred; subsequent changes
  // (arrow clicks, parent-driven resets) animate so the sweep reads as a
  // movement of the sights across the line.
  useLayoutEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const cell = el.children[selectedIdx] as HTMLElement | undefined;
    if (!cell) return;
    const left = cell.offsetLeft - (el.clientWidth - cell.clientWidth) / 2;
    programmaticRef.current = true;
    if (initialMountRef.current || typeof el.scrollTo !== "function") {
      el.scrollLeft = left;
    } else {
      el.scrollTo({ left, behavior: "smooth" });
    }
    initialMountRef.current = false;
    // Clear the programmatic flag on the next frame for instant scrolls;
    // a longer settle for smooth scrolls so mid-animation scroll events
    // don't get treated as user input and echo selection back.
    const timeout = setTimeout(() => {
      programmaticRef.current = false;
    }, 350);
    return () => clearTimeout(timeout);
  }, [selectedIdx]);

  // On user scroll (touch swipe), find the cell closest to the viewport
  // centre and call onPick with its opponent id. Skipped during programmatic
  // scrolls to prevent feedback loops with the layout effect above.
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const handle = () => {
      if (programmaticRef.current) return;
      const centre = el.scrollLeft + el.clientWidth / 2;
      let closest = 0;
      let closestDist = Infinity;
      for (let i = 0; i < el.children.length; i++) {
        const cell = el.children[i] as HTMLElement;
        const cellCentre = cell.offsetLeft + cell.offsetWidth / 2;
        const dist = Math.abs(cellCentre - centre);
        if (dist < closestDist) {
          closestDist = dist;
          closest = i;
        }
      }
      const next = opponents[closest]?.id;
      if (next && next !== selectedId) onPick?.(next);
    };
    el.addEventListener("scroll", handle, { passive: true });
    return () => el.removeEventListener("scroll", handle);
  }, [opponents, selectedId, onPick]);

  const goTo = (delta: -1 | 1) => {
    const next = selectedIdx + delta;
    if (next < 0 || next >= opponents.length) return;
    const id = opponents[next]?.id;
    if (id) onPick?.(id);
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "0.45rem",
        padding: "0.4rem 0.5rem 1.4rem",
      }}
    >
      {/* Disc + flanking arrows. The arrows sit on the crosshair's horizontal
          line so they read as continuations of it, like sights extending out
          past the barrel. */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}
      >
        <ArrowButton
          dir="left"
          disabled={selectedIdx <= 0}
          onClick={() => goTo(-1)}
        />

        {/* Barrel viewport — paper disc, ink rim, crosshair lines. The flag
            strip scrolls inside; the crosshair sits on top, pointer-events:
            none so it doesn't intercept the swipe. */}
        <Box
          sx={{
            position: "relative",
            width: SIZE,
            height: SIZE,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${palette.paper} 0%, ${palette.paper} 55%, ${palette.ink} 60%, ${palette.ink} 100%)`,
            boxShadow: `inset 0 0 ${Math.round(SIZE * 0.14)}px rgba(90,55,29,0.6)`,
            overflow: "hidden",
            touchAction: "pan-x",
            flex: "0 0 auto",
          }}
        >
          <Box
            ref={trackRef}
            sx={{
              display: "flex",
              width: "100%",
              height: "100%",
              overflowX: "auto",
              overflowY: "hidden",
              scrollSnapType: "x mandatory",
              scrollBehavior: "smooth",
              "&::-webkit-scrollbar": { display: "none" },
              scrollbarWidth: "none",
              // Mask the strip to the inner cream circle of the disc. The
              // radial-gradient defaults to `circle farthest-corner`, so its
              // 55% stop maps to 0.55 × diagonal/2 of the box (~SIZE × 0.389
              // for a square) — that's where paper transitions to ink, and
              // that's the visible cream circle's radius. Explicit pixels
              // because clip-path's `circle(<%>)` uses a different reference
              // (sqrt(w² + h²) / sqrt(2)) and would extend past the disc.
              clipPath: `circle(${SIZE * 0.389}px at 50% 50%)`,
              WebkitClipPath: `circle(${SIZE * 0.389}px at 50% 50%)`,
            }}
          >
            {opponents.map(o => (
              <Box
                key={o.id}
                data-target-id={o.id}
                sx={{
                  flex: "0 0 100%",
                  height: "100%",
                  scrollSnapAlign: "center",
                  scrollSnapStop: "always",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: flagColor(o.colorOrAvatar),
                }}
              >
                <FlagFor id={jollyRogerForColor(o.colorOrAvatar)} size={Math.round(SIZE * 0.55)} />
              </Box>
            ))}
          </Box>
          {/* Crosshair lines pinned to the disc's centre. */}
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              top: "50%",
              left: "8%",
              right: "8%",
              height: 1.5,
              bgcolor: palette.blood,
              opacity: 0.55,
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          />
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              left: "50%",
              top: "8%",
              bottom: "8%",
              width: 1.5,
              bgcolor: palette.blood,
              opacity: 0.55,
              transform: "translateX(-50%)",
              pointerEvents: "none",
            }}
          />
        </Box>

        <ArrowButton
          dir="right"
          disabled={selectedIdx >= opponents.length - 1}
          onClick={() => goTo(1)}
        />
      </Box>

      {/* Centred opponent's stat row — name | wounds | cash | shame as
          separated columns on a single line with thin paper-rule dividers
          between them. Lets the player size up the mark at a glance:
          fewer wounds means a single shot won't kill, more wounds means
          they're one bullet from the plank. */}
      {selected ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.6rem",
            marginTop: "0.1rem",
          }}
        >
          <Box
            sx={{
              fontFamily: fonts.displayCaps,
              fontFeatureSettings: '"smcp"',
              fontSize: "1rem",
              letterSpacing: "0.14em",
              color: palette.paper,
            }}
          >
            {selected.displayName}
          </Box>
          <ColumnRule />
          <WoundPips count={selected.wounds} size={11} />
          <ColumnRule />
          <Box
            sx={{
              fontFamily: fonts.blackletter,
              fontWeight: 700,
              fontSize: "1.1rem",
              lineHeight: 1,
              color: palette.paper,
            }}
          >
            ${cashTotal(selected).toLocaleString()}
          </Box>
          {selected.shame > 0 ? (
            <>
              <ColumnRule />
              <ShamePips count={selected.shame} size={9} />
            </>
          ) : null}
        </Box>
      ) : null}
    </Box>
  );
}

function ArrowButton({
  dir,
  disabled,
  onClick,
}: {
  dir: "left" | "right";
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Box
      role="button"
      tabIndex={disabled ? -1 : 0}
      data-target-arrow={dir}
      data-disabled={disabled ? "true" : "false"}
      aria-disabled={disabled}
      onClick={disabled ? undefined : onClick}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (disabled) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      sx={{
        width: ARROW_BUTTON,
        height: ARROW_BUTTON,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: palette.blood,
        opacity: disabled ? 0.25 : 0.85,
        cursor: disabled ? "default" : "pointer",
        transition: "opacity 0.12s ease, transform 0.08s ease",
        "&:hover": disabled ? undefined : { opacity: 1 },
        "&:active": disabled ? undefined : { transform: "scale(0.92)" },
        "&:focus-visible": {
          outline: `2px solid ${palette.blood}`,
          outlineOffset: "2px",
        },
      }}
    >
      <Box
        component="svg"
        viewBox="0 0 16 16"
        width={20}
        height={20}
        aria-hidden="true"
        sx={{ display: "block" }}
      >
        <path
          d={dir === "left" ? "M11 2 L5 8 L11 14" : "M5 2 L11 8 L5 14"}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Box>
    </Box>
  );
}

// Thin vertical rule between stat columns (name | wounds | cash | shame).
// Same paper-rule treatment used elsewhere for hairline separators in the
// broadside language.
function ColumnRule() {
  return (
    <Box
      aria-hidden
      sx={{
        width: "1px",
        height: "1.1rem",
        background: palette.rule,
        flexShrink: 0,
      }}
    />
  );
}
