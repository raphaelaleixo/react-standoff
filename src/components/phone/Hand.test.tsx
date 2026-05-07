import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Hand } from "./Hand";
import type { BulletCard } from "../../game/types";

describe("Hand", () => {
  it("always renders 8 slots", () => {
    const { container } = render(<Hand bullets={["bang"]} />);
    expect(container.querySelectorAll("[data-card-slot]")).toHaveLength(8);
  });

  it("renders face-up cards in click → shot → quickdraw order", () => {
    const bullets: BulletCard[] = ["bang_bang_bang", "bang", "clic", "clic"];
    render(<Hand bullets={bullets} />);
    const cards = screen.getAllByText(/CLICK|SHOT|QUICKDRAW/);
    expect(cards.map(c => c.textContent)).toEqual(["CLICK", "CLICK", "SHOT", "QUICKDRAW"]);
  });

  it("renders 8 - bullets.length spent slots", () => {
    const bullets: BulletCard[] = ["bang"];
    render(<Hand bullets={bullets} />);
    expect(screen.getAllByText("SPENT")).toHaveLength(7);
  });

  it("calls onPick with the load + displayed index when an unspent card is tapped", () => {
    const fn = vi.fn();
    render(<Hand bullets={["bang", "clic"]} onPick={fn} />);
    // After sort: clic (0), bang (1). Click the inner role=button so the
    // PowderCard's handler fires (data-card-slot wraps it but isn't itself
    // tappable).
    const shotCard = screen.getByText("SHOT").closest("[role='button']") as HTMLElement;
    shotCard.click();
    expect(fn).toHaveBeenCalledWith("bang", 1);
  });
});
