import type {
  Banknote,
  Commit,
  Game,
  Player,
  PowerKind,
  RoundActivations,
  RoundPhase,
} from "../../game/types";
import { STARTING_HAND } from "../../game/setup";
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
    shame: shame[c.id] ?? 0,
    status: "alive",
    effects: powers[c.id]
      ? [{ kind: powers[c.id]!, revealed: false, used: false }]
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
    variants: { superPowers: variant },
  };
}

export const SCENARIOS: Scenario[] = [
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
    label: "Quartermaster's Reload trims a Quickdraw",
    blurb:
      "Cap'n Maud plays Quickdraw with Quartermaster's Reload already armed " +
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
    label: "Phantom Pain claims a share anyway",
    blurb:
      "Mad Mary holds Tough and pre-arms it on her commit. Wet Match " +
      "shoots her — she's struck this round, but the reveal beat plays " +
      "Phantom Pain and Mary joins standing for the split.",
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
      "Cap'n Maud holds Insane. Mad Mary will bang her this round. Reveal the " +
      "grenade from the phone before the standoff ends — when the bang lands " +
      "the grenade fires, standing crewmates take 1 wound, awards wipe, round " +
      "terminates.",
    build: () =>
      scenario({
        seats: 4,
        powers: { a: "insane" },
        commits: {
          a: { bullet: "clic", target: "b" },
          b: { bullet: "bang", target: "a" },
          c: { bullet: "clic", target: "d" },
          d: { bullet: "clic", target: "c" },
        },
      }),
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
];
