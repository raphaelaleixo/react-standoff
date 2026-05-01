import { describe, it, expect } from "vitest";
import { FLAG_IDS, takenFlags } from "./playerFlags";

describe("playerFlags", () => {
  it("exposes the v1 flag set in display order", () => {
    expect(FLAG_IDS).toEqual([
      "calico_jack",
      "blackbeard",
      "black_bart",
      "henry_avery",
      "edward_low",
      "stede_bonnet",
      "generic",
    ]);
  });

  it("takenFlags returns flag ids already used by player data", () => {
    const data = [
      { colorOrAvatar: "calico_jack" },
      undefined,
      { colorOrAvatar: "blackbeard" },
    ];
    const taken = takenFlags(data);
    expect(taken.has("calico_jack")).toBe(true);
    expect(taken.has("blackbeard")).toBe(true);
    expect(taken.has("black_bart")).toBe(false);
  });

  it("takenFlags ignores undefined entries", () => {
    expect(takenFlags([undefined, undefined])).toEqual(new Set());
  });
});
