import { render, screen } from "@testing-library/react";
import { HoardItem } from "./HoardItem";

describe("HoardItem", () => {
  it("renders the value for a silver piece", () => {
    render(<HoardItem value={5000} />);
    expect(screen.getByText("$5,000")).toBeInTheDocument();
  });
  it("renders the value for a gold doubloon", () => {
    render(<HoardItem value={10000} />);
    expect(screen.getByText("$10,000")).toBeInTheDocument();
  });
  it("renders the value for a jeweled piece", () => {
    render(<HoardItem value={20000} />);
    expect(screen.getByText("$20,000")).toBeInTheDocument();
  });
});
