import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import type { RoomState } from "react-gameroom";
import type { Player } from "../../game/types";
import { MusterScreen } from "./MusterScreen";
import "../../i18n";

function makeRoom(overrides: Partial<RoomState<Player>> = {}): RoomState<Player> {
  return {
    roomId: "QSPY",
    status: "lobby",
    players: [
      { id: 1, name: "Maud",    status: "ready", data: stub("calico_jack",  "Maud") },
      { id: 2, name: "Mary",    status: "ready", data: stub("blackbeard",   "Mary") },
      { id: 3, name: "One-Eye", status: "ready", data: stub("stede_bonnet", "One-Eye") },
      { id: 4, name: "Salt",    status: "ready", data: stub("black_bart",   "Salt") },
      { id: 5, status: "empty" },
      { id: 6, status: "empty" },
    ],
    config: { minPlayers: 4, maxPlayers: 6, requireFull: false },
    ...overrides,
  };
}

function stub(colorOrAvatar: string, displayName: string): Player {
  return {
    id: displayName,
    displayName,
    colorOrAvatar,
    bullets: [],
    cash: [],
    wounds: 0,
    shame: [],
    status: "alive",
    effects: [],
  };
}

describe("MusterScreen", () => {
  it("renders the room code", () => {
    render(<MusterScreen roomState={makeRoom()} joinUrl="https://x/join/QSPY" canStart onStart={() => {}} />);
    // Code appears in both the masthead and the big punch-in tile.
    expect(screen.getAllByText("QSPY").length).toBeGreaterThan(0);
  });

  it("renders one card per claimed player and a placeholder per empty seat", () => {
    render(<MusterScreen roomState={makeRoom()} joinUrl="https://x" canStart onStart={() => {}} />);
    expect(screen.getByText(/MAUD/i)).toBeInTheDocument();
    expect(screen.getByText(/MARY/i)).toBeInTheDocument();
    expect(screen.getAllByText(/EMPTY SEAT/i)).toHaveLength(2);
  });

  it("disables the start button when canStart is false", () => {
    render(<MusterScreen roomState={makeRoom()} joinUrl="https://x" canStart={false} onStart={() => {}} />);
    const btn = screen.getByText(/HOIST THE COLOURS/i).closest("[role='button']");
    expect(btn).toHaveAttribute("aria-disabled", "true");
  });
});
