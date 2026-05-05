import { render, screen } from "@testing-library/react";
import { RevealBanner } from "./RevealBanner";

describe("RevealBanner", () => {
  it("renders the broadside banner with subline", () => {
    render(<RevealBanner kind="broadside" struckCount={2} />);
    expect(screen.getByText(/BROADSIDE/)).toBeInTheDocument();
    expect(screen.getByText(/2 struck/i)).toBeInTheDocument();
  });

  it("renders a kill banner with the player name", () => {
    render(<RevealBanner kind="kill" name="Stede Bonnet" />);
    expect(screen.getByText(/WALKED THE PLANK/)).toBeInTheDocument();
    expect(screen.getByText(/Stede Bonnet/)).toBeInTheDocument();
  });
});
