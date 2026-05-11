import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import type { Game, Player } from "../../game/types";
import { ReckoningScreen } from "./ReckoningScreen";
import "../../i18n";

function player(overrides: Partial<Player>): Player {
  return {
    id: "x",
    displayName: "x",
    colorOrAvatar: "generic",
    bullets: [],
    cash: [],
    wounds: 0,
    shame: 0,
    status: "alive",
    effects: [],
    ...overrides,
  };
}

function makeGame(): Game {
  return {
    seed: "x",
    roomId: "x",
    players: [
      player({ id: "a", displayName: "Cap'n Maud", colorOrAvatar: "calico_jack",
        cash: [{ id: "c1", value: 20000 }, { id: "c2", value: 20000 }, { id: "c3", value: 20000 }, { id: "c4", value: 20000 }, { id: "c5", value: 5000 }] }),
      player({ id: "b", displayName: "Mad Mary", colorOrAvatar: "blackbeard",
        cash: [{ id: "m1", value: 20000 }, { id: "m2", value: 20000 }, { id: "m3", value: 10000 }], shame: 1 }),
      player({ id: "c", displayName: "Wet Match", colorOrAvatar: "edward_low",
        wounds: 3, status: "dead" }),
    ],
    round: { number: 8, phase: "split", phaseStartedAt: 0, loot: [], commits: {} },
    bankDeck: [],
    discardedBullets: [],
    phase: "ended",
  } as Game;
}

describe("ReckoningScreen", () => {
  it("crowns the highest-scoring alive player by display name", () => {
    render(
      <ReckoningScreen
        game={makeGame()}
        roomId="QSPY"
        eliminatedByRound={{}}
        onPlayAgain={() => {}}
        onReturn={() => {}}
      />,
    );
    expect(screen.getByText("Cap'n Maud")).toBeInTheDocument();
  });

  it("renders the rest in rank order under the winner, by display name", () => {
    render(
      <ReckoningScreen
        game={makeGame()}
        roomId="QSPY"
        eliminatedByRound={{}}
        onPlayAgain={() => {}}
        onReturn={() => {}}
      />,
    );
    expect(screen.getByText("Mad Mary")).toBeInTheDocument();
    expect(screen.getByText("Wet Match")).toBeInTheDocument();
    expect(screen.getByText("DEAD")).toBeInTheDocument();
  });

  it("renders the in-game-style masthead with room + fullscreen control", () => {
    render(
      <ReckoningScreen
        game={makeGame()}
        roomId="QSPY"
        eliminatedByRound={{}}
        onPlayAgain={() => {}}
        onReturn={() => {}}
      />,
    );
    expect(screen.getByText("ROOM")).toBeInTheDocument();
    expect(screen.getByText("QSPY")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /standoff/i })).toBeInTheDocument();
  });

  it("invokes the play-again and return callbacks via the foot buttons", () => {
    let again = 0;
    let port = 0;
    render(
      <ReckoningScreen
        game={makeGame()}
        roomId="QSPY"
        eliminatedByRound={{}}
        onPlayAgain={() => { again += 1; }}
        onReturn={() => { port += 1; }}
      />,
    );
    screen.getByText(/ANOTHER ROUND/i).closest("[role='button']")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    screen.getByText(/RETURN TO PORT/i).closest("[role='button']")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(again).toBe(1);
    expect(port).toBe(1);
  });
});
