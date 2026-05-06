import { render, screen } from "@testing-library/react";
import { WithdrawStamp } from "./WithdrawStamp";

describe("WithdrawStamp", () => {
  it("renders the eyebrow and the seconds count", () => {
    render(<WithdrawStamp count={7} />);
    expect(screen.getByText(/STRIKE THE COLOURS/)).toBeInTheDocument();
    expect(screen.getByText(/yield in/i)).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText(/seconds/i)).toBeInTheDocument();
  });
});
