import { render, screen } from "@testing-library/react";
import { Roundel } from "./Roundel";

describe("Roundel", () => {
  it("renders the flag and the name", () => {
    render(<Roundel flagId="calico_jack" name="CALICO JACK" />);
    expect(screen.getByText("CALICO JACK")).toBeInTheDocument();
  });

  it("applies a ducked style when ducked", () => {
    render(<Roundel flagId="generic" name="X" ducked data-testid="r" />);
    const node = screen.getByTestId("r");
    expect(node.dataset.state).toBe("ducked");
  });

  it("applies a dim style when dim", () => {
    render(<Roundel flagId="generic" name="X" dim data-testid="r" />);
    const node = screen.getByTestId("r");
    expect(node.dataset.state).toBe("dim");
  });
});
