import { render, screen } from "@testing-library/react";
import { PageCanvas } from "./PageCanvas";

describe("PageCanvas", () => {
  it("renders children on the canvas", () => {
    render(
      <PageCanvas data-testid="canvas">
        <span>hello</span>
      </PageCanvas>
    );
    expect(screen.getByTestId("canvas")).toContainHTML("hello");
  });

  it("applies aspect ratio when provided", () => {
    render(<PageCanvas aspectRatio="16 / 9" data-testid="canvas">x</PageCanvas>);
    const node = screen.getByTestId("canvas");
    expect(node.style.aspectRatio).toBe("16 / 9");
  });

  it("applies border radius when provided", () => {
    render(<PageCanvas borderRadius={28} data-testid="canvas">x</PageCanvas>);
    const node = screen.getByTestId("canvas");
    expect(node.style.borderRadius).toBe("28px");
  });
});
