import type { FlagId } from "../theme/colors";

export const FLAG_IDS: FlagId[] = [
  "calico_jack",
  "blackbeard",
  "black_bart",
  "henry_avery",
  "edward_low",
  "stede_bonnet",
  "generic",
];

export const FLAG_LABELS: Record<FlagId, string> = {
  calico_jack: "Calico Jack",
  blackbeard: "Blackbeard",
  black_bart: "Black Bart",
  henry_avery: "Henry Avery",
  edward_low: "Edward Low",
  stede_bonnet: "Stede Bonnet",
  generic: "No-Name",
};

export function takenFlags(playerData: ({ colorOrAvatar: string } | undefined)[]): Set<string> {
  const taken = new Set<string>();
  for (const p of playerData) {
    if (p?.colorOrAvatar) taken.add(p.colorOrAvatar);
  }
  return taken;
}
