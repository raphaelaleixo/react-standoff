import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { TargetList } from "./TargetList";
import type { Player } from "../../game/types";

const opponents: Player[] = [
  {
    id: "b",
    displayName: "Mad Mary",
    colorOrAvatar: "blackbeard",
    bullets: [],
    cash: [{ id: "n1", value: 20000 }, { id: "n2", value: 5000 }],
    wounds: 0,
    shame: 0,
    status: "alive",
    effects: [],
  },
  {
    id: "c",
    displayName: "One-Eye",
    colorOrAvatar: "stede_bonnet",
    bullets: [],
    cash: [{ id: "n3", value: 5000 }],
    wounds: 0,
    shame: 0,
    status: "alive",
    effects: [],
  },
];

describe("TargetList", () => {
  it("renders each opponent's displayName and cash", () => {
    render(<TargetList opponents={opponents} />);
    expect(screen.getByText("Mad Mary")).toBeInTheDocument();
    expect(screen.getByText("One-Eye")).toBeInTheDocument();
    expect(screen.getByText("$25,000")).toBeInTheDocument();
    expect(screen.getByText("$5,000")).toBeInTheDocument();
  });

  it("highlights the selected target and invokes onPick on tap", () => {
    const fn = vi.fn();
    render(<TargetList opponents={opponents} selectedId="b" onPick={fn} />);
    const row = screen.getByText("Mad Mary").closest("[data-target-id]") as HTMLElement;
    expect(row.getAttribute("data-selected")).toBe("true");
    fireEvent.click(row);
    expect(fn).toHaveBeenCalledWith("b");
  });
});
