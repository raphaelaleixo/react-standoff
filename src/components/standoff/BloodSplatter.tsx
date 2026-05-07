import { palette } from "../../theme/colors";

const DEEP = "rgba(124, 25, 22, 0.88)";
const MID = "rgba(180, 40, 32, 0.78)";

// Inline-SVG blood splatter for the struck roundel halo. Drawn against a
// 100x100 viewBox: an irregular central pool plus a handful of satellite
// blobs, droplets, and drip streaks at varying sizes and rotations so the
// pattern reads organically rather than as a CSS-gradient halo.
//
// `preserveAspectRatio="xMidYMid slice"` + `overflow: visible` lets the
// SVG fill its container while the outermost specks bleed past the
// nominal 100x100 viewport.
export function BloodSplatter() {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "100%", overflow: "visible", display: "block" }}
    >
      {/* Central irregular pool */}
      <path
        d="M 50,38 C 36,34 28,48 38,57 C 26,62 32,76 44,70 C 46,80 60,80 64,70 C 76,75 80,60 70,55 C 78,44 66,34 56,42 C 56,30 48,30 50,38 Z"
        fill={DEEP}
      />
      {/* Mid-size satellite blobs */}
      <ellipse cx="22" cy="32" rx="7" ry="4.5" fill={DEEP} transform="rotate(22 22 32)" />
      <ellipse cx="80" cy="28" rx="6" ry="4" fill={MID} transform="rotate(-30 80 28)" />
      <ellipse cx="26" cy="80" rx="8" ry="5" fill={DEEP} transform="rotate(40 26 80)" />
      <ellipse cx="82" cy="74" rx="5.5" ry="3.5" fill={MID} transform="rotate(-18 82 74)" />
      <ellipse cx="50" cy="18" rx="4.5" ry="3" fill={MID} transform="rotate(8 50 18)" />
      <ellipse cx="48" cy="88" rx="6" ry="3.5" fill={MID} transform="rotate(-12 48 88)" />
      {/* Smaller droplets */}
      <circle cx="12" cy="50" r="1.8" fill={DEEP} />
      <circle cx="88" cy="48" r="2.2" fill={MID} />
      <circle cx="38" cy="14" r="1.4" fill={MID} />
      <circle cx="64" cy="92" r="1.7" fill={DEEP} />
      <circle cx="18" cy="22" r="1.1" fill={palette.blood} fillOpacity={0.6} />
      <circle cx="86" cy="86" r="1.4" fill={palette.blood} fillOpacity={0.65} />
      <circle cx="10" cy="68" r="0.9" fill={palette.blood} fillOpacity={0.55} />
      <circle cx="92" cy="14" r="1.1" fill={palette.blood} fillOpacity={0.55} />
      <circle cx="6" cy="40" r="0.8" fill={palette.blood} fillOpacity={0.5} />
      <circle cx="74" cy="6" r="0.9" fill={palette.blood} fillOpacity={0.55} />
      <circle cx="3" cy="90" r="0.7" fill={palette.blood} fillOpacity={0.5} />
      <circle cx="96" cy="62" r="0.8" fill={palette.blood} fillOpacity={0.55} />
      {/* Drip streaks */}
      <path
        d="M 50,55 Q 52,72 47,90"
        stroke={DEEP}
        strokeWidth={1.4}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 60,50 Q 75,55 90,52"
        stroke={MID}
        strokeWidth={1.1}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 40,52 Q 28,55 14,52"
        stroke={MID}
        strokeWidth={1}
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
