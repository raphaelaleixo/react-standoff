import { Box } from "@mui/material";
import { useId } from "react";

interface Props {
  lit: boolean;
  size?: number | string;
}

// Coastal-lookout lantern. The silhouette stays as a steady dim outline
// regardless of state; the lit/unlit signal is a radial-gradient glow
// placed BEHIND the silhouette so the light bleeds through the glass
// area between the frame bars.
//
// Original SVG art comes with a huge whitespace artboard; viewBox here
// is cropped to the actual lantern bounds (computed from the path).
const VIEW_BOX = "778 450 1114 1750";
const LANTERN_TRANSFORM = "matrix(0.13333333,0,0,-0.13333333,0,2673.4933)";
const LANTERN_D =
  "m 7982.88,4442.8 c 1393.01,7.2 2786.22,4.3 4179.42,5.3 12.3,-127.5 77.4,-252.4 188,-321.2 108.9,-64.2 237.7,-83.4 362.4,-86.1 2.2,-138.1 1,-276.3 0.4,-414.5 -805,5.2 -1609.9,1.7 -2414.9,2.1 -956.38,-1.6 -1912.53,3.1 -2868.88,-0.8 0.39,136.9 -0.19,273.8 -1.96,410.4 140.21,4.5 287.65,31.6 403.38,115.4 90.07,68.3 141.96,178.4 152.14,289.4 z m -400.04,553.6 c 1657.16,2.1 3314.36,-0.2 4971.66,1.5 2,-131.4 -0.8,-262.8 0.6,-394.3 -1228.7,1.5 -2457.4,0.5 -3685.77,-4 -428.44,7.3 -857.07,-2.7 -1285.51,-1.3 0.19,132.5 0.19,265.3 -0.98,398.1 m 4310.86,5505.4 c -102.9,-778.1 -206,-1556.1 -310.6,-2334.1 -111.6,-856.5 -220.9,-1713.5 -332.3,-2570 189.2,-0.4 378.3,2 567.3,-1.6 17,45.3 28.6,92.3 39.5,139.1 409.5,1586.2 805.8,3175.8 1202.7,4765.1 -388.9,5.6 -777.8,1.1 -1166.6,1.5 m -3036.32,0.2 c 203.45,-1636.4 422.37,-3270.6 635.02,-4905.9 384.58,-0.2 769.3,3 1153.9,-1.1 103.2,738.4 198.2,1478.1 296.7,2217.1 112.6,897.4 240.6,1792.9 347.5,2691.1 -811,-2 -1622.06,0 -2433.12,-1.2 M 8315.77,5594.4 c 193.26,1.1 386.33,2.7 579.6,1.1 -215.2,1635.9 -427.65,3272.1 -639.72,4908.3 -394.17,-4.5 -788.54,0 -1182.71,-3 411.41,-1636.2 826.14,-3271.6 1242.83,-4906.4 M 6501.37,10950 c 2379.71,1 4759.63,-2.7 7139.53,2.2 -422.8,-1679.9 -847.3,-3359.4 -1269.7,-5039.4 -61.4,-253.4 -134.9,-504.1 -191.5,-758.8 -1404.9,-4.7 -2809.68,-2.8 -4214.44,-2.6 -213.24,846.7 -434.31,1691.9 -647.55,2538.5 -271.4,1087 -550.82,2172 -816.34,3260.1 m 5971.93,649.5 c 549.4,-4.1 1098.7,5.9 1647.9,0.8 -10,-165 -3.7,-330.5 -4.9,-496 -2192.5,4 -4385.2,-1.9 -6577.91,0.6 -523.21,2 -1046.42,-4.9 -1569.63,1 9.98,164.9 5.48,329.9 6.07,494.8 2166.08,-1.8 4332.37,-1.8 6498.47,-1.2 m -3714.21,1862.8 c 853.15,3.9 1706.71,-5.3 2560.01,3.3 23.5,3.2 43.1,-12.3 64.1,-20.7 331.3,-153.7 666.3,-301 990.6,-470 375,-197.3 717.2,-478.7 928.3,-851.2 68.2,-115.5 114.8,-242 155.9,-369.5 -2261.8,3.2 -4523.86,1.6 -6785.69,-0.6 92.82,298.3 257.3,574.2 483.46,790.3 230.28,230.9 512.64,400.5 804.4,542.5 263.95,130 531.63,253.3 798.92,375.9 m 125.71,488.6 c 383.2,314.6 768.95,626.2 1156.3,935.7 385.7,-315.2 776,-625.4 1164.7,-937.1 -1.2,-110.4 -2.8,-220.9 0.9,-331.1 -773.8,-0.8 -1547.66,-4.1 -2321.32,1 1.18,110.4 3.33,221 -0.58,331.5 m 256.9,2108.3 c 419.04,416.3 1131.8,476.4 1620,147.2 283.9,-183.3 480.9,-487 553.5,-815.1 85.6,-389.5 -22.9,-814.6 -286.1,-1114.6 -74.6,73.2 -158.2,136.1 -242,198.2 155.9,175 243.6,407.4 246.5,641.4 6.3,306.9 -140.7,613.9 -388.3,796.8 -228.3,175.8 -536.5,237.7 -816.69,177 -198.94,-41.5 -378.31,-152.9 -517.53,-299 -183.87,-198.3 -283.34,-473.7 -262.78,-743.9 12.34,-211.7 96.14,-417.7 231.84,-580.2 -78.91,-64 -163.89,-120.8 -236.54,-192.5 -152.34,177.4 -256.12,396.6 -287.65,628.8 -67.55,417.5 78.13,864.3 385.75,1155.9";

// Glow placement, in viewBox units. Centered horizontally on the
// lantern (~1335), slightly above its vertical center to sit in the
// flame/glass area. Radius is large so the warm light fills most of
// the lantern interior when lit.
const GLASS_CX = 1335;
const GLASS_CY = 1430;
const GLASS_R = 780;

// Silhouette darkens when lit so the metal frame reads as a dark
// outline against the bright interior glow — but kept a few shades
// lighter than the widget background (palette.inkUp = #2a2118) so the
// frame doesn't disappear into the canvas. When unlit, a faint
// translucent white keeps it visible against the same background.
// Unlit silhouette uses inkUp (#2a2118) — the same fill the loot notes
// use for their body, so the dim lanterns read as the same family of
// objects sitting against the slightly-darker ink page background.
const SILHOUETTE_UNLIT = "#2a2118";
const SILHOUETTE_LIT = "rgba(0, 0, 0, 1)";
// Stroke along every sub-path edge. Unlit uses the same ruleStrong cream
// the loot notes use, which reads as a thin highlight on the dark inkUp
// body. Lit swaps to a dark warm amber so the line doesn't compete with
// the bright interior glow.
const STROKE_UNLIT = "rgba(237, 224, 196, 0.45)";
const STROKE_LIT = "rgba(50, 30, 12, 0.85)";

export function Lantern({ lit, size = 64 }: Props) {
  const id = useId();
  const gradId = `lantern-glow-${id.replace(/:/g, "")}`;
  return (
    <Box
      sx={{
        width: size,
        display: "inline-block",
        lineHeight: 0,
        overflow: "visible",
        filter: lit
          ? "drop-shadow(0 0 14px rgba(246, 198, 106, 0.45))"
          : "drop-shadow(0 0 0 rgba(246, 198, 106, 0))",
        transition: "filter 480ms ease",
      }}
    >
      <svg
        viewBox={VIEW_BOX}
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        style={{ overflow: "visible" }}
      >
        <defs>
          <radialGradient
            id={gradId}
            cx={GLASS_CX}
            cy={GLASS_CY}
            r={GLASS_R}
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="rgba(255, 240, 180, 1)" />
            <stop offset="45%" stopColor="rgba(248, 200, 110, 0.85)" />
            <stop offset="80%" stopColor="rgba(238, 160, 70, 0.25)" />
            <stop offset="100%" stopColor="rgba(238, 160, 70, 0)" />
          </radialGradient>
        </defs>
        {/* Glow sits BEHIND the silhouette so it bleeds through the
            empty glass area between the lantern frame bars. Always
            rendered — opacity drives the lit/unlit crossfade, so the
            light fades in/out rather than popping. */}
        <circle
          cx={GLASS_CX}
          cy={GLASS_CY}
          r={GLASS_R}
          fill={`url(#${gradId})`}
          style={{
            opacity: lit ? 1 : 0,
            transformOrigin: `${GLASS_CX}px ${GLASS_CY}px`,
            animation: lit
              ? "lanternFlicker 2400ms ease-in-out infinite alternate"
              : undefined,
            transition: "opacity 480ms ease",
          }}
        />
        <g transform={LANTERN_TRANSFORM}>
          <path
            d={LANTERN_D}
            fill={lit ? SILHOUETTE_LIT : SILHOUETTE_UNLIT}
            fillRule="nonzero"
            stroke={lit ? STROKE_LIT : STROKE_UNLIT}
            strokeWidth={1.25}
            vectorEffect="non-scaling-stroke"
            style={{ transition: "fill 480ms ease, stroke 480ms ease" }}
          />
        </g>
        <style>
          {`@keyframes lanternFlicker {
              from { opacity: 0.85; transform: scale(0.96); }
              to   { opacity: 1;    transform: scale(1.04); }
            }`}
        </style>
      </svg>
    </Box>
  );
}
