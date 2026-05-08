import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { PowderCard } from "./PowderCard";

describe("PowderCard", () => {
  it("renders the click face with the dash glyph", () => {
    const { container } = render(<PowderCard load="clic" onClick={() => {}} />);
    expect(screen.getByText("CLICK")).toBeInTheDocument();
    expect(container.querySelector('[data-glyph="dash"]')).not.toBeNull();
  });

  it("renders the shot face with the target reticle glyph", () => {
    const { container } = render(<PowderCard load="bang" onClick={() => {}} />);
    expect(screen.getByText("SHOT")).toBeInTheDocument();
    expect(container.querySelector('[data-glyph="reticle"]')).not.toBeNull();
  });

  it("renders the quickdraw face on two lines with the lightning bolt glyph", () => {
    const { container } = render(<PowderCard load="bang_bang_bang" onClick={() => {}} />);
    expect(screen.getByText("QUICK")).toBeInTheDocument();
    expect(screen.getByText("DRAW")).toBeInTheDocument();
    expect(container.querySelector('[data-glyph="bolt"]')).not.toBeNull();
  });

  it("flips face-down when spent", () => {
    render(<PowderCard load="bang" spent />);
    expect(screen.getByText("SPENT")).toBeInTheDocument();
    expect(screen.queryByText("SHOT")).not.toBeInTheDocument();
  });

  it("calls onClick when tapped", () => {
    const fn = vi.fn();
    render(<PowderCard load="bang" onClick={fn} data-testid="c" />);
    fireEvent.click(screen.getByTestId("c"));
    expect(fn).toHaveBeenCalledOnce();
  });

  it("does not call onClick when spent", () => {
    const fn = vi.fn();
    render(<PowderCard load="bang" onClick={fn} spent data-testid="c" />);
    fireEvent.click(screen.getByTestId("c"));
    expect(fn).not.toHaveBeenCalled();
  });

  it("marks itself selected when selected=true", () => {
    render(<PowderCard load="bang" selected data-testid="c" />);
    expect(screen.getByTestId("c").dataset.selected).toBe("true");
  });
});
