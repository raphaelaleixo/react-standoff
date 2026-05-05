import type { Game } from "../game/types";

export const countAlive = (g: Game): number =>
  g.players.filter(p => p.status === "alive").length;

export const countYielded = (g: Game): number =>
  Object.values(g.round.commits).filter(c => c?.withdrew).length;

export const countDead = (g: Game): number =>
  g.players.filter(p => p.status === "dead").length;
