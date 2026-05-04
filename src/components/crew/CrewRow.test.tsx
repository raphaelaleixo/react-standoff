import { render, screen } from "@testing-library/react";
import { CrewRow } from "./CrewRow";
import type { Player } from "../../game/types";

function p(over: Partial<Player> = {}): Player {
  return {
    id: "a", displayName: "Cap'n Maud", colorOrAvatar: "calico_jack",
    bullets: [], cash: [], wounds: 0, shame: 0, status: "alive", effects: [],
    ...over,
  };
}

describe("CrewRow", () => {
  it("renders flag pirate-name + nickname", () => {
    render(<CrewRow player={p()} flagName="CALICO JACK" status="aiming" />);
    expect(screen.getByText("CALICO JACK")).toBeInTheDocument();
    expect(screen.getByText(/Cap'n Maud/)).toBeInTheDocument();
  });

  it("renders the AIMING status pill", () => {
    render(<CrewRow player={p()} flagName="X" status="aiming" />);
    expect(screen.getByText("AIMING")).toBeInTheDocument();
  });

  it("renders 3 wound pips, filled per wounds count", () => {
    render(<CrewRow player={p({ wounds: 2 })} flagName="X" status="aiming" data-testid="r" />);
    const pips = screen.getByTestId("r").querySelectorAll("[data-pip]");
    expect(pips).toHaveLength(3);
    expect(pips[0].getAttribute("data-pip")).toBe("filled");
    expect(pips[1].getAttribute("data-pip")).toBe("filled");
    expect(pips[2].getAttribute("data-pip")).toBe("empty");
  });

  it("renders the yellow streak chip when shame > 0", () => {
    render(<CrewRow player={p({ shame: 2 })} flagName="X" status="aiming" />);
    expect(screen.getByText(/YELLOW ×2/)).toBeInTheDocument();
  });

  it("renders empty pockets text when cash is empty", () => {
    render(<CrewRow player={p()} flagName="X" status="aiming" />);
    expect(screen.getByText(/empty pockets/i)).toBeInTheDocument();
  });
});
