import { render, screen } from "@testing-library/react";
import { StandoffStamp } from "./StandoffStamp";

describe("StandoffStamp", () => {
  it("renders the count numeral", () => {
    render(<StandoffStamp count={3} />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders the eyebrow", () => {
    render(<StandoffStamp count={2} />);
    expect(screen.getByText(/AIM TO YOUR TARGET IN/)).toBeInTheDocument();
  });
});
