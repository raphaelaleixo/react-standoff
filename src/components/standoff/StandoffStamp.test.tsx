import { render, screen } from "@testing-library/react";
import { StandoffStamp } from "./StandoffStamp";

describe("StandoffStamp", () => {
  it("renders the count numeral", () => {
    render(<StandoffStamp count={3} />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders the eyebrow and the cry", () => {
    render(<StandoffStamp count={2} />);
    expect(screen.getByText(/AT THE COUNT OF/)).toBeInTheDocument();
    expect(screen.getByText(/STAND\./)).toBeInTheDocument();
  });
});
