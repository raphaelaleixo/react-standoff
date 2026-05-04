import { render, screen } from "@testing-library/react";
import { Foot } from "./Foot";

describe("Foot", () => {
  it("renders the three slots", () => {
    render(<Foot left="VI ALIVE" cry="— hold the line —" right="NEXT" />);
    expect(screen.getByText("VI ALIVE")).toBeInTheDocument();
    expect(screen.getByText("— hold the line —")).toBeInTheDocument();
    expect(screen.getByText("NEXT")).toBeInTheDocument();
  });

  it("renders nothing for an undefined slot", () => {
    const { container } = render(<Foot cry="x" />);
    expect(container.querySelectorAll("[data-foot-slot]")).toHaveLength(3);
  });
});
