import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FlagPickerGrid } from "./FlagPickerGrid";

function tileFor(id: string): HTMLElement {
  return document.querySelector(`[data-flag-id="${id}"]`) as HTMLElement;
}

describe("FlagPickerGrid", () => {
  it("renders one tile per flag id", () => {
    render(<FlagPickerGrid taken={new Set()} value={null} onChange={() => {}} />);
    expect(tileFor("calico_jack")).toBeInTheDocument();
    expect(tileFor("blackbeard")).toBeInTheDocument();
    expect(tileFor("stede_bonnet")).toBeInTheDocument();
  });

  it("disables taken flags with the TAKEN badge", () => {
    render(<FlagPickerGrid taken={new Set(["calico_jack"])} value={null} onChange={() => {}} />);
    const tile = tileFor("calico_jack");
    expect(tile.getAttribute("data-disabled")).toBe("true");
    expect(screen.getByText("TAKEN")).toBeInTheDocument();
  });

  it("calls onChange when an available flag is tapped", () => {
    const fn = vi.fn();
    render(<FlagPickerGrid taken={new Set()} value={null} onChange={fn} />);
    fireEvent.click(tileFor("blackbeard"));
    expect(fn).toHaveBeenCalledWith("blackbeard");
  });

  it("does not call onChange when a taken flag is tapped", () => {
    const fn = vi.fn();
    render(<FlagPickerGrid taken={new Set(["blackbeard"])} value={null} onChange={fn} />);
    fireEvent.click(tileFor("blackbeard"));
    expect(fn).not.toHaveBeenCalled();
  });

  it("marks the value tile as selected", () => {
    render(<FlagPickerGrid taken={new Set()} value="henry_avery" onChange={() => {}} />);
    expect(tileFor("henry_avery").getAttribute("data-selected")).toBe("true");
  });
});
