import { useEffect, useRef } from "react";
import { Box } from "@mui/material";
import { palette, flagColor } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { FlagFor, jollyRogerForColor } from "../flags";
import { cashTotal } from "../../lib/score";
import type { Player } from "../../game/types";

interface TargetListProps {
  opponents: Player[];
  selectedId?: string | null;
  onPick?: (id: string) => void;
}

// Horizontal snap-scroller for the commit phase's target picker. The cell
// snapped at the container's centre is the aim target — visually emphasised
// (lifted, blood border, paper-on-ink invert) — and dragging the strip with a
// thumb feels like dialling in a sights line. Tap a peripheral cell to jump
// straight to it.
//
// Public contract is unchanged from the previous vertical list:
// `data-target-id` + `data-selected` attributes, `onPick(id)` callback.
export function TargetList({ opponents, selectedId, onPick }: TargetListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // We programmatically scroll to selectedId on change. While that scroll is
  // animating, the scroll-handler below would otherwise compute the (changing)
  // centred cell and call onPick again — feedback loop. The flag suppresses
  // onPick during programmatic scrolls.
  const programmaticRef = useRef(false);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // After the user stops scrolling, find the cell whose centre is closest to
  // the container's centre and pick it. Native `scrollend` is patchy across
  // browsers, so we debounce a regular scroll listener instead.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onScroll = () => {
      if (programmaticRef.current) return;
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
      settleTimerRef.current = setTimeout(() => {
        const containerCentre = container.scrollLeft + container.clientWidth / 2;
        let nearestId: string | null = null;
        let nearestDist = Infinity;
        container.querySelectorAll<HTMLElement>("[data-target-id]").forEach(cell => {
          const cellCentre = cell.offsetLeft + cell.offsetWidth / 2;
          const dist = Math.abs(containerCentre - cellCentre);
          if (dist < nearestDist) {
            nearestDist = dist;
            nearestId = cell.dataset.targetId ?? null;
          }
        });
        if (nearestId && nearestId !== selectedId) onPick?.(nearestId);
      }, 90);
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", onScroll);
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    };
  }, [selectedId, onPick]);

  // Smooth-scroll the selected cell into the centre when selectedId changes
  // externally (e.g. on tap of a peripheral cell, or initial mount once the
  // parent commits to a target).
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !selectedId) return;
    const cell = container.querySelector<HTMLElement>(`[data-target-id="${selectedId}"]`);
    if (!cell) return;
    // JSDOM (test env) doesn't implement scrollIntoView, so guard for it.
    if (typeof cell.scrollIntoView !== "function") return;
    programmaticRef.current = true;
    cell.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    // Release the suppress-flag once the smooth scroll has had time to land.
    const t = setTimeout(() => { programmaticRef.current = false; }, 400);
    return () => clearTimeout(t);
  }, [selectedId]);

  return (
    <Box sx={{ position: "relative", display: "flex", alignItems: "center", flex: 1, minHeight: 0 }}>
      <Box
        ref={containerRef}
        sx={{
          flex: 1,
          overflowX: "auto",
          overflowY: "hidden",
          scrollSnapType: "x mandatory",
          display: "flex",
          gap: "0.6rem",
          // 30% inline padding lets the first / last cells reach the centre
          // by scrolling, instead of bumping against the container edge.
          padding: "0.5rem 30%",
          scrollPaddingInline: "30%",
          // Hide the scrollbar — the cells are large enough that the scroll
          // affordance is communicated by the peripheral peek.
          "&::-webkit-scrollbar": { display: "none" },
          scrollbarWidth: "none",
        }}
      >
        {opponents.map(o => {
          const isSel = selectedId === o.id;
          const cash = cashTotal(o);
          return (
            <Box
              key={o.id}
              role="button"
              tabIndex={0}
              data-target-id={o.id}
              data-selected={isSel ? "true" : "false"}
              onClick={() => onPick?.(o.id)}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onPick?.(o.id);
                }
              }}
              sx={{
                flex: "0 0 40%",
                scrollSnapAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.7rem 0.5rem 0.6rem",
                background: isSel ? palette.paper : palette.inkUp,
                color: isSel ? palette.ink : palette.paper,
                border: `2px solid ${isSel ? palette.blood : palette.paper}`,
                boxShadow: isSel
                  ? `4px 4px 0 ${palette.blood}`
                  : `2px 2px 0 ${palette.inkDeep}`,
                opacity: isSel ? 1 : 0.85,
                transform: isSel ? "translateY(-3px)" : "none",
                transition: "transform 0.15s ease, opacity 0.15s ease, box-shadow 0.15s ease",
                cursor: "pointer",
                "&:focus-visible": {
                  outline: `2px solid ${palette.blood}`,
                  outlineOffset: "2px",
                },
              }}
            >
              <Box
                sx={{
                  width: 84,
                  height: 56,
                  border: `2px solid ${isSel ? palette.ink : palette.paper}`,
                  background: flagColor(o.colorOrAvatar),
                  color: palette.paper,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FlagFor id={jollyRogerForColor(o.colorOrAvatar)} size={42} />
              </Box>
              <Box
                sx={{
                  fontFamily: fonts.displayCaps,
                  fontFeatureSettings: '"smcp"',
                  fontSize: "0.85rem",
                  letterSpacing: "0.16em",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                  maxWidth: "100%",
                }}
              >
                {o.displayName}
              </Box>
              <Box
                sx={{
                  fontFamily: fonts.blackletter,
                  fontWeight: 700,
                  fontSize: "1rem",
                  lineHeight: 1,
                  color: isSel ? palette.ink : (cash > 0 ? palette.paper : palette.paperDim),
                }}
              >
                ${cash.toLocaleString()}
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Crosshair gutters — thin blood lines pinned to the container's
          horizontal centre so the user can see exactly where the snap line
          lives even before any cell is selected. */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: "50%",
          width: 0,
          borderLeft: `1px dashed ${palette.blood}`,
          opacity: 0.35,
          pointerEvents: "none",
        }}
      />
    </Box>
  );
}
