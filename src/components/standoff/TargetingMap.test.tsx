import { render, screen } from "@testing-library/react";
import { TargetingMap } from "./TargetingMap";
import type { Game } from "../../game/types";

function makeGame(overrides?: Partial<Game>): Game {
  const base: Game = {
    seed: "x",
    players: ["a", "b", "c", "d", "e", "f"].map(id => ({
      id, displayName: id.toUpperCase(), colorOrAvatar: "generic",
      bullets: [], cash: [], wounds: 0, shame: 0, status: "alive", effects: [],
    })),
    round: {
      number: 1,
      phase: "standoff",
      phaseStartedAt: 0,
      loot: [], commits: {},
    },
    bankDeck: [], discardedBullets: [], phase: "in_progress",
  };
  return { ...base, ...overrides };
}

describe("TargetingMap", () => {
  it("renders one Roundel per player", () => {
    const g = makeGame();
    render(<TargetingMap game={g} />);
    expect(screen.getAllByText(/^[A-F]$/)).toHaveLength(6);
  });

  it("does not draw any targeting lines during commit phase", () => {
    const g = makeGame({ round: { ...makeGame().round, phase: "commit" }});
    const { container } = render(<TargetingMap game={g} />);
    expect(container.querySelectorAll("svg line")).toHaveLength(0);
  });

  it("draws a forward line during withdraw when a player has a target locked", () => {
    const g = makeGame();
    g.round = { ...g.round, phase: "withdraw", commits: { a: { bullet: "bang", target: "b" } } };
    const { container } = render(<TargetingMap game={g} />);
    expect(container.querySelectorAll("svg line").length).toBeGreaterThanOrEqual(1);
  });
});
