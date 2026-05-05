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

// Module-local registry — kept private so the file's only public export is
// `FlagFor`, which is the entry point for the rest of the app.
// `jolly_roger` is intentionally NOT in FlagId — it's a special-purpose flag
// (e.g. anonymous targeting display) that should not be player-pickable.
const FLAG_COMPONENTS: Record<string, ComponentType<{ size?: number }>> = {
  calico_jack: CalicoJackFlag,
  blackbeard: BlackbeardFlag,
  black_bart: BlackBartFlag,
  henry_avery: HenryAveryFlag,
  edward_low: EdwardLowFlag,
  stede_bonnet: StedeBonnetFlag,
  generic: GenericFlag,
  jolly_roger: JollyRogerFlag,
} satisfies Record<FlagId | "jolly_roger", ComponentType<{ size?: number }>>;

export function FlagFor({ id, size = 48 }: { id: string; size?: number }) {
  const Component = (FLAG_COMPONENTS as Record<string, ComponentType<{ size?: number }>>)[id]
    ?? GenericFlag;
  return <Component size={size} />;
}
