import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { FlagPickerGrid } from "./FlagPickerGrid";

describe("FlagPickerGrid", () => {
  it("renders all flag tiles by name", () => {
    render(<FlagPickerGrid taken={new Set()} value={null} onChange={() => {}} />);
    expect(screen.getByText("Calico Jack")).toBeInTheDocument();
    expect(screen.getByText("Blackbeard")).toBeInTheDocument();
    expect(screen.getByText("Stede Bonnet")).toBeInTheDocument();
  });

  it("disables taken flags with the TAKEN badge", () => {
    render(<FlagPickerGrid taken={new Set(["calico_jack"])} value={null} onChange={() => {}} />);
    const tile = screen.getByText("Calico Jack").closest("[data-flag-id]") as HTMLElement;
    expect(tile.getAttribute("data-disabled")).toBe("true");
    expect(tile.querySelector("*")).toBeDefined();
    expect(screen.getByText("TAKEN")).toBeInTheDocument();
  });

  it("calls onChange when an available flag is tapped", () => {
    const fn = vi.fn();
    render(<FlagPickerGrid taken={new Set()} value={null} onChange={fn} />);
    const tile = screen.getByText("Blackbeard").closest("[data-flag-id]") as HTMLElement;
    fireEvent.click(tile);
    expect(fn).toHaveBeenCalledWith("blackbeard");
  });

  it("does not call onChange when a taken flag is tapped", () => {
    const fn = vi.fn();
    render(<FlagPickerGrid taken={new Set(["blackbeard"])} value={null} onChange={fn} />);
    const tile = screen.getByText("Blackbeard").closest("[data-flag-id]") as HTMLElement;
    fireEvent.click(tile);
    expect(fn).not.toHaveBeenCalled();
  });

  it("marks the value tile as selected", () => {
    render(<FlagPickerGrid taken={new Set()} value="henry_avery" onChange={() => {}} />);
    const tile = screen.getByText("Henry Avery").closest("[data-flag-id]") as HTMLElement;
    expect(tile.getAttribute("data-selected")).toBe("true");
  });
});
