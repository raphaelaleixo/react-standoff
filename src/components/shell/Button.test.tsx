import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "./Button";

describe("Button", () => {
  it("renders the label", () => {
    render(<Button onClick={() => {}}>RAISE THE FLAG</Button>);
    expect(screen.getByRole("button", { name: /raise the flag/i })).toBeInTheDocument();
  });

  it("renders an italic caption underneath when provided", () => {
    render(<Button caption="— shot · stede bonnet —">READY</Button>);
    expect(screen.getByText("— shot · stede bonnet —")).toBeInTheDocument();
  });

  it("calls onClick when not disabled", () => {
    const fn = vi.fn();
    render(<Button onClick={fn}>OK</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(fn).toHaveBeenCalledOnce();
  });

  it("does not call onClick when disabled", () => {
    const fn = vi.fn();
    render(<Button onClick={fn} disabled>OK</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(fn).not.toHaveBeenCalled();
  });

  it("renders ghost and text variants", () => {
    const { rerender } = render(<Button variant="ghost">A</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("data-variant", "ghost");
    rerender(<Button variant="text">B</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("data-variant", "text");
  });
});
