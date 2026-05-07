import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { InvertedQR } from "./InvertedQR";

describe("InvertedQR", () => {
  it("renders a wrapper around RoomQRCode at the given size", () => {
    const { container } = render(
      <InvertedQR roomId="ABCD" url="https://example.test/join/ABCD" size={180} />,
    );
    const wrapper = container.querySelector("[data-inverted-qr]") as HTMLElement | null;
    expect(wrapper).not.toBeNull();
    // The wrapper should have an SVG child from RoomQRCode.
    expect(wrapper?.querySelector("svg")).not.toBeNull();
  });
});
