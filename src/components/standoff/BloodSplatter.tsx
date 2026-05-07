import { useMemo } from "react";
import { palette } from "../../theme/colors";

const DEEP = "rgba(124, 25, 22, 0.88)";
const MID = "rgba(180, 40, 32, 0.78)";

// Pre-drawn smooth-irregular blob templates, each ~20x20 around (10,10).
// generate() composes splatter scenes by translating, scaling, and rotating
// these so the result still has organic curves rather than a procedural
// polygon look.
const BLOB_PATHS = [
  "M 10,2 C 16,3 18,8 16,13 C 18,17 12,19 8,17 C 3,18 1,13 4,9 C 2,5 6,2 10,2 Z",
  "M 10,1 C 14,2 19,5 18,11 C 17,16 11,19 6,17 C 1,16 1,9 4,5 C 6,2 8,1 10,1 Z",
  "M 8,3 C 13,2 18,4 19,9 C 20,14 14,19 9,18 C 3,17 1,12 3,7 C 4,4 5,3 8,3 Z",
  "M 11,2 C 16,4 19,9 17,14 C 14,18 8,19 4,15 C 1,11 3,5 7,3 C 9,2 10,2 11,2 Z",
  "M 9,2 C 15,1 19,7 16,12 C 19,16 13,20 7,18 C 2,16 1,10 3,6 C 5,3 7,2 9,2 Z",
];

function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface SatelliteBlob {
  path: string;
  cx: number;
  cy: number;
  scale: number;
  rotate: number;
  shade: string;
}

interface Drop {
  cx: number;
  cy: number;
  r: number;
  shade: string;
  opacity: number;
}

interface Streak {
  d: string;
  shade: string;
  width: number;
}

interface Scene {
  centralPath: string;
  centralCx: number;
  centralCy: number;
  centralScale: number;
  centralRotate: number;
  blobs: SatelliteBlob[];
  drops: Drop[];
  streaks: Streak[];
}

function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)];
}

function generate(seed: string): Scene {
  const rng = mulberry32(hashString(seed));

  const centralPath = pick(rng, BLOB_PATHS);
  const centralCx = 44 + rng() * 12;
  const centralCy = 44 + rng() * 12;
  const centralScale = 2.0 + rng() * 0.9;
  const centralRotate = rng() * 360;

  const blobCount = 5 + Math.floor(rng() * 3); // 5–7
  const blobs: SatelliteBlob[] = [];
  for (let i = 0; i < blobCount; i++) {
    blobs.push({
      path: pick(rng, BLOB_PATHS),
      cx: 8 + rng() * 84,
      cy: 8 + rng() * 84,
      scale: 0.25 + rng() * 0.4,
      rotate: rng() * 360,
      shade: rng() < 0.55 ? DEEP : MID,
    });
  }

  const dropCount = 10 + Math.floor(rng() * 8); // 10–17
  const drops: Drop[] = [];
  for (let i = 0; i < dropCount; i++) {
    const r = 0.6 + rng() * 1.9;
    const v = rng();
    const shade = v < 0.35 ? palette.blood : v < 0.65 ? MID : DEEP;
    drops.push({
      cx: rng() * 100,
      cy: rng() * 100,
      r,
      shade,
      opacity: 0.55 + rng() * 0.45,
    });
  }

  const streakCount = 1 + Math.floor(rng() * 3); // 1–3
  const streaks: Streak[] = [];
  for (let i = 0; i < streakCount; i++) {
    const x1 = 35 + rng() * 30;
    const y1 = 35 + rng() * 30;
    const angle = rng() * Math.PI * 2;
    const length = 18 + rng() * 22;
    const x2 = x1 + Math.cos(angle) * length;
    const y2 = y1 + Math.sin(angle) * length;
    const mx = (x1 + x2) / 2 + (rng() - 0.5) * 18;
    const my = (y1 + y2) / 2 + (rng() - 0.5) * 18;
    streaks.push({
      d: `M ${x1.toFixed(1)},${y1.toFixed(1)} Q ${mx.toFixed(1)},${my.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)}`,
      shade: rng() < 0.5 ? DEEP : MID,
      width: 0.7 + rng() * 0.9,
    });
  }

  return { centralPath, centralCx, centralCy, centralScale, centralRotate, blobs, drops, streaks };
}

interface BloodSplatterProps {
  /** A stable string per instance — drives the procedural pattern so each
   *  player's roundel gets its own splatter shape. */
  seed?: string;
}

// Inline-SVG procedural blood splatter. Each scene is generated once per
// `seed` via a tiny seeded PRNG (mulberry32) so renders are stable across
// re-mounts but vary cleanly between players.
export function BloodSplatter({ seed = "" }: BloodSplatterProps) {
  const scene = useMemo(() => generate(seed), [seed]);
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%", overflow: "visible", display: "block" }}
    >
      <g
        transform={`translate(${scene.centralCx.toFixed(1)} ${scene.centralCy.toFixed(1)}) rotate(${scene.centralRotate.toFixed(1)}) scale(${scene.centralScale.toFixed(2)}) translate(-10 -10)`}
      >
        <path d={scene.centralPath} fill={DEEP} />
      </g>
      {scene.blobs.map((b, i) => (
        <g
          key={`b${i}`}
          transform={`translate(${b.cx.toFixed(1)} ${b.cy.toFixed(1)}) rotate(${b.rotate.toFixed(1)}) scale(${b.scale.toFixed(2)}) translate(-10 -10)`}
        >
          <path d={b.path} fill={b.shade} />
        </g>
      ))}
      {scene.drops.map((d, i) => (
        <circle
          key={`d${i}`}
          cx={d.cx.toFixed(1)}
          cy={d.cy.toFixed(1)}
          r={d.r.toFixed(1)}
          fill={d.shade}
          fillOpacity={d.opacity}
        />
      ))}
      {scene.streaks.map((s, i) => (
        <path
          key={`s${i}`}
          d={s.d}
          stroke={s.shade}
          strokeWidth={s.width.toFixed(1)}
          strokeLinecap="round"
          fill="none"
        />
      ))}
    </svg>
  );
}
