import { render, screen } from "@testing-library/react";
import { CrewRow } from "./CrewRow";
import type { Player } from "../../game/types";

function p(over: Partial<Player> = {}): Player {
  return {
    id: "a", displayName: "Cap'n Maud", colorOrAvatar: "calico_jack",
    bullets: [], cash: [], wounds: 0, shame: [], status: "alive", effects: [],
    ...over,
  };
}

describe("CrewRow", () => {
  it("renders the player nickname", () => {
    render(<CrewRow player={p()} status="ready" />);
    expect(screen.getByText(/Cap'n Maud/)).toBeInTheDocument();
  });

  it("renders the READY status pill", () => {
    render(<CrewRow player={p()} status="ready" />);
    expect(screen.getByText("READY")).toBeInTheDocument();
  });

  it("renders 3 wound pips, filled per wounds count", () => {
    render(<CrewRow player={p({ wounds: 2 })} status="ready" data-testid="r" />);
    const pips = screen.getByTestId("r").querySelectorAll("[data-pip]");
    expect(pips).toHaveLength(3);
    expect(pips[0].getAttribute("data-pip")).toBe("filled");
    expect(pips[1].getAttribute("data-pip")).toBe("filled");
    expect(pips[2].getAttribute("data-pip")).toBe("empty");
  });

  it("renders one yellow pip per shame marker", () => {
    render(<CrewRow player={p({ shame: [{ flashing: false }, { flashing: false }] })} status="ready" data-testid="r" />);
    const shamePips = screen.getByTestId("r").querySelectorAll('[data-pip="shame"]');
    expect(shamePips).toHaveLength(2);
  });

  it("renders $0 when the player has no cash (instead of flavor text)", () => {
    render(<CrewRow player={p()} status="ready" />);
    expect(screen.getByText("$0")).toBeInTheDocument();
  });

  it("renders distinct text styles per status (e.g. yielded vs choosing)", () => {
    const { rerender } = render(<CrewRow player={p()} status="yielded" />);
    const yieldedPill = screen.getByText("YIELDED");
    expect(yieldedPill).toBeInTheDocument();
    expect(yieldedPill.getAttribute("data-status")).toBe("yielded");
    const yieldedClass = yieldedPill.className;

    rerender(<CrewRow player={p()} status="choosing" />);
    const choosingPill = screen.getByText("CHOOSING");
    expect(choosingPill.getAttribute("data-status")).toBe("choosing");
    expect(choosingPill.className).not.toBe(yieldedClass);
  });

  it("renders dead pill without compounding opacity (relies on outer row opacity only)", () => {
    render(<CrewRow player={p({ status: "dead" })} status="dead" data-testid="r" />);
    const pill = screen.getByText("DEAD");
    expect(pill.getAttribute("style") ?? "").not.toMatch(/opacity:\s*0\.6/);
  });
});
