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
  shame: [],
  status: "alive",
  effects: [],
};

describe("PhoneShell", () => {
  it("renders the room code and a footer with cash + wound pips", () => {
    const { container } = render(
      <PhoneShell me={me} roomId="QSPY">
        <div>body</div>
      </PhoneShell>,
    );
    expect(screen.getByText("QSPY")).toBeInTheDocument();
    expect(screen.getByText("$15,000")).toBeInTheDocument();
    // Wound pips render with data-pip="filled" or "empty"; verify presence.
    expect(container.querySelectorAll('[data-pip="filled"], [data-pip="empty"]').length).toBeGreaterThan(0);
  });

  it("renders body children inside the canvas", () => {
    render(
      <PhoneShell me={me} roomId="QSPY">
        <div data-testid="body">body</div>
      </PhoneShell>,
    );
    expect(screen.getByTestId("body")).toBeInTheDocument();
  });
});
