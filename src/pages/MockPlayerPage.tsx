// DEV-only mock for the player phone view. Loads a scenario into a local
// in-memory game store and runs the REAL state machine in useGameState
// against it, same as MockBigScreen — so the phone UI reacts to phases,
// resolves, and power activations on real timings. A seat selector
// chooses which player is "me", a variant toggle flips the Super Powers
// rules on/off, and the InsaneRevealButton wires to the real
// submitInsane so the grenade scenario plays through.
import { useCallback, useEffect, useRef, useState } from "react";

import { Box, Button, ToggleButton, ToggleButtonGroup } from "@mui/material";
import { PhoneShell } from "../components/shell/PhoneShell";
import { PhaseView } from "../components/phone/PhaseView";
import { PhoneReckoning } from "../components/phone/PhoneReckoning";
import { XMarksCheckbox } from "../components/XMarksCheckbox";
import { useGameState } from "../hooks/useGameState";
import { useHandSlots } from "../hooks/useHandSlots";
import { createLocalGameStore, type LocalGameStore } from "../components/dev/localGameStore";
import { SCENARIOS } from "../components/dev/scenarios";
import { ScenarioDock, type DockSurface } from "../components/dev/ScenarioDock";
import { palette } from "../theme/colors";
import { fonts } from "../theme/typography";
import { RECKONING_GAME } from "../components/dev/mockFixtures";
import { telephoneHolderOrder } from "../game/transitions";
import type { Game, RoundResolution } from "../game/types";

// Smoke-testing the cop variant from this mock page:
//   1. Pick a cop scenario from the dock (e.g. `cop-calls-early`).
//   2. Pick a seat — seat 0 is the cop in all cop scenarios.
//   3. Round 1 commit → RoleRevealScreen fires; tap "Aye" to acknowledge.
//   4. Use "Force telephone" to jump straight into the bottle-pass beat.
//   5. The current holder's phone shows `TelephoneHolderScreen` with PASS/Send.

// Player surface has no muster screen — the lobby join lives on its own
// route, not the in-game phone.
const SURFACES: DockSurface[] = ["game", "reckoning"];

export default function MockPlayerPage() {
  const [store] = useState<LocalGameStore>(() => createLocalGameStore(null));
  const serverNow = useCallback(() => Date.now(), []);
  const { game, submitCommit, submitDuck } = useGameState(store, serverNow);

  const [scenarioId, setScenarioId] = useState<string>(SCENARIOS[0].id);
  const [surface, setSurface] = useState<DockSurface>("game");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("a");
  // Variant override — toggling this flips the in-progress game's variant
  // flag so the dev can flick between powered + un-powered UI without
  // reloading the scenario.
  const [variantOverride, setVariantOverride] = useState<boolean | null>(null);

  const loadScenario = useCallback(
    (id: string) => {
      const def = SCENARIOS.find(s => s.id === id);
      if (!def) return;
      const built = def.build();
      store.reset(built);
      setVariantOverride(null);
      // Auto-select the first alive seat that hasn't committed yet so the
      // commit picker shows on load (scenarios pre-fill 3-of-4 commits to
      // leave a single open seat for the dev to drive).
      const openSeat = built.players.find(
        p =>
          p.status === "alive" &&
          (!built.round.commits[p.id] ||
            built.round.commits[p.id].bullet === undefined ||
            built.round.commits[p.id].target === undefined),
      );
      if (openSeat) setSelectedPlayerId(openSeat.id);
    },
    [store],
  );

  const handlePlay = () => loadScenario(scenarioId);
  const handleReset = () => store.reset(null);

  // Dev-only jump straight to the telephone phase. Mirrors the engine's
  // phase-entry write in useGameState: builds a minimal `resolution`
  // (all-alive standing so the holder order is non-empty), flips the
  // phase, and seeds `Round.telephone` with the first holder so the
  // TelephoneHolderScreen renders immediately.
  const forceTelephone = useCallback(() => {
    const current = game;
    if (!current) return;
    if (!current.variants.cop) return;
    if (current.round.phase === "telephone") return;

    const standing =
      current.round.resolution?.standing ??
      current.players.filter(p => p.status === "alive").map(p => p.id);

    const resolution: RoundResolution = current.round.resolution ?? {
      shots: [],
      ducks: [],
      standing,
      woundedThisRound: {},
      eliminated: [],
      awards: {},
      carryover: [],
      powerActivations: [],
    };

    const order = telephoneHolderOrder({
      ...current,
      round: { ...current.round, resolution },
    });
    if (order.length === 0) return;

    const next: Game = {
      ...current,
      round: {
        ...current.round,
        phase: "telephone",
        phaseStartedAt: Date.now(),
        resolution,
        telephone: {
          used: false,
          holderOrder: order,
          currentHolderId: order[0],
        },
      },
    };
    store.set(next);
  }, [game, store]);

  // Fire scenario phase-entry hooks once per phase transition (same as
  // MockBigScreen). Powers production reads from a phone (tough was here
  // before bundling, insane today) can be auto-armed by the scenario.
  const lastPhaseRef = useRef<string | null>(null);
  const activeScenario = SCENARIOS.find(s => s.id === scenarioId);
  useEffect(() => {
    if (!game) {
      lastPhaseRef.current = null;
      return;
    }
    const phase = game.round.phase;
    if (lastPhaseRef.current === phase) return;
    lastPhaseRef.current = phase;
    activeScenario?.onPhaseEnter?.[phase]?.(store);
  }, [game, activeScenario, store]);

  // Pre-compute everything hook-driven up front so the early returns below
  // don't violate the rules of hooks. When the scenario hasn't been loaded
  // yet (game === null) we feed the hand-slots derivation an empty bullet
  // list — the result is unused in the idle/reckoning branches.
  const renderGame: typeof game =
    game === null
      ? null
      : variantOverride === null
      ? game
      : { ...game, variants: { ...game.variants, superPowers: variantOverride } };
  const me = renderGame?.players.find(p => p.id === selectedPlayerId) ?? renderGame?.players[0];
  const handSlots = useHandSlots(me?.bullets ?? []);

  if (surface === "reckoning") {
    const reck = RECKONING_GAME;
    return (
      <>
        <PhoneShell me={reck.players[0]} roomId="MOCK">
          <PhoneReckoning game={reck} me={reck.players[0]} />
        </PhoneShell>
        <ScenarioDock
          surface={surface}
          onSurfaceChange={setSurface}
          surfaces={SURFACES}
          scenarioId={scenarioId}
          onScenarioChange={setScenarioId}
          onPlay={handlePlay}
          onReset={handleReset}
          playing={false}
          blurb={activeScenario?.blurb ?? ""}
        />
      </>
    );
  }

  if (!renderGame || !me) {
    return (
      <>
        <ScenarioIdle scenario={activeScenario} />
        <ScenarioDock
          surface={surface}
          onSurfaceChange={setSurface}
          surfaces={SURFACES}
          scenarioId={scenarioId}
          onScenarioChange={setScenarioId}
          onPlay={handlePlay}
          onReset={handleReset}
          playing={false}
          blurb={activeScenario?.blurb ?? ""}
        />
      </>
    );
  }

  const myPowerKind = me.effects[0]?.kind;

  const introOpen =
    renderGame.variants.superPowers &&
    !!myPowerKind &&
    renderGame.round.number === 1 &&
    renderGame.round.phase === "commit";

  const roleIntroOpen =
    renderGame.variants.cop &&
    !!me.role &&
    renderGame.round.number === 1 &&
    renderGame.round.phase === "commit";

  // Mirror PlayerPage: flip the corner card to USED as soon as the
  // commit lands with the power armed, not at split.
  const armedThisRound =
    renderGame.round.activations.specialist?.playerId === me.id ||
    renderGame.round.activations.insane?.playerId === me.id ||
    renderGame.round.commits[me.id]?.armTough === true;

  return (
    <>
      <PhoneShell
        me={me}
        roomId="MOCK"
        introOpen={introOpen}
        roleIntroOpen={roleIntroOpen}
        armedThisRound={armedThisRound}
      >
        <PhaseView
          game={renderGame}
          me={me}
          submitCommit={submitCommit}
          submitDuck={submitDuck}
          handSlots={handSlots}
          store={store}
        />
      </PhoneShell>
      <ScenarioDock
        surface={surface}
        onSurfaceChange={setSurface}
        surfaces={SURFACES}
        scenarioId={scenarioId}
        onScenarioChange={setScenarioId}
        onPlay={handlePlay}
        onReset={handleReset}
        playing={true}
        blurb={activeScenario?.blurb ?? ""}
      >
        <SeatSelector
          players={renderGame.players.map(p => ({ id: p.id, displayName: p.displayName }))}
          selectedId={me.id}
          onSelect={setSelectedPlayerId}
        />
        <XMarksCheckbox
          checked={renderGame.variants.superPowers}
          onChange={setVariantOverride}
          label="Super Powers"
        />
        {renderGame.variants.cop && (
          <Button
            size="small"
            variant="outlined"
            onClick={forceTelephone}
            disabled={renderGame.round.phase === "telephone"}
            sx={{
              textTransform: "none",
              color: palette.paper,
              borderColor: palette.paper,
              "&.Mui-disabled": {
                color: palette.paperDim,
                borderColor: palette.rule,
              },
            }}
          >
            Force telephone
          </Button>
        )}
      </ScenarioDock>
    </>
  );
}

function ScenarioIdle({ scenario }: { scenario: { label: string; blurb: string } | undefined }) {
  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "2rem",
        color: palette.paper,
      }}
    >
      <Box
        sx={{
          fontFamily: fonts.displayCaps,
          fontFeatureSettings: '"smcp"',
          fontSize: "0.7rem",
          letterSpacing: "0.4em",
          color: palette.paperDim,
          marginBottom: "0.6rem",
        }}
      >
        SCENARIO
      </Box>
      <Box
        sx={{
          fontFamily: fonts.blackletter,
          fontSize: "2.2rem",
          lineHeight: 1.1,
          marginBottom: "0.9rem",
        }}
      >
        {scenario?.label ?? "Pick a scenario"}
      </Box>
      <Box
        sx={{
          fontFamily: fonts.body,
          fontStyle: "italic",
          fontSize: "1.05rem",
          maxWidth: "32rem",
          color: palette.paperDim,
        }}
      >
        {scenario?.blurb ?? "Press ▶ Play in the dev dock."}
      </Box>
    </Box>
  );
}

function SeatSelector({
  players,
  selectedId,
  onSelect,
}: {
  players: Array<{ id: string; displayName: string }>;
  selectedId: string;
  onSelect(id: string): void;
}) {
  return (
    <Box>
      <Box
        sx={{
          fontFamily: fonts.displayCaps,
          fontFeatureSettings: '"smcp"',
          fontSize: "0.6rem",
          letterSpacing: "0.32em",
          color: palette.paperDim,
          marginBottom: "0.25rem",
        }}
      >
        SEAT
      </Box>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={selectedId}
        onChange={(_, value: string | null) => {
          if (value) onSelect(value);
        }}
        sx={{
          flexWrap: "wrap",
          "& .MuiToggleButton-root": {
            color: palette.paper,
            borderColor: palette.rule,
            padding: "0.15rem 0.5rem",
            fontFamily: fonts.body,
            textTransform: "none",
            "&.Mui-selected": {
              background: palette.paper,
              color: palette.ink,
              "&:hover": { background: palette.paper },
            },
          },
        }}
      >
        {players.map(p => (
          <ToggleButton key={p.id} value={p.id}>
            {p.displayName.split(" ")[0]}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
}
