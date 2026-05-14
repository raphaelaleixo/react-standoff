import type {
  Banknote,
  Commit,
  Game,
  Player,
  PowerKind,
  RoundActivations,
  RoundPhase,
} from "../../game/types";
import { STARTING_HAND, initGame } from "../../game/setup";
import { PUBLIC_POWER_KINDS } from "../../game/powerKinds";
import type { GameStore } from "../../hooks/gameStore";

// =============================================================================
// Scenarios for the dev MockBigScreen.
//
// A scenario seeds the in-memory game store with a specific opening position
// (players + powers + wounds + commits + variants). The real state machine in
// useGameState then ticks through every phase on real timings — no manual
// stepping, no synthesised resolutions.
//
// Adding a new scenario:
//
//   {
//     id: "my-scenario",
//     label: "Pick a short verb-phrase title",
//     blurb: "1–2 sentences describing what you should see happen.",
//     build: () => scenario({
//       seats: 4,                                  // use CREW[0..3]
//       powers: { a: "tough" },                    // optional; keyed by seat id
//       wounds: { a: 2 },                          // optional; 0|1|2|3
//       shame:  { a: 1 },                          // optional
//       commits: {                                 // optional; if all alive
//         a: { bullet: "clic", target: "b" },      //   players commit, the
//         b: { bullet: "bang", target: "a" },      //   state machine
//         c: { bullet: "clic", target: "d" },      //   auto-advances to
//         d: { bullet: "clic", target: "c" },      //   standoff immediately.
//       },
//       variant: true,                             // defaults to true
//     }),
//   },
//
// Seat ids run a, b, c, d, e, f and map to the CREW roster below.
// =============================================================================

export interface Scenario {
  id: string;
  label: string;
  blurb: string;
  build: () => Game;
  // Optional phase-entry hooks. MockBigScreen calls these once when the
  // state machine ticks into the named phase, letting a scenario inject
  // activations that production reads from a phone (tough, insane), so the
  // scenario plays through to completion in big-screen-only mode.
  onPhaseEnter?: Partial<Record<RoundPhase, (store: GameStore) => void>>;
}

interface CrewMember {
  id: string;
  displayName: string;
  colorOrAvatar: string;
}

const CREW: CrewMember[] = [
  { id: "a", displayName: "Cap'n Maud", colorOrAvatar: "calico_jack"  },
  { id: "b", displayName: "Mad Mary",   colorOrAvatar: "blackbeard"   },
  { id: "c", displayName: "Wet Match",  colorOrAvatar: "edward_low"   },
  { id: "d", displayName: "One-Eye",    colorOrAvatar: "stede_bonnet" },
  { id: "e", displayName: "Old Salt",   colorOrAvatar: "black_bart"   },
  { id: "f", displayName: "Black Sam",  colorOrAvatar: "henry_avery"  },
];

const STARTING_LOOT: Banknote[] = [
  { id: "loot-1", value: 20000 },
  { id: "loot-2", value: 10000 },
  { id: "loot-3", value: 10000 },
  { id: "loot-4", value: 5000 },
  { id: "loot-5", value: 5000 },
];

interface ScenarioOpts {
  seats: number;
  powers?: Partial<Record<string, PowerKind>>;
  wounds?: Partial<Record<string, 0 | 1 | 2 | 3>>;
  shame?: Partial<Record<string, number>>;
  commits?: Record<string, Commit>;
  // Pre-set activations the resolver should pick up at the first re-resolve.
  // Use for cards now bundled into the commit (e.g. Specialist) so the
  // scenario plays out as if the holder had armed them at commit time.
  activations?: RoundActivations;
  loot?: Banknote[];
  variant?: boolean;
}

// Build a Game in `commit` phase with the requested crew + opening position.
// If every alive player has a complete commit (bullet + target), the state
// machine in useGameState advances to `standoff` as soon as it boots.
function scenario({
  seats,
  powers = {},
  wounds = {},
  shame = {},
  commits = {},
  activations = {},
  loot = STARTING_LOOT,
  variant = true,
}: ScenarioOpts): Game {
  const players: Player[] = CREW.slice(0, seats).map(c => ({
    id: c.id,
    displayName: c.displayName,
    colorOrAvatar: c.colorOrAvatar,
    bullets: [...STARTING_HAND],
    cash: [],
    wounds: wounds[c.id] ?? 0,
    shame: Array.from({ length: shame[c.id] ?? 0 }, () => ({ flashing: false })),
    status: "alive",
    effects: powers[c.id]
      ? [{ kind: powers[c.id]!, revealed: PUBLIC_POWER_KINDS.has(powers[c.id]!), used: false }]
      : [],
  }));
  return {
    phase: "in_progress",
    players,
    round: {
      number: 1,
      phase: "commit",
      phaseStartedAt: Date.now(),
      loot,
      commits,
      activations,
    },
    bankDeck: [],
    discardedBullets: [],
    seed: "scenario",
    variants: { superPowers: variant, cop: false },
  };
}

export const SCENARIOS: Scenario[] = [
  {
    id: "pick-and-play-specialist",
    label: "Pick & play — Specialist (Spare Powder)",
    blurb:
      "Seat 'a' (Specialist) is the only open commit; b, c, d are pre-filled. " +
      "Mad Mary is banging Maud. Pick B!B!B!, tick the Spare Powder " +
      "chip, commit. Wait through standoff → withdraw → reveals " +
      "(~30s). Round 2 opens with the Specialist card stamped USED.",
    build: () =>
      scenario({
        seats: 4,
        powers: { a: "specialist" },
        commits: {
          b: { bullet: "bang", target: "a" },
          c: { bullet: "clic", target: "d" },
          d: { bullet: "clic", target: "c" },
        },
      }),
  },
  {
    id: "pick-and-play-tough",
    label: "Pick & play — Tough (Phantom Pain)",
    blurb:
      "Seat 'a' (Tough) is the only open commit; b, c, d are pre-filled. " +
      "Mad Mary is banging Maud. Tick the Phantom Pain chip, commit any " +
      "bullet, wait ~30s. The save lands at the split and round 2 opens " +
      "with the card stamped USED.",
    build: () =>
      scenario({
        seats: 4,
        powers: { a: "tough" },
        commits: {
          b: { bullet: "bang", target: "a" },
          c: { bullet: "clic", target: "d" },
          d: { bullet: "clic", target: "c" },
        },
      }),
  },
  {
    id: "pick-and-play-the-kid",
    label: "Pick & play — Dead Eye (Kid)",
    blurb:
      "Seat 'a' (Dead Eye) is the only open commit; b, c, d are " +
      "pre-filled. Pick your bullet at commit, watch the standoff stamp " +
      "and aim lines come up — then during late_commit you fill in your " +
      "mark with everyone else's aim on screen.",
    build: () =>
      scenario({
        seats: 4,
        powers: { a: "the_kid" },
        commits: {
          b: { bullet: "bang", target: "c" },
          c: { bullet: "clic", target: "d" },
          d: { bullet: "clic", target: "b" },
        },
      }),
  },
  {
    id: "pick-and-play-the-cunning",
    label: "Pick & play — Bloodhound (Cunning)",
    blurb:
      "Seat 'a' (Bloodhound) is the only open commit; b, c, d are " +
      "pre-filled. Pick your mark at commit, watch the standoff stamp " +
      "and aim lines come up — then during late_commit you load your " +
      "bullet with everyone else's aim on screen.",
    build: () =>
      scenario({
        seats: 4,
        powers: { a: "the_cunning" },
        commits: {
          b: { bullet: "bang", target: "c" },
          c: { bullet: "clic", target: "d" },
          d: { bullet: "clic", target: "b" },
        },
      }),
  },
  {
    id: "pick-and-play-insane",
    label: "Pick & play — Insane (Pocket Inferno)",
    blurb:
      "Seat 'a' (Insane) is the only open commit; b, c, d are pre-filled. " +
      "Mad Mary is banging Maud. Tick Pocket Inferno, commit, wait through " +
      "the shots — the wound trips the grenade, BOOM detonates, and round 2 " +
      "opens with the card stamped USED.",
    build: () =>
      scenario({
        seats: 4,
        powers: { a: "insane" },
        commits: {
          b: { bullet: "bang", target: "a" },
          c: { bullet: "clic", target: "d" },
          d: { bullet: "clic", target: "c" },
        },
      }),
  },
  {
    id: "commit-loop",
    label: "Commit picker — all powers armed",
    blurb:
      "No pre-filled commits — state machine sits in commit phase. Use the " +
      "seat selector: 'a' has Specialist (tap B!B!B! to see Spare " +
      "Powder), 'b' has Tough (Phantom Pain chip), 'c' has Insane (Pocket " +
      "Inferno chip), 'd' has Dragon Skin (passive, no chip). Round doesn't " +
      "advance until all four seats commit — use this for picker layout, " +
      "not for end-to-end power testing.",
    build: () =>
      scenario({
        seats: 4,
        powers: { a: "specialist", b: "tough", c: "insane", d: "dragon_skin" },
      }),
  },
  {
    id: "krakenscale-double-shot",
    label: "Krakenscale clamps a double shot",
    blurb:
      "Cap'n Maud holds Krakenscale (unrevealed). Mad Mary and Wet Match both " +
      "shoot her. The clamp drops her wounds-this-round to 1, the reveal " +
      "overlay plays, and the round splits normally.",
    build: () =>
      scenario({
        seats: 4,
        powers: { a: "dragon_skin" },
        commits: {
          a: { bullet: "clic", target: "b" },
          b: { bullet: "bang", target: "a" },
          c: { bullet: "bang", target: "a" },
          d: { bullet: "clic", target: "c" },
        },
      }),
  },
  {
    id: "ironhide-saves",
    label: "Ironhide saves at 3 wounds",
    blurb:
      "Cap'n Maud holds Ironhide and enters healthy. Three bangs land this " +
      "round — without Ironhide she'd die at 3 wounds, but the threshold " +
      "raises to 4 and she survives at 3.",
    build: () =>
      scenario({
        seats: 4,
        powers: { a: "unbreakable" },
        commits: {
          a: { bullet: "clic", target: "b" },
          b: { bullet: "bang", target: "a" },
          c: { bullet: "bang", target: "a" },
          d: { bullet: "bang", target: "a" },
        },
      }),
  },
  {
    id: "specialist-saves-bbb",
    label: "Spare Powder trims a Quickdraw",
    blurb:
      "Cap'n Maud plays Quickdraw with Spare Powder already armed " +
      "(discarding a CLICK). The specialist card plays on the big screen " +
      "before the broadside, and the resolved volley shows only the surviving " +
      "two shots.",
    build: () =>
      scenario({
        seats: 4,
        powers: { a: "specialist" },
        commits: {
          a: { bullet: "bang_bang_bang", target: "b" },
          b: { bullet: "clic", target: "a" },
          c: { bullet: "clic", target: "d" },
          d: { bullet: "clic", target: "c" },
        },
        activations: {
          specialist: { playerId: "a", discardedBulletKind: "clic" },
        },
      }),
  },
  {
    id: "tough-saves-struck",
    label: "Phantom Pain joins standing",
    blurb:
      "Mad Mary holds Tough and pre-arms it on her commit. Wet Match " +
      "shoots her — she's struck this round, but Phantom Pain lands at " +
      "the reveal beat and Mary joins standing. The standard bag can't " +
      "be cleanly split 4 ways, so the Rollover stamp follows.",
    build: () =>
      scenario({
        seats: 4,
        powers: { b: "tough" },
        commits: {
          a: { bullet: "clic", target: "c" },
          b: { bullet: "clic", target: "d", armTough: true },
          c: { bullet: "bang", target: "b" },
          d: { bullet: "clic", target: "a" },
        },
      }),
  },
  {
    id: "insane-detonates",
    label: "Pocket Inferno detonates",
    blurb:
      "Cap'n Maud holds Insane and pre-arms Pocket Inferno on her commit. " +
      "Mad Mary will bang her this round — when the bang lands the grenade " +
      "detonates, standing crewmates take 1 wound, awards wipe, round " +
      "terminates.",
    build: () =>
      scenario({
        seats: 4,
        powers: { a: "insane" },
        // Maud armed the grenade alongside her commit — same atomic write
        // the production submitCommit produces when armInsane is checked.
        activations: { insane: { playerId: "a" } },
        commits: {
          a: { bullet: "clic", target: "b" },
          b: { bullet: "bang", target: "a" },
          c: { bullet: "clic", target: "d" },
          d: { bullet: "clic", target: "c" },
        },
      }),
  },
  {
    id: "dead-eye-late-aim",
    label: "Dead Eye calls the mark late",
    blurb:
      "Cap'n Maud holds Dead Eye. She locks her powder at commit (BANG) but " +
      "leaves the mark blank. After the standoff lines draw in and she sees " +
      "Mad Mary aiming her way, late_commit fills in Mary as the mark. The " +
      "shot trades during reveal.",
    build: () =>
      scenario({
        seats: 4,
        powers: { a: "the_kid" },
        commits: {
          a: { bullet: "bang" },
          b: { bullet: "bang", target: "a" },
          c: { bullet: "clic", target: "d" },
          d: { bullet: "bang", target: "c" },
        },
      }),
    onPhaseEnter: {
      late_commit: (store) => {
        store.update("round", { "commits/a/target": "b" });
      },
    },
  },
  {
    id: "kid-and-cunning-on-parade",
    label: "Dead Eye + Bloodhound on parade",
    blurb:
      "Cap'n Maud holds Dead Eye, Mad Mary holds Bloodhound. Both badges " +
      "are revealed on deal — you see them on the crew rail from the moment " +
      "the round opens. Maud locks her powder at commit (BANG); Mary locks " +
      "Wet Match as her mark. At late_commit Maud calls One-Eye and Mary " +
      "loads BANG. Both lines animate in.",
    build: () =>
      scenario({
        seats: 4,
        powers: { a: "the_kid", b: "the_cunning" },
        commits: {
          a: { bullet: "bang" },
          b: { target: "c" },
          c: { bullet: "bang", target: "d" },
          d: { bullet: "clic", target: "a" },
        },
      }),
    onPhaseEnter: {
      late_commit: (store) => {
        store.update("round", {
          "commits/a/target": "d",
          "commits/b/bullet": "bang",
        });
      },
    },
  },
  {
    id: "bloodhound-late-load",
    label: "Bloodhound loads the gun late",
    blurb:
      "Cap'n Maud holds Bloodhound. She locks Mad Mary as her mark at commit " +
      "but leaves the powder unchosen. After the standoff lines draw in she " +
      "loads BANG during late_commit and the round resolves.",
    build: () =>
      scenario({
        seats: 4,
        powers: { a: "the_cunning" },
        commits: {
          a: { target: "b" },
          b: { bullet: "clic", target: "a" },
          c: { bullet: "clic", target: "d" },
          d: { bullet: "bang", target: "c" },
        },
      }),
    onPhaseEnter: {
      late_commit: (store) => {
        store.update("round", { "commits/a/bullet": "bang" });
      },
    },
  },
  {
    id: "six-feet-bonus",
    label: "Davy Jones's Cut earns from a kill",
    blurb:
      "Cap'n Maud holds Six Feet Under. Wet Match enters at 2 wounds and gets " +
      "shot to death — the bonus lands at the next reckoning.",
    build: () =>
      scenario({
        seats: 4,
        powers: { a: "six_feet_under" },
        wounds: { c: 2 },
        commits: {
          a: { bullet: "clic", target: "b" },
          b: { bullet: "bang", target: "c" },
          c: { bullet: "clic", target: "d" },
          d: { bullet: "bang", target: "c" },
        },
      }),
  },
  // ===========================================================================
  // Cop variant scenarios. Built via initGame (which handles role-deal +
  // game.cop init), then specific fields are pinned for reproducibility.
  // ===========================================================================
  {
    id: "cop-calls-early",
    label: "Cop calls early — cruises to win",
    blurb:
      "Cop drops the call in round 1. Reinforcements arrive by round 3. " +
      "Cop ducks once, survives, wins.",
    build: () => buildCopScenario("cop-calls-early", game => {
      game.cop = { callsMade: 3, reinforcementsRoundOnTheWay: 3 };
      game.round.number = 4;
    }),
  },
  {
    id: "cop-never-calls",
    label: "Cop never calls — mafia wins",
    blurb:
      "Cop sits on the call. Round 7 begins — too late. Mafia wins " +
      "regardless of survival.",
    build: () => buildCopScenario("cop-never-calls", game => {
      game.cop = { callsMade: 0 };
      game.round.number = 7;
    }),
  },
  {
    id: "cop-killed-before-call",
    label: "Cop killed in round 2",
    blurb:
      "Mafia drops the cop before any call. Phase 8 keeps running as " +
      "theater for the remaining rounds; mafia wins at reckoning.",
    build: () => buildCopScenario("cop-killed-before-call", game => {
      game.players[0].status = "dead";
      game.players[0].wounds = 3;
      game.cop = { callsMade: 0 };
      game.round.number = 3;
    }),
  },
  {
    id: "cop-overducks",
    label: "Cop calls but overducks",
    blurb:
      "Cop lands the call in round 4 but ducks twice after — too cautious. " +
      "Mafia wins.",
    build: () => buildCopScenario("cop-overducks", game => {
      game.players[0].shame = [{ flashing: true }, { flashing: true }];
      game.cop = { callsMade: 3, reinforcementsRoundOnTheWay: 4 };
      game.round.number = 8;
    }),
  },
  {
    id: "mafia-rich-cop-loses",
    label: "Cop barely loses, mafia gets paid",
    blurb:
      "Reinforcements land but cop took 2 flashing-light shames. " +
      "Richest mafia takes the crown.",
    build: () => buildCopScenario("mafia-rich-cop-loses", game => {
      game.players[0].shame = [
        { flashing: false },
        { flashing: true },
        { flashing: true },
      ];
      game.players[0].cash = [{ id: "cop-cash-1", value: 10000 }];
      // Richest mafia at seat 1 — 50k via 20+20+10.
      game.players[1].cash = [
        { id: "mafia-cash-1", value: 20000 },
        { id: "mafia-cash-2", value: 20000 },
        { id: "mafia-cash-3", value: 10000 },
      ];
      game.cop = { callsMade: 3, reinforcementsRoundOnTheWay: 5 };
      game.round.number = 8;
    }),
  },
];

// 5-seat crew template used for cop-variant scenarios. initGame fills in
// bullets/cash/wounds/shame/status, then the scenario's mutator pins the
// fields it cares about (cop state, round number, role assignments).
function copScenarioPlayers(): Player[] {
  return CREW.slice(0, 5).map(c => ({
    id: c.id,
    displayName: c.displayName,
    colorOrAvatar: c.colorOrAvatar,
    bullets: [],
    cash: [],
    wounds: 0,
    shame: [],
    status: "alive",
    effects: [],
  }));
}

function buildCopScenario(seed: string, mutate: (game: Game) => void): Game {
  const game = initGame(copScenarioPlayers(), seed, Date.now(), {
    superPowers: false,
    cop: true,
  });
  // Pin roles to specific seats so each scenario is reproducible regardless
  // of the deal RNG. Seat 0 is always the cop; the rest are mafia.
  game.players[0].role = "cop";
  game.players.slice(1).forEach(p => (p.role = "mafia"));
  mutate(game);
  return game;
}
