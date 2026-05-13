import { Box } from "@mui/material";
import type { Game, Player, PowerKind } from "../../game/types";
import { CrewRow, type CrewStatus } from "./CrewRow";
import { SectionHeader } from "../shell/SectionHeader";

interface CrewRosterProps {
  game: Game;
  /** Player ids that were just struck this round (for the wound-pip pulse). */
  freshlyStruck?: Set<string>;
}

// Per-player wound count to add for the current phase's pip display.
// BBB shots count from reveal_bbb onwards; bangs join in at reveal_others.
// The grenade phase short-circuits the chain and lights up every player
// the resolver wounded (post-Krakenscale clamp).
function computeStruckCounts(game: Game): Record<string, number> {
  const counts: Record<string, number> = {};
  const phase = game.round.phase;
  if (phase === "grenade") {
    const wounded = game.round.resolution?.woundedThisRound ?? {};
    for (const id of Object.keys(wounded)) {
      const n = wounded[id] ?? 0;
      if (n > 0) counts[id] = n;
    }
    return counts;
  }
  if (phase !== "reveal_bbb" && phase !== "reveal_others" && phase !== "split") {
    return counts;
  }
  // BBB shots: each hit lands a wound. Track which shooters were BBB-struck
  // themselves so their bang doesn't fire in the next pass.
  const bbbStruck = new Set<string>();
  for (const p of game.players) {
    const c = game.round.commits[p.id];
    if (c?.bullet === "bang_bang_bang" && !c.withdrew && c.target) {
      const tc = game.round.commits[c.target];
      if (!tc?.withdrew) {
        counts[c.target] = (counts[c.target] ?? 0) + 1;
        bbbStruck.add(c.target);
      }
    }
  }
  if (phase === "reveal_others" || phase === "split") {
    for (const p of game.players) {
      const c = game.round.commits[p.id];
      if (c?.bullet === "bang" && !c.withdrew && c.target) {
        if (bbbStruck.has(p.id)) continue; // shooter was BBB-wounded → bullet voided
        const tc = game.round.commits[c.target];
        if (tc?.withdrew) continue;
        counts[c.target] = (counts[c.target] ?? 0) + 1;
      }
    }
  }
  return counts;
}


// Yielding gives a shame marker. The marker becomes visible once the duck is
// public — reveal_withdraw onward.
function effectiveShame(p: Player, game: Game): number {
  const phase = game.round.phase;
  const yieldRevealed =
    phase === "reveal_withdraw" ||
    phase === "reveal_bbb" ||
    phase === "reveal_others" ||
    phase === "split" ||
    phase === "grenade";
  return yieldRevealed && game.round.commits[p.id]?.withdrew ? p.shame + 1 : p.shame;
}

function deriveStatus(
  game: Game,
  p: Player,
  struckCount: number,
): CrewStatus | undefined {
  if (p.status === "dead") return "dead";
  const c = game.round.commits[p.id];
  switch (game.round.phase) {
    case "commit":
      return c?.bullet && c?.target ? "ready" : "choosing";
    case "standoff":
    case "standoff_hold":
    case "withdraw":
      return undefined;
    case "reveal_withdraw":
      return c?.withdrew ? "yielded" : undefined;
    case "reveal_bbb":
    case "reveal_others":
    case "split":
    case "grenade":
      if (struckCount > 0) return "struck";
      if (c?.withdrew) return "yielded";
      // No pill for standing players — they're alive and (in split) get the take.
      return undefined;
    default:
      return undefined;
  }
}

// Power kinds that should appear as a row badge AS SOON AS they're in flight,
// not later when the resolver flips the persistent revealed flag at split.
// Sources:
//   - resolution.powerActivations from the in-flight resolver pass
//   - the armed-not-fired insane holder (activations.insane is set but the
//     grenade hasn't detonated yet)
// Returns playerId → set of kinds (deduped against revealed effects inside
// CrewRow).
function computeExtraBadges(game: Game): Map<string, PowerKind[]> {
  const out = new Map<string, PowerKind[]>();
  const add = (playerId: string, kind: PowerKind): void => {
    const existing = out.get(playerId);
    if (existing) {
      if (!existing.includes(kind)) existing.push(kind);
    } else {
      out.set(playerId, [kind]);
    }
  };
  const insaneHolder = game.round.activations.insane?.playerId;
  if (insaneHolder) add(insaneHolder, "insane");
  for (const a of game.round.resolution?.powerActivations ?? []) {
    add(a.playerId, a.kind);
  }
  return out;
}

export function CrewRoster({ game, freshlyStruck }: CrewRosterProps) {
  const fresh = freshlyStruck ?? new Set<string>();
  // Union the freshlyStruck signal from the parent (real-time wound
  // application) with our commits-based derivation. The parent only
  // signals "this player was just hit" — we treat that as +1 to the
  // computed count so the STRUCK pill + pip pulse work for both live
  // games and the mock board (where freshlyStruck isn't simulated).
  const counts = computeStruckCounts(game);
  for (const id of fresh) counts[id] = Math.max(counts[id] ?? 0, 1);
  const extraBadges = computeExtraBadges(game);
  return (
    <Box sx={{ display: "flex", flexDirection: "column", flex: 1, overflow: "visible" }}>
      <SectionHeader title="The Crew" subtitle="six souls, one prize" />
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        {game.players.map(p => {
          const struckCount = counts[p.id] ?? 0;
          const wounds = p.wounds + struckCount;
          const shame = effectiveShame(p, game);
          // The pip rail bumps to 4 slots when Ironhide is in flight for this
          // player — either the persistent revealed flag is up or this
          // round's resolution pushed an unbreakable activation for them.
          const hasUnbreakable = p.effects.some(e => e.kind === "unbreakable");
          const unbreakableRevealed =
            p.effects.some(e => e.kind === "unbreakable" && e.revealed) ||
            (game.round.resolution?.powerActivations ?? []).some(
              a => a.playerId === p.id && a.kind === "unbreakable",
            );
          const woundSlots = hasUnbreakable && unbreakableRevealed ? 4 : 3;
          return (
            <CrewRow
              key={p.id}
              player={{ ...p, wounds: Math.min(wounds, woundSlots) as Player["wounds"], shame }}
              status={deriveStatus(game, p, struckCount)}
              freshWoundIndex={fresh.has(p.id) ? wounds - 1 : undefined}
              extraBadgeKinds={extraBadges.get(p.id)}
              woundSlots={woundSlots}
            />
          );
        })}
      </Box>
    </Box>
  );
}
