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
    round: { number: 1, phase: "commit", phaseStartedAt: 0, loot: [], commits: {}, activations: {} },
    bankDeck: [], discardedBullets: [], phase: "in_progress",
    variants: { superPowers: false },
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

  it("hides the status pill in standoff (everyone is uniformly aiming)", () => {
    const g = makeGame();
    g.round.phase = "standoff";
    g.round.commits = Object.fromEntries(
      g.players.map(p => [p.id, { bullet: "bang", target: g.players[0].id }])
    );
    render(<CrewRoster game={g} />);
    expect(screen.queryByText("AIMING")).toBeNull();
  });

  it("hides yields during the withdraw countdown so the decision stays private", () => {
    const g = makeGame();
    g.round.phase = "withdraw";
    g.round.commits = { a: { bullet: "bang", target: "b", withdrew: true } };
    render(<CrewRoster game={g} />);
    expect(screen.queryByText("YIELDED")).toBeNull();
    expect(screen.queryByText("AIMING")).toBeNull();
  });

  it("shows YIELDED for withdrawn players in reveal_withdraw and no pill for the rest", () => {
    const g = makeGame();
    g.round.phase = "reveal_withdraw";
    g.round.commits = {
      a: { bullet: "bang", target: "b", withdrew: true },
      b: { bullet: "bang", target: "c" },
    };
    render(<CrewRoster game={g} />);
    expect(screen.getByText("YIELDED")).toBeInTheDocument();
    expect(screen.queryByText("AIMING")).toBeNull();
  });

  it("derives status=struck for freshlyStruck players in reveal_bbb", () => {
    const g = makeGame();
    g.round.phase = "reveal_bbb";
    g.round.commits = { a: { bullet: "bang", target: "b" } };
    render(<CrewRoster game={g} freshlyStruck={new Set(["a"])} />);
    expect(screen.getByText("STRUCK")).toBeInTheDocument();
  });

  it("derives status=dead for dead players regardless of round phase", () => {
    const g = makeGame();
    g.round.phase = "standoff";
    g.players[0].status = "dead";
    render(<CrewRoster game={g} />);
    expect(screen.getByText("DEAD")).toBeInTheDocument();
  });

  it("in split phase: yielded shows YIELDED, struck shows STRUCK, standing shows no pill", () => {
    const g = makeGame();
    g.round.phase = "split";
    g.round.commits = {
      a: { bullet: "bang", target: "b", withdrew: true }, // yielded
      b: { bullet: "bang", target: "c" },                 // bang shooter, hits c → c struck
      c: { bullet: "clic", target: "d" },                 // c is struck (target of b)
      d: { bullet: "clic", target: "a" },                 // standing, no pill
    };
    render(<CrewRoster game={g} />);
    expect(screen.getByText("YIELDED")).toBeInTheDocument();
    expect(screen.getByText("STRUCK")).toBeInTheDocument();
    expect(screen.queryByText("OUT")).toBeNull();
  });
});
