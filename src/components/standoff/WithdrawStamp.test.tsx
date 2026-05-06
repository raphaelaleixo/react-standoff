import { render, screen } from "@testing-library/react";
import { WithdrawStamp } from "./WithdrawStamp";

describe("WithdrawStamp", () => {
  it("renders the eyebrow, centred numeral, and cry", () => {
    render(<WithdrawStamp count={7} />);
    expect(screen.getByText(/STRIKE THE COLOURS/)).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText(/yield while you can/i)).toBeInTheDocument();
  });
});
