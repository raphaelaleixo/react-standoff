import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { EndGameRow } from "./EndGameRow";
import type { Player } from "../../game/types";
import "../../i18n";

const ALIVE: Player = {
  id: "a",
  displayName: "Mad Mary",
  colorOrAvatar: "blackbeard",
  bullets: [],
  cash: [
    { id: "n1", value: 20000 },
    { id: "n2", value: 20000 },
    { id: "n3", value: 10000 },
  ],
  wounds: 0,
  shame: 1,
  status: "alive",
  effects: [],
};

const DEAD: Player = {
  ...ALIVE,
  id: "b",
  displayName: "Wet Match",
  colorOrAvatar: "edward_low",
  cash: [],
  status: "dead",
};

describe("EndGameRow", () => {
  it("renders rank, display name, and final score for an alive player", () => {
    render(<EndGameRow rank={2} player={ALIVE} eliminatedRound={null} />);
    expect(screen.getByText("II")).toBeInTheDocument();
    expect(screen.getByText("Mad Mary")).toBeInTheDocument();
    // 50,000 - 5,000 shame = 45,000
    expect(screen.getByText("$45,000")).toBeInTheDocument();
  });

  it("shows the shame breakdown chip", () => {
    render(<EndGameRow rank={2} player={ALIVE} eliminatedRound={null} />);
    expect(screen.getByText(/− \$5,000/)).toBeInTheDocument();
  });

  it("renders DEAD score for an eliminated player and the elimination round in the nickname", () => {
    render(<EndGameRow rank={5} player={DEAD} eliminatedRound={6} />);
    expect(screen.getByText("DEAD")).toBeInTheDocument();
    expect(screen.getByText(/walked the plank, rd\. 6/i)).toBeInTheDocument();
  });
});
