// Shared phase-duration constants. Kept here so the standoff count animation
// (GameBoard / StandoffStamp) and the production phase-advance timer
// (useGameState) cannot drift apart — they both derive from the same value.

export const STANDOFF_DURATION_MS = 3000;
// Silent beat after the standoff count finishes ("STAND.") and before the
// yield countdown begins, so the two stamps don't crowd each other.
export const STANDOFF_HOLD_MS = 2000;
export const WITHDRAW_DURATION_MS = 10000;
