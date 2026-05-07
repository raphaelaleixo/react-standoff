import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { YieldRibbon } from "./YieldRibbon";

describe("YieldRibbon", () => {
  it("shows YIELD when not yielded", () => {
    render(<YieldRibbon yielded={false} onToggle={() => {}} />);
    expect(screen.getByText("YIELD")).toBeInTheDocument();
    expect(screen.getByText(/hands up, powder dry/i)).toBeInTheDocument();
  });

  it("shows YIELDED + change-yer-mind subline when yielded", () => {
    render(<YieldRibbon yielded onToggle={() => {}} />);
    expect(screen.getByText("YIELDED")).toBeInTheDocument();
    expect(screen.getByText(/CHANGE YER MIND/i)).toBeInTheDocument();
  });

  it("calls onToggle when tapped", () => {
    const fn = vi.fn();
    render(<YieldRibbon yielded={false} onToggle={fn} />);
    fireEvent.click(screen.getByText("YIELD"));
    expect(fn).toHaveBeenCalledOnce();
  });
});
