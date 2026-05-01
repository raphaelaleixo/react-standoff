import type { ComponentType } from "react";
import type { FlagId } from "../../theme/colors";
import { CalicoJackFlag } from "./CalicoJackFlag";
import { BlackbeardFlag } from "./BlackbeardFlag";
import { BlackBartFlag } from "./BlackBartFlag";
import { HenryAveryFlag } from "./HenryAveryFlag";
import { EdwardLowFlag } from "./EdwardLowFlag";
import { StedeBonnetFlag } from "./StedeBonnetFlag";
import { GenericFlag } from "./GenericFlag";

// eslint-disable-next-line react-refresh/only-export-components
export const FLAG_COMPONENTS: Record<FlagId, ComponentType<{ size?: number }>> = {
  calico_jack: CalicoJackFlag,
  blackbeard: BlackbeardFlag,
  black_bart: BlackBartFlag,
  henry_avery: HenryAveryFlag,
  edward_low: EdwardLowFlag,
  stede_bonnet: StedeBonnetFlag,
  generic: GenericFlag,
};

export function FlagFor({ id, size = 48 }: { id: string; size?: number }) {
  const Component = (FLAG_COMPONENTS as Record<string, ComponentType<{ size?: number }>>)[id]
    ?? GenericFlag;
  return <Component size={size} />;
}
