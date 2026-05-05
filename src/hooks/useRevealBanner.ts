import type { Game } from "../game/types";

export type RevealBannerState =
  | { kind: "broadside"; struckCount: number }
  | { kind: "kill"; name: string }
  | null;

export function useRevealBanner(game: Game | null | undefined): RevealBannerState {
  if (!game) return null;
  const phase = game.round.phase;
  const res = game.round.resolution;
  if (!res) return null;

  // A kill is the louder beat — it eclipses the broadside subline during phases 4 and 5.
  if ((phase === "reveal_bbb" || phase === "reveal_others") && res.eliminated.length > 0) {
    const killedId = res.eliminated[0];
    const killed = game.players.find(p => p.id === killedId);
    return killed ? { kind: "kill", name: killed.displayName } : null;
  }

  if (phase === "reveal_bbb") {
    const bbbHits = res.shots.filter(s => s.card === "bang_bang_bang" && s.outcome === "hit").length;
    if (bbbHits === 0) return null;
    return { kind: "broadside", struckCount: bbbHits };
  }

  return null;
}
