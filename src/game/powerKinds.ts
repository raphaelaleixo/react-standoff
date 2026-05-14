import type { PowerKind } from './types';

export const POWER_KINDS: PowerKind[] = [
  'six_feet_under',
  'unbreakable',
  'dragon_skin',
  'super_coward',
  'specialist',
  'tough',
  'insane',
  'the_kid',
  'the_cunning',
];

// Powers whose mechanic is public knowledge from the moment they're dealt.
// Dead Eye (Kid) and Bloodhound (Cunning) change the visible commit flow —
// the big-screen UI splits commits into two phases when these are in play,
// so hiding the card backs makes no sense. Revealed-on-deal.
export const PUBLIC_POWER_KINDS: ReadonlySet<PowerKind> = new Set([
  'the_kid',
  'the_cunning',
]);
