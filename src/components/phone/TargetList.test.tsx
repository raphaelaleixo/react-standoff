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
  it("renders one chip per opponent labelled by last name word", () => {
    const { container } = render(<TargetList opponents={opponents} />);
    expect(container.querySelectorAll("[data-target-id]")).toHaveLength(2);
    expect(screen.getByText("Mary")).toBeInTheDocument();
    expect(screen.getByText("One-Eye")).toBeInTheDocument();
  });

  it("shows 'Pick yer mark' when no target is selected", () => {
    render(<TargetList opponents={opponents} />);
    expect(screen.getByText(/pick yer mark/i)).toBeInTheDocument();
  });

  it("renders the selected target's full name and cash inside the barrel display", () => {
    render(<TargetList opponents={opponents} selectedId="b" />);
    expect(screen.getByText("Mad Mary")).toBeInTheDocument();
    expect(screen.getByText("$25,000")).toBeInTheDocument();
  });

  it("highlights the selected chip and invokes onPick when a chip is tapped", () => {
    const fn = vi.fn();
    const { container } = render(<TargetList opponents={opponents} selectedId="b" onPick={fn} />);
    const chip = container.querySelector('[data-target-id="b"]') as HTMLElement;
    expect(chip.getAttribute("data-selected")).toBe("true");
    fireEvent.click(chip);
    expect(fn).toHaveBeenCalledWith("b");
  });

  it("invokes onPick when an unselected chip is tapped", () => {
    const fn = vi.fn();
    const { container } = render(<TargetList opponents={opponents} selectedId="b" onPick={fn} />);
    const chip = container.querySelector('[data-target-id="c"]') as HTMLElement;
    fireEvent.click(chip);
    expect(fn).toHaveBeenCalledWith("c");
  });
});
