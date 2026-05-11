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
import type { JollyRogerId } from "./jollyRogerForColor";

// Re-export the jolly-roger helper so existing import sites that grab it from
// `../flags` keep working without churn — but the function lives in its own
// file (jollyRogerForColor.ts) so this index file is exclusively components,
// satisfying react-refresh's only-export-components rule.
export { jollyRogerForColor } from "./jollyRogerForColor";

// Module-local registry — kept private so the file's only public component
// export is `FlagFor`, the entry point for the rest of the app.
const FLAG_COMPONENTS: Record<string, ComponentType<{ size?: number | string }>> = {
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
} satisfies Record<FlagId | JollyRogerId, ComponentType<{ size?: number | string }>>;

export function FlagFor({ id, size = 48 }: { id: string; size?: number | string }) {
  const Component = (FLAG_COMPONENTS as Record<string, ComponentType<{ size?: number | string }>>)[id]
    ?? GenericFlag;
  return <Component size={size} />;
}
