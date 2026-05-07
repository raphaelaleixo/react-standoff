import { render, screen } from "@testing-library/react";
import { RevealStamp } from "./RevealStamp";

describe("RevealStamp", () => {
  it("renders the supplied label", () => {
    render(<RevealStamp label="Quickdraw!" />);
    expect(screen.getByText("Quickdraw!")).toBeInTheDocument();
  });
});
