import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Spectator } from "./Spectator";
import type { Game } from "../../game/types";
import "../../i18n";

function makeGame(): Game {
  return {
    seed: "x",
    roomId: "x",
    players: [
      { id: "a", displayName: "Cap'n Maud", colorOrAvatar: "calico_jack", bullets: [], cash: [], wounds: 0, shame: 0, status: "alive", effects: [] },
      { id: "b", displayName: "Mad Mary", colorOrAvatar: "blackbeard", bullets: [], cash: [], wounds: 1, shame: 0, status: "alive", effects: [] },
    ],
    round: { number: 4, phase: "reveal_others", phaseStartedAt: 0, loot: [], commits: {}, activations: {} },
    bankDeck: [],
    discardedBullets: [],
    phase: "in_progress",
    variants: { superPowers: false },
  } as Game;
}

describe("Spectator", () => {
  it("renders the watch-the-big-screen eyebrow + crew roster", () => {
    render(<Spectator game={makeGame()} />);
    expect(screen.getByText(/watch the big screen/i)).toBeInTheDocument();
    expect(screen.getByText("Cap'n Maud")).toBeInTheDocument();
    expect(screen.getByText("Mad Mary")).toBeInTheDocument();
  });

  it("does not render the elimination banner unless eliminated", () => {
    render(<Spectator game={makeGame()} />);
    expect(screen.queryByText(/walked the plank/i)).not.toBeInTheDocument();
  });

  it("renders the elimination banner when eliminated, with the round roman numeral", () => {
    render(<Spectator game={makeGame()} eliminated eliminatedRound={3} />);
    expect(screen.getByText(/YE WALKED THE PLANK/i)).toBeInTheDocument();
    expect(screen.getByText(/round III/i)).toBeInTheDocument();
  });
});
