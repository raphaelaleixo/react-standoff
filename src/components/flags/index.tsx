import type { ComponentType } from "react";
import type { FlagId } from "../../theme/colors";
import { CalicoJackFlag } from "./CalicoJackFlag";
import { BlackbeardFlag } from "./BlackbeardFlag";
import { BlackBartFlag } from "./BlackBartFlag";
import { HenryAveryFlag } from "./HenryAveryFlag";
import { EdwardLowFlag } from "./EdwardLowFlag";
import { StedeBonnetFlag } from "./StedeBonnetFlag";
import { GenericFlag } from "./GenericFlag";
import { JollyRogerFlag } from "./JollyRogerFlag";
import { JollyRoger1Flag } from "./JollyRoger1Flag";
import { JollyRoger2Flag } from "./JollyRoger2Flag";
import { JollyRoger3Flag } from "./JollyRoger3Flag";
import { JollyRoger4Flag } from "./JollyRoger4Flag";
import { JollyRoger5Flag } from "./JollyRoger5Flag";

// Jolly Roger ids are intentionally NOT in FlagId — they're special-purpose
// flags (anonymous targeting display) that aren't player-pickable.
type JollyRogerId =
  | "jolly_roger"
  | "jolly_roger_1"
  | "jolly_roger_2"
  | "jolly_roger_3"
  | "jolly_roger_4"
  | "jolly_roger_5";

// Module-local registry — kept private so the file's only public export is
// `FlagFor`, which is the entry point for the rest of the app.
const FLAG_COMPONENTS: Record<string, ComponentType<{ size?: number }>> = {
  calico_jack: CalicoJackFlag,
  blackbeard: BlackbeardFlag,
  black_bart: BlackBartFlag,
  henry_avery: HenryAveryFlag,
  edward_low: EdwardLowFlag,
  stede_bonnet: StedeBonnetFlag,
  generic: GenericFlag,
  jolly_roger: JollyRogerFlag,
  jolly_roger_1: JollyRoger1Flag,
  jolly_roger_2: JollyRoger2Flag,
  jolly_roger_3: JollyRoger3Flag,
  jolly_roger_4: JollyRoger4Flag,
  jolly_roger_5: JollyRoger5Flag,
} satisfies Record<FlagId | JollyRogerId, ComponentType<{ size?: number }>>;

export function FlagFor({ id, size = 48 }: { id: string; size?: number }) {
  const Component = (FLAG_COMPONENTS as Record<string, ComponentType<{ size?: number }>>)[id]
    ?? GenericFlag;
  return <Component size={size} />;
}

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
