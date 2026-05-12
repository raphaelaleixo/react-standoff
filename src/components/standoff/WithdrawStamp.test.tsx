import { render, screen } from "@testing-library/react";
import { WithdrawStamp } from "./WithdrawStamp";

describe("WithdrawStamp", () => {
  it("renders the eyebrow and centred numeral", () => {
    render(<WithdrawStamp count={7} />);
    expect(screen.getByText(/TEST YOUR COURAGE/)).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });
});
