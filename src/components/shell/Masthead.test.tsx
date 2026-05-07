import { render, screen } from "@testing-library/react";
import { Masthead } from "./Masthead";

describe("Masthead", () => {
  it("renders all three slots", () => {
    render(<Masthead left="ROUND III" center="The Standoff" right="PHASE standoff" />);
    expect(screen.getByText("ROUND III")).toBeInTheDocument();
    expect(screen.getByText("The Standoff")).toBeInTheDocument();
    expect(screen.getByText("PHASE standoff")).toBeInTheDocument();
  });

  it("falls back to default centre when center omitted", () => {
    render(<Masthead left="x" right="y" />);
    expect(screen.getByText("The Standoff")).toBeInTheDocument();
  });

  it("renders the centerSub line under the title when provided", () => {
    render(<Masthead center="The Reckoning" centerSub="THE LEDGER · CLOSED THIS DAY" />);
    expect(screen.getByText("The Reckoning")).toBeInTheDocument();
    expect(screen.getByText("THE LEDGER · CLOSED THIS DAY")).toBeInTheDocument();
  });
});
