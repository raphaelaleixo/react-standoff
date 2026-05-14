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
    shame: [],
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
    shame: [],
    status: "alive",
    effects: [],
  },
  {
    id: "d",
    displayName: "Old Salt",
    colorOrAvatar: "black_bart",
    bullets: [],
    cash: [{ id: "n4", value: 10000 }],
    wounds: 0,
    shame: [],
    status: "alive",
    effects: [],
  },
];

describe("TargetList", () => {
  it("renders one slidable cell per opponent inside the barrel viewport", () => {
    const { container } = render(<TargetList opponents={opponents} />);
    expect(container.querySelectorAll("[data-target-id]")).toHaveLength(3);
  });

  it("renders left and right navigation arrows flanking the disc", () => {
    const { container } = render(<TargetList opponents={opponents} />);
    expect(container.querySelector('[data-target-arrow="left"]')).not.toBeNull();
    expect(container.querySelector('[data-target-arrow="right"]')).not.toBeNull();
  });

  it("shows the selected opponent's full name and cash beneath the disc", () => {
    render(<TargetList opponents={opponents} selectedId="b" />);
    expect(screen.getByText("Mad Mary")).toBeInTheDocument();
    expect(screen.getByText("$25,000")).toBeInTheDocument();
  });

  it("falls back to the first opponent's details when nothing is selected yet", () => {
    render(<TargetList opponents={opponents} />);
    expect(screen.getByText("Mad Mary")).toBeInTheDocument();
  });

  it("invokes onPick with the next opponent when the right arrow is tapped", () => {
    const fn = vi.fn();
    const { container } = render(<TargetList opponents={opponents} selectedId="b" onPick={fn} />);
    const right = container.querySelector('[data-target-arrow="right"]') as HTMLElement;
    fireEvent.click(right);
    expect(fn).toHaveBeenCalledWith("c");
  });

  it("invokes onPick with the previous opponent when the left arrow is tapped", () => {
    const fn = vi.fn();
    const { container } = render(<TargetList opponents={opponents} selectedId="c" onPick={fn} />);
    const left = container.querySelector('[data-target-arrow="left"]') as HTMLElement;
    fireEvent.click(left);
    expect(fn).toHaveBeenCalledWith("b");
  });

  it("disables the left arrow on the first opponent", () => {
    const fn = vi.fn();
    const { container } = render(<TargetList opponents={opponents} selectedId="b" onPick={fn} />);
    const left = container.querySelector('[data-target-arrow="left"]') as HTMLElement;
    expect(left.getAttribute("data-disabled")).toBe("true");
    fireEvent.click(left);
    expect(fn).not.toHaveBeenCalled();
  });

  it("disables the right arrow on the last opponent", () => {
    const fn = vi.fn();
    const { container } = render(<TargetList opponents={opponents} selectedId="d" onPick={fn} />);
    const right = container.querySelector('[data-target-arrow="right"]') as HTMLElement;
    expect(right.getAttribute("data-disabled")).toBe("true");
    fireEvent.click(right);
    expect(fn).not.toHaveBeenCalled();
  });
});
