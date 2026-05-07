import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { PowderCard } from "./PowderCard";

describe("PowderCard", () => {
  it("renders the click face", () => {
    render(<PowderCard load="clic" onClick={() => {}} />);
    expect(screen.getByText("CLICK")).toBeInTheDocument();
  });

  it("renders the shot face", () => {
    render(<PowderCard load="bang" onClick={() => {}} />);
    expect(screen.getByText("SHOT")).toBeInTheDocument();
  });

  it("renders the quickdraw face and marks itself as special", () => {
    render(<PowderCard load="bang_bang_bang" onClick={() => {}} data-testid="qd" />);
    expect(screen.getByText("QUICKDRAW")).toBeInTheDocument();
    expect(screen.getByTestId("qd").dataset.special).toBe("true");
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
