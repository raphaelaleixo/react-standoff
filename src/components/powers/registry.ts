import type { PowerKind } from '../../game/types';

export interface PowerCardDef {
  kind: PowerKind;
  nameKey: string;
  descriptionKey: string;
}

export { POWER_KINDS } from '../../game/powerKinds';

export const POWER_REGISTRY: Record<PowerKind, PowerCardDef> = {
  six_feet_under: {
    kind: 'six_feet_under',
    nameKey: 'powers.cards.six_feet_under.name',
    descriptionKey: 'powers.cards.six_feet_under.description',
  },
  unbreakable: {
    kind: 'unbreakable',
    nameKey: 'powers.cards.unbreakable.name',
    descriptionKey: 'powers.cards.unbreakable.description',
  },
  dragon_skin: {
    kind: 'dragon_skin',
    nameKey: 'powers.cards.dragon_skin.name',
    descriptionKey: 'powers.cards.dragon_skin.description',
  },
  super_coward: {
    kind: 'super_coward',
    nameKey: 'powers.cards.super_coward.name',
    descriptionKey: 'powers.cards.super_coward.description',
  },
  specialist: {
    kind: 'specialist',
    nameKey: 'powers.cards.specialist.name',
    descriptionKey: 'powers.cards.specialist.description',
  },
  tough: {
    kind: 'tough',
    nameKey: 'powers.cards.tough.name',
    descriptionKey: 'powers.cards.tough.description',
  },
  insane: {
    kind: 'insane',
    nameKey: 'powers.cards.insane.name',
    descriptionKey: 'powers.cards.insane.description',
  },
  the_kid: {
    kind: 'the_kid',
    nameKey: 'powers.cards.the_kid.name',
    descriptionKey: 'powers.cards.the_kid.description',
  },
  the_cunning: {
    kind: 'the_cunning',
    nameKey: 'powers.cards.the_cunning.name',
    descriptionKey: 'powers.cards.the_cunning.description',
  },
};
