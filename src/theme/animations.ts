import { keyframes } from "@emotion/react";

// Single source of truth for the big-screen animation primitives. Components
// import `durations` for transition / animation timings and the named
// keyframes below for entrance + emphasis effects.

export const durations = {
  fast: 150,
  base: 300,
  // 350ms keeps the line draw-in snappy without losing the source→target
  // sweep. Fire-fill (TargetingMap, FIRE_FILL_DURATION = 0.55s) is
  // intentionally separate — it kicks in later for a different beat.
  draw: 350,
  slow: 700,
};

export const fadeIn = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

export const popIn = keyframes`
  0%   { opacity: 0; transform: scale(0.6); }
  60%  { opacity: 1; transform: scale(1.15); }
  100% { transform: scale(1); }
`;

// Drop-in: a banknote being thrown onto the table — starts oversized and
// settles into place with a subtle bounce.
export const dropIn = keyframes`
  0%   { opacity: 0; transform: scale(1.6); }
  55%  { opacity: 1; transform: scale(0.94); }
  100% { opacity: 1; transform: scale(1); }
`;

// Preserves the StandoffStamp's translateY(-0.18em) baseline correction
// (UnifrakturCook digits sit low in the em-box) so the zoom doesn't undo
// the centering nudge.
export const numberPulse = keyframes`
  0%   { transform: translateY(-0.18em) scale(0.6);  opacity: 0; }
  50%  { transform: translateY(-0.18em) scale(1.18); opacity: 1; }
  100% { transform: translateY(-0.18em) scale(1);    opacity: 1; }
`;

export const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.3); }
`;

// Slow opacity breath — for idle/waiting copy. Soft sine-like fade in and
// out so the line keeps the eye without strobing.
export const breath = keyframes`
  0%, 100% { opacity: 0.4; }
  50%      { opacity: 1; }
`;

// Blood-splash entrance: starts undersized and slightly rotated, overshoots
// to suggest impact, then settles. Used by the struck-roundel halo.
export const bloodSplash = keyframes`
  0%   { opacity: 0; transform: scale(0.35) rotate(-18deg); }
  55%  { opacity: 1; transform: scale(1.15) rotate(3deg); }
  100% { opacity: 1; transform: scale(1) rotate(0deg); }
`;

// Slide-up: a row sliding into a ledger from below as it's announced. Paired
// with `animation-fill-mode: both` so the element holds the "from" state
// (invisible, off-screen) during the stagger delay before its turn comes up.
export const slideUpIn = keyframes`
  0%   { opacity: 0; transform: translateY(18px); }
  100% { opacity: 1; transform: translateY(0); }
`;
