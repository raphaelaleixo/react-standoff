import { keyframes } from "@emotion/react";

// Single source of truth for the big-screen animation primitives. Components
// import `durations` for transition / animation timings and the named
// keyframes below for entrance + emphasis effects.

export const durations = {
  fast: 150,
  base: 300,
  // 550ms matches the existing FIRE_FILL_DURATION inside TargetingMap so the
  // line "draw-in" effect uses the same cadence as the fire-fill that
  // follows it.
  draw: 550,
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
