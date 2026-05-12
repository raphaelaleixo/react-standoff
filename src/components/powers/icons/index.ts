import type { ComponentType } from "react";
import type { PowerKind } from "../../../game/types";
import { StitchedWound } from "./StitchedWound";
import { Coffin } from "./Coffin";
import { ShoulderArmor } from "./ShoulderArmor";
import { PrayingHands } from "./PrayingHands";
import { FourWounds } from "./FourWounds";
import { Quickdraw } from "./Quickdraw";

// Per-power sigil registry. PowerKinds with no entry fall back to the
// default anchor mark inside PowerCard. Icons must render via `currentColor`
// so the card chooses the colour.
export const POWER_ICONS: Partial<Record<PowerKind, ComponentType<{ size?: number | string }>>> = {
  tough: StitchedWound,
  six_feet_under: Coffin,
  dragon_skin: ShoulderArmor,
  super_coward: PrayingHands,
  unbreakable: FourWounds,
  specialist: Quickdraw,
};
