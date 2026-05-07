import type { FlagId } from "../../theme/colors";

// Jolly Roger ids are intentionally NOT in FlagId — they're special-purpose
// flags (anonymous targeting display) that aren't player-pickable.
export type JollyRogerId =
  | "jolly_roger"
  | "jolly_roger_1"
  | "jolly_roger_2"
  | "jolly_roger_3"
  | "jolly_roger_4"
  | "jolly_roger_5";

// One distinct jolly roger silhouette per pickable flag color, so the central
// targeting roundel is recognizable at a glance even before reading the tint.
// `generic` falls back to the default jolly roger.
const JOLLY_ROGER_BY_COLOR: Record<FlagId, JollyRogerId> = {
  calico_jack: "jolly_roger",
  blackbeard: "jolly_roger_1",
  black_bart: "jolly_roger_2",
  henry_avery: "jolly_roger_3",
  edward_low: "jolly_roger_4",
  stede_bonnet: "jolly_roger_5",
  generic: "jolly_roger",
};

export function jollyRogerForColor(colorId: string): JollyRogerId {
  return (JOLLY_ROGER_BY_COLOR as Record<string, JollyRogerId>)[colorId] ?? "jolly_roger";
}
