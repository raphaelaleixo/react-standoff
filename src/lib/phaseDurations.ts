// Shared phase-duration constants. Kept here so the standoff count animation
// (GameBoard / StandoffStamp), the production phase-advance timer
// (useGameState), and the mock's Play-round pacing (DevControlsPanel) cannot
// drift apart — they all derive from the same value.

export const STANDOFF_DURATION_MS = 3000;
export const WITHDRAW_DURATION_MS = 10000;
