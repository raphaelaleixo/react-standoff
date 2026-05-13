import type {
  Banknote,
  Commit,
  Game,
  Player,
  PowerKind,
} from "../../game/types";
import { STARTING_HAND } from "../../game/setup";

// A scenario seeds the in-memory game store with a specific opening
// position (players + powers + wounds + commits + variants) so the real
// state machine can run it from `commit` phase forward — no manual phase
// stepping, no synthesised resolutions.
//
// Each scenario builds a fresh Game on demand. Reset → Play replays it
// from the start; useGameState then handles every transition naturally.
export interface Scenario {
  id: string;
  label: string;
  blurb: string;
  build: () => Game;
}

interface CrewMember {
  id: string;
  displayName: string;
  colorOrAvatar: string;
  power?: PowerKind;
  wounds?: 0 | 1 | 2 | 3;
  shame?: number;
}

const CREW: CrewMember[] = [
  { id: "a", displayName: "Cap'n Maud",  colorOrAvatar: "calico_jack"  },
  { id: "b", displayName: "Mad Mary",    colorOrAvatar: "blackbeard"   },
  { id: "c", displayName: "Wet Match",   colorOrAvatar: "edward_low"   },
  { id: "d", displayName: "One-Eye",     colorOrAvatar: "stede_bonnet" },
  { id: "e", displayName: "Old Salt",    colorOrAvatar: "black_bart"   },
  { id: "f", displayName: "Black Sam",   colorOrAvatar: "henry_avery"  },
];

function makePlayer(crew: CrewMember): Player {
  return {
    id: crew.id,
    displayName: crew.displayName,
    colorOrAvatar: crew.colorOrAvatar,
    bullets: [...STARTING_HAND],
    cash: [],
    wounds: crew.wounds ?? 0,
    shame: crew.shame ?? 0,
    status: "alive",
    effects: crew.power
      ? [{ kind: crew.power, revealed: false, used: false }]
      : [],
  };
}

const STARTING_LOOT: Banknote[] = [
  { id: "loot-1", value: 20000 },
  { id: "loot-2", value: 10000 },
  { id: "loot-3", value: 10000 },
  { id: "loot-4", value: 5000 },
  { id: "loot-5", value: 5000 },
];

interface BuildOpts {
  crew: CrewMember[];
  commits?: Record<string, Commit>;
  loot?: Banknote[];
  variant?: boolean;
}

// Build a Game in `commit` phase with the listed crew + pre-filled commits.
// If every alive player has a complete commit (bullet + target), the state
// machine in useGameState advances to `standoff` as soon as it boots.
function build({ crew, commits = {}, loot = STARTING_LOOT, variant = true }: BuildOpts): Game {
  return {
    phase: "in_progress",
    players: crew.map(makePlayer),
    round: {
      number: 1,
      phase: "commit",
      phaseStartedAt: Date.now(),
      loot,
      commits,
      activations: {},
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
      "shoot her. The clamp should drop her wounds-this-round to 1, the reveal " +
      "overlay should play, and the round should split normally.",
    build: () =>
      build({
        crew: [
          { ...CREW[0], power: "dragon_skin" },
          CREW[1],
          CREW[2],
          CREW[3],
        ],
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
      "Cap'n Maud holds Ironhide and starts at 2 wounds. Three banglands her — " +
      "the threshold raise should kick in, she survives at 3, Ironhide reveals.",
    build: () =>
      build({
        crew: [
          { ...CREW[0], power: "unbreakable", wounds: 2 },
          CREW[1],
          CREW[2],
          CREW[3],
        ],
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
    label: "Specialist gets the prompt",
    blurb:
      "Cap'n Maud plays Quickdraw with Quartermaster's Reload in hand. After " +
      "the broadside reveal, the specialist prompt should fire on her phone " +
      "and she can pick a powder to discard.",
    build: () =>
      build({
        crew: [
          { ...CREW[0], power: "specialist" },
          CREW[1],
          CREW[2],
          CREW[3],
        ],
        commits: {
          a: { bullet: "bang_bang_bang", target: "b" },
          b: { bullet: "clic", target: "a" },
          c: { bullet: "clic", target: "d" },
          d: { bullet: "clic", target: "c" },
        },
      }),
  },
  {
    id: "tough-saves-struck",
    label: "Tough prompts a struck player",
    blurb:
      "Mad Mary holds Phantom Pain (Tough). Wet Match shoots her — she's " +
      "struck this round. After reveal_others lands, her phone gets the " +
      "tough prompt and she can claim a share anyway.",
    build: () =>
      build({
        crew: [
          CREW[0],
          { ...CREW[1], power: "tough" },
          CREW[2],
          CREW[3],
        ],
        commits: {
          a: { bullet: "clic", target: "c" },
          b: { bullet: "clic", target: "d" },
          c: { bullet: "bang", target: "b" },
          d: { bullet: "clic", target: "a" },
        },
      }),
  },
  {
    id: "insane-detonates",
    label: "Pocket Inferno detonates",
    blurb:
      "Cap'n Maud holds Insane. Mad Mary will bang her this round, triggering " +
      "the grenade. Standing crewmates take 1 wound, awards wipe, round " +
      "terminates. (Reveal the grenade from the phone before the standoff " +
      "ends to arm it.)",
    build: () =>
      build({
        crew: [
          { ...CREW[0], power: "insane" },
          CREW[1],
          CREW[2],
          CREW[3],
        ],
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
      build({
        crew: [
          { ...CREW[0], power: "six_feet_under" },
          CREW[1],
          { ...CREW[2], wounds: 2 },
          CREW[3],
        ],
        commits: {
          a: { bullet: "clic", target: "b" },
          b: { bullet: "bang", target: "c" },
          c: { bullet: "clic", target: "d" },
          d: { bullet: "bang", target: "c" },
        },
      }),
  },
];
