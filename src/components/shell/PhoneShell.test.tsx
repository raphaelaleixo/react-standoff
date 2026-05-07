import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PhoneShell } from "./PhoneShell";
import type { Player } from "../../game/types";
import "../../i18n";

const me: Player = {
  id: "a",
  displayName: "Cap'n Maud",
  colorOrAvatar: "calico_jack",
  bullets: [],
  cash: [{ id: "n1", value: 10000 }, { id: "n2", value: 5000 }],
  wounds: 1,
  shame: 0,
  status: "alive",
  effects: [],
};

describe("PhoneShell", () => {
  it("renders the player header strip with displayName, cash, and wounds chip", () => {
    render(
      <PhoneShell me={me} round={3} phaseLabel="LOAD & AIM">
        <div>body</div>
      </PhoneShell>,
    );
    expect(screen.getByText("Cap'n Maud")).toBeInTheDocument();
    expect(screen.getByText("$15,000")).toBeInTheDocument();
    expect(screen.getByText(/wounds I\/III/i)).toBeInTheDocument();
  });

  it("renders the round + phase strip", () => {
    render(
      <PhoneShell me={me} round={3} phaseLabel="LOAD & AIM">
        <div />
      </PhoneShell>,
    );
    expect(screen.getByText("ROUND")).toBeInTheDocument();
    expect(screen.getByText("III of VIII")).toBeInTheDocument();
    expect(screen.getByText("LOAD & AIM")).toBeInTheDocument();
  });

  it("renders body children inside the canvas", () => {
    render(
      <PhoneShell me={me} round={1} phaseLabel="X">
        <div data-testid="body">body</div>
      </PhoneShell>,
    );
    expect(screen.getByTestId("body")).toBeInTheDocument();
  });
});
