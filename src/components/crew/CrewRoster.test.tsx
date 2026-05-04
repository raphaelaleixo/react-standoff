import { render, screen } from "@testing-library/react";
import { CrewRoster } from "./CrewRoster";
import type { Game } from "../../game/types";

function makeGame(): Game {
  const players = ["a", "b", "c", "d"].map(id => ({
    id, displayName: id.toUpperCase(), colorOrAvatar: "generic",
    bullets: [], cash: [], wounds: 0 as const, shame: 0,
    status: "alive" as const, effects: [],
  }));
  return {
    seed: "x", players,
    round: { number: 1, phase: "commit", phaseStartedAt: 0, loot: [], commits: {} },
    bankDeck: [], discardedBullets: [], phase: "in_progress",
  };
}

describe("CrewRoster", () => {
  it("renders one row per player in seat order", () => {
    const g = makeGame();
    render(<CrewRoster game={g} />);
    const rows = screen.getAllByText(/^[A-D]$/);
    expect(rows.map(n => n.textContent)).toEqual(["A", "B", "C", "D"]);
  });

  it("derives status=ready for committed players in commit phase", () => {
    const g = makeGame();
    g.round.commits = { a: { bullet: "bang", target: "b" } };
    render(<CrewRoster game={g} />);
    expect(screen.getByText("READY")).toBeInTheDocument();
  });

  it("derives status=choosing for not-yet-committed players in commit phase", () => {
    const g = makeGame();
    render(<CrewRoster game={g} />);
    expect(screen.getAllByText("CHOOSING")).toHaveLength(4);
  });

  it("derives status=aiming for everyone in standoff", () => {
    const g = makeGame();
    g.round.phase = "standoff";
    g.round.commits = Object.fromEntries(
      g.players.map(p => [p.id, { bullet: "bang", target: g.players[0].id }])
    );
    render(<CrewRoster game={g} />);
    expect(screen.getAllByText("AIMING")).toHaveLength(4);
  });
});
