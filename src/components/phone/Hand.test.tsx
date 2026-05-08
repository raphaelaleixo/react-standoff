import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Hand } from "./Hand";
import type { HandSlot } from "../../hooks/useHandSlots";

function slotsFromString(spec: string): HandSlot[] {
  // Quick fixture builder: "C C S Q" → [clic, clic, bang, bang_bang_bang]
  // append ! to mark a slot spent (e.g. "C! C S Q").
  return spec
    .trim()
    .split(/\s+/)
    .map(token => {
      const spent = token.endsWith("!");
      const t = spent ? token.slice(0, -1) : token;
      const load =
        t === "C" ? "clic"
        : t === "S" ? "bang"
        : t === "Q" ? "bang_bang_bang"
        : (() => { throw new Error(`unknown slot token ${token}`); })();
      return { load, spent };
    });
}

describe("Hand", () => {
  it("renders one PowderCard per slot", () => {
    const { container } = render(<Hand slots={slotsFromString("C C S Q")} />);
    expect(container.querySelectorAll("[data-card-slot]")).toHaveLength(4);
  });

  it("renders face-up slots with their card faces visible (CLICK / SHOT / QUICK + DRAW)", () => {
    render(<Hand slots={slotsFromString("Q S C C")} />);
    // Each card shows its label — QUICKDRAW renders as two stacked lines.
    expect(screen.getAllByText("CLICK")).toHaveLength(2);
    expect(screen.getByText("SHOT")).toBeInTheDocument();
    expect(screen.getByText("QUICK")).toBeInTheDocument();
    expect(screen.getByText("DRAW")).toBeInTheDocument();
  });

  it("renders spent slots with the red-X overlay and dimmed face still visible", () => {
    const { container } = render(<Hand slots={slotsFromString("C C! S Q")} />);
    const cards = container.querySelectorAll("[data-card-slot] > *");
    expect(cards[1].getAttribute("data-spent")).toBe("true");
    expect(cards[1].querySelector("[data-spent-x]")).not.toBeNull();
  });

  it("calls onPick with the load + slot index when a face-up card is tapped", () => {
    const fn = vi.fn();
    const { container } = render(
      <Hand slots={slotsFromString("C C S Q")} onPick={fn} />,
    );
    const shotCard = container.querySelector('[data-position="2"] [role="button"]') as HTMLElement;
    shotCard.click();
    expect(fn).toHaveBeenCalledWith("bang", 2);
  });

  it("does not call onPick when a spent card is tapped", () => {
    const fn = vi.fn();
    const { container } = render(
      <Hand slots={slotsFromString("C C! S Q")} onPick={fn} />,
    );
    const spentCard = container.querySelector('[data-position="1"] > *') as HTMLElement;
    spentCard.click();
    expect(fn).not.toHaveBeenCalled();
  });
});
