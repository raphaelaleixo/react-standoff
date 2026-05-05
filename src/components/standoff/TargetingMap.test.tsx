import { render } from "@testing-library/react";
import { TargetingMap } from "./TargetingMap";
import type { Game } from "../../game/types";

function makeGame(overrides?: Partial<Game>): Game {
  const base: Game = {
    seed: "x",
    players: ["a", "b", "c", "d", "e", "f"].map(id => ({
      id, displayName: id.toUpperCase(), colorOrAvatar: "generic",
      bullets: [], cash: [], wounds: 0, shame: 0, status: "alive", effects: [],
    })),
    round: {
      number: 1,
      phase: "standoff",
      phaseStartedAt: 0,
      loot: [], commits: {},
    },
    bankDeck: [], discardedBullets: [], phase: "in_progress",
  };
  return { ...base, ...overrides };
}

describe("TargetingMap", () => {
  it("renders one Roundel per player", () => {
    const g = makeGame();
    const { container } = render(<TargetingMap game={g} />);
    expect(container.querySelectorAll("[data-state]")).toHaveLength(6);
  });

  it("does not draw any targeting lines during commit phase", () => {
    const g = makeGame({ round: { ...makeGame().round, phase: "commit" }});
    const { container } = render(<TargetingMap game={g} />);
    expect(container.querySelectorAll("svg line")).toHaveLength(0);
  });

  it("draws a forward line during withdraw when a player has a target locked", () => {
    const g = makeGame();
    g.round = { ...g.round, phase: "withdraw", commits: { a: { bullet: "bang", target: "b" } } };
    const { container } = render(<TargetingMap game={g} />);
    expect(container.querySelectorAll("svg line").length).toBeGreaterThanOrEqual(1);
  });

  it("only fires the bang_bang_bang lines red during reveal_bbb; others stay provisional", () => {
    const g = makeGame();
    g.round = {
      ...g.round,
      phase: "reveal_bbb",
      commits: {
        a: { bullet: "bang_bang_bang", target: "b" },
        c: { bullet: "bang", target: "d" },
        e: { bullet: "clic", target: "f" },
      },
    };
    const { container } = render(<TargetingMap game={g} />);
    expect(container.querySelectorAll('[data-line-fired="true"]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-line-fired="false"]')).toHaveLength(2);
  });

  it("fires bang and BBB lines red in reveal_others; clic stays provisional", () => {
    const g = makeGame();
    g.round = {
      ...g.round,
      phase: "reveal_others",
      commits: {
        a: { bullet: "bang", target: "b" },           // bang fires now
        c: { bullet: "bang_bang_bang", target: "d" }, // BBB stays red from reveal_bbb
        e: { bullet: "clic", target: "f" },           // clic doesn't hit → stays beige
      },
    };
    const { container } = render(<TargetingMap game={g} />);
    expect(container.querySelectorAll('[data-line-fired="true"]')).toHaveLength(2);
    expect(container.querySelectorAll('[data-line-fired="false"]')).toHaveLength(1);
  });

  it("keeps the struck state on BBB victims through reveal_others and split", () => {
    const g = makeGame();
    g.round = {
      ...g.round,
      phase: "reveal_others",
      commits: {
        a: { bullet: "bang_bang_bang", target: "b" },  // b struck in reveal_bbb, stays laid down
        c: { bullet: "bang", target: "d" },            // d takes the bang in reveal_others
      },
    };
    const { container } = render(<TargetingMap game={g} />);
    // b (BBB victim from earlier) and d (bang victim now) both struck.
    expect(container.querySelectorAll('[data-state="struck"]')).toHaveLength(2);
  });

  it("marks BBB victims with the struck state during reveal_bbb", () => {
    const g = makeGame();
    g.round = {
      ...g.round,
      phase: "reveal_bbb",
      commits: {
        a: { bullet: "bang_bang_bang", target: "b" },  // b is BBB victim
        c: { bullet: "bang", target: "d" },            // d is hit by bang, not BBB
      },
    };
    const { container } = render(<TargetingMap game={g} />);
    expect(container.querySelectorAll('[data-state="struck"]')).toHaveLength(1);
  });

  it("hides non-BBB lines from/to BBB victims (their bullet is discarded by surprise)", () => {
    const g = makeGame();
    g.round = {
      ...g.round,
      phase: "reveal_bbb",
      commits: {
        a: { bullet: "bang_bang_bang", target: "b" },  // BBB → b is victim
        b: { bullet: "bang", target: "c" },            // b's bang voided (b is victim)
        d: { bullet: "bang", target: "b" },            // bang at b voided (b is victim)
      },
    };
    const { container } = render(<TargetingMap game={g} />);
    // Only a→b survives.
    expect(container.querySelectorAll('[data-line-visible="true"]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-line-visible="false"]')).toHaveLength(2);
  });

  it("hides lines from/to yielded players during reveal_bbb", () => {
    const g = makeGame();
    g.round = {
      ...g.round,
      phase: "reveal_bbb",
      commits: {
        a: { bullet: "bang_bang_bang", target: "b" },        // active BBB
        c: { bullet: "bang_bang_bang", target: "d", withdrew: true },  // shooter ducked → hidden
        e: { bullet: "bang_bang_bang", target: "c" },        // target ducked → hidden
      },
    };
    const { container } = render(<TargetingMap game={g} />);
    expect(container.querySelectorAll('[data-line-visible="true"]')).toHaveLength(1);
    expect(container.querySelectorAll('[data-line-visible="false"]')).toHaveLength(2);
  });

  it("hides lines from/to yielded players during reveal_withdraw (kept in DOM for fade)", () => {
    const g = makeGame();
    g.round = {
      ...g.round,
      phase: "reveal_withdraw",
      commits: {
        a: { bullet: "bang", target: "b" },                  // active
        c: { bullet: "bang", target: "d", withdrew: true },  // shooter ducked → hidden
        e: { bullet: "bang", target: "c" },                  // target ducked → hidden
      },
    };
    const { container } = render(<TargetingMap game={g} />);
    // Voided lines stay mounted with opacity 0 so the withdraw transition can
    // fade them out instead of snapping them away.
    expect(container.querySelectorAll('[data-line-visible="true"]')).toHaveLength(1);  // a→b
    expect(container.querySelectorAll('[data-line-visible="false"]')).toHaveLength(2); // c→d, e→c
  });
});
