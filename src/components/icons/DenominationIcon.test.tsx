import { render, screen } from "@testing-library/react";
import { DenominationIcon } from "./DenominationIcon";

describe("DenominationIcon", () => {
  it("renders the silver variant", () => {
    render(<DenominationIcon value={5000} aria-label="silver" />);
    expect(screen.getByLabelText("silver")).toBeInTheDocument();
  });
  it("renders the gold variant", () => {
    render(<DenominationIcon value={10000} aria-label="gold" />);
    expect(screen.getByLabelText("gold")).toBeInTheDocument();
  });
  it("renders the jewel variant", () => {
    render(<DenominationIcon value={20000} aria-label="jewel" />);
    expect(screen.getByLabelText("jewel")).toBeInTheDocument();
  });
  it("respects the size prop", () => {
    render(<DenominationIcon value={5000} size={32} aria-label="x" />);
    const svg = screen.getByLabelText("x");
    expect(svg).toHaveAttribute("width", "32");
    expect(svg).toHaveAttribute("height", "32");
  });
});
