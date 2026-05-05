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
});
