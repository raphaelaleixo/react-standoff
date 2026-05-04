import { render, screen } from "@testing-library/react";
import { HoardItem } from "./HoardItem";

describe("HoardItem", () => {
  it("renders the silver row", () => {
    render(<HoardItem value={5000} />);
    expect(screen.getByText("SILVER PIECE")).toBeInTheDocument();
    expect(screen.getByText("$5,000")).toBeInTheDocument();
  });
  it("renders the gold doubloon row", () => {
    render(<HoardItem value={10000} />);
    expect(screen.getByText("GOLD DOUBLOON")).toBeInTheDocument();
    expect(screen.getByText("$10,000")).toBeInTheDocument();
  });
  it("renders the jeweled piece with the cut-stone subline", () => {
    render(<HoardItem value={20000} />);
    expect(screen.getByText("JEWELED PIECE")).toBeInTheDocument();
    expect(screen.getByText("$20,000")).toBeInTheDocument();
  });
  it("shows a carry-over tag when carry is true", () => {
    render(<HoardItem value={5000} carry />);
    expect(screen.getByText(/from rd\./i)).toBeInTheDocument();
  });
  it("renders the carry-over round number when provided", () => {
    render(<HoardItem value={5000} carry carryFromRound={2} />);
    expect(screen.getByText(/rd\.\s*ii/i)).toBeInTheDocument();
  });
});
