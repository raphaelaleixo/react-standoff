import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box } from "@mui/material";
import { palette } from "../theme/colors";
import { fonts } from "../theme/typography";
import { PageCanvas } from "../components/shell/PageCanvas";
import { Masthead } from "../components/shell/Masthead";
import { Button } from "../components/shell/Button";
import { DenominationIcon } from "../components/icons/DenominationIcon";

// Broadside ballad. Masthead at the top, a small-caps dateline beneath, then a
// drop-cap lead paragraph and stacked sections separated by fleuron ornament
// rules. Iconography (reticle / bolt / dash for the hand; coin / disc / jewel
// for the hoard) borrows the same glyphs used in the in-game UI so the rules
// page reads like the same printed sheet the game lives on.
export default function HowToPlayPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Box sx={{ minHeight: "100vh", padding: "8px", boxSizing: "border-box" }}>
      <PageCanvas
        sx={{
          width: "min(760px, 100%)",
          margin: "0 auto",
          minHeight: "calc(100vh - 16px)",
        }}
      >
        <Masthead
          left="HOW TO PLAY"
          right="— a true ballad —"
          onLogoClick={() => navigate("/")}
        />

        {/* Dateline — the front-page strap on a broadside, bordered by paper
            rules top and bottom so it reads as a single bar of metadata. */}
        <Box
          sx={{
            borderBottom: `1px solid ${palette.rule}`,
            padding: "0.55rem 1.5rem 0.6rem",
            textAlign: "center",
            fontFamily: fonts.displayCaps,
            fontFeatureSettings: '"smcp"',
            fontSize: "0.78rem",
            letterSpacing: "0.32em",
            color: palette.paperFaint,
          }}
        >
          PRINTED FOR THE CAPTAIN'S CREW · IV–VI MATES · VIII ROUNDS · ONE HOARD
        </Box>

        <Box
          sx={{
            padding: { xs: "1.6rem 1.4rem 3rem", sm: "2.2rem 2.6rem 3.5rem" },
            flex: 1,
          }}
        >
          {/* Lead — full-width drop cap. The single piratical typographic
              flourish that announces "this be a broadside, not a help page". */}
          <Eyebrow>— a ballad to be sung at sea —</Eyebrow>
          <Lead>
            The captain be dead. His hoard be on the table, the navy be hours
            out. Eight rounds — each one a fresh chance to point a flintlock
            at a crewmate, see who flinches first, and take a cut o' the
            spoils.
          </Lead>

          <Ornament>the round in VI beats</Ornament>
          <PhaseList />

          <Ornament>what's in yer hand</Ornament>
          <HandTable />
          <Aside>— each card spent once across the eight rounds —</Aside>

          <Ornament>the hoard</Ornament>
          <HoardTable />
          <Aside>— five notes drawn each round, plus any carryover —</Aside>

          <Ornament>the reckoning</Ornament>
          <Body>
            At the eighth round's end, the richest mate still upright takes
            the day — counted in coin, less <Coin>$5,000</Coin> per yellow
            streak. Or, if a lone mate be left standin' before the eighth
            bell, the day be theirs at once.
          </Body>
          <Body sx={{ marginTop: "0.7rem" }}>
            <SmallCaps>Tied?</SmallCaps>{" "}
            most coin → fewest streaks → most wounds. The gritty survivor takes
            it.
          </Body>

          <Ornament>ship's notes</Ornament>
          <FinePrint>
            <li>
              Four to six mates per game. The captain hoists the colours at
              four; no new crew once they fly.
            </li>
            <li>
              A mate may yield even when no one be pointin' at 'em — sometimes
              ye burn a click to save yer powder for a richer round.
            </li>
            <li>
              Two mates quickdrew each other? Both eat a wound and lay down.
            </li>
            <li>
              Indivisible piles wait on the table — they roll into next round's
              split.
            </li>
          </FinePrint>
        </Box>

        <Box
          sx={{
            borderTop: `4px double ${palette.ruleStrong}`,
            padding: "1.5rem 2rem",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Button variant="ghost" onClick={() => navigate("/")}>
            {t("howToPlay.back").toUpperCase()}
          </Button>
        </Box>
      </PageCanvas>
    </Box>
  );
}

// ─── Atoms ────────────────────────────────────────────────────────────────

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        textAlign: "center",
        fontFamily: fonts.body,
        fontStyle: "italic",
        fontSize: "1rem",
        color: palette.paperDim,
        marginBottom: "0.9rem",
      }}
    >
      {children}
    </Box>
  );
}

// Lead paragraph with a blood-red drop-cap on the opening letter. Pure CSS
// `::first-letter` — no DOM surgery. Only used once, on the page lead.
function Lead({ children }: { children: string }) {
  return (
    <Box
      sx={{
        fontFamily: fonts.body,
        fontSize: "1.18rem",
        lineHeight: 1.55,
        color: palette.paper,
        textAlign: "justify",
        hyphens: "auto",
        "&::first-letter": {
          fontFamily: fonts.blackletter,
          fontSize: "5.4em",
          float: "left",
          lineHeight: 0.68,
          padding: "0 0.16em 0 0",
          marginTop: "-0.02em",
          color: palette.blood,
        },
      }}
    >
      {children}
    </Box>
  );
}

function Ornament({ children }: { children: string }) {
  return (
    <Box
      role="presentation"
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: "0.8rem",
        margin: "2.6rem 0 1.4rem",
        fontFamily: fonts.displayCaps,
        fontFeatureSettings: '"smcp"',
        fontSize: "0.95rem",
        letterSpacing: "0.32em",
        color: palette.paperDim,
      }}
    >
      <Box component="span" sx={{ color: palette.blood, fontSize: "1.05em" }}>
        ❦
      </Box>
      {children}
      <Box component="span" sx={{ color: palette.blood, fontSize: "1.05em" }}>
        ❦
      </Box>
    </Box>
  );
}

function Body({
  children,
  sx,
}: {
  children: React.ReactNode;
  sx?: object;
}) {
  return (
    <Box
      sx={{
        fontFamily: fonts.body,
        fontSize: "1.02rem",
        lineHeight: 1.55,
        color: palette.paper,
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

function Aside({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        textAlign: "center",
        fontFamily: fonts.body,
        fontStyle: "italic",
        fontSize: "0.95rem",
        color: palette.paperFaint,
        marginTop: "0.85rem",
      }}
    >
      {children}
    </Box>
  );
}

function SmallCaps({ children }: { children: React.ReactNode }) {
  return (
    <Box
      component="span"
      sx={{
        fontFamily: fonts.displayCaps,
        fontFeatureSettings: '"smcp"',
        fontSize: "0.9em",
        letterSpacing: "0.18em",
        color: palette.paper,
      }}
    >
      {children}
    </Box>
  );
}

// Coin amounts — slim small-caps treatment so $5,000 reads as a typeset
// figure, not a stray inline number.
function Coin({ children }: { children: React.ReactNode }) {
  return (
    <Box
      component="span"
      sx={{
        fontFamily: fonts.displayCaps,
        letterSpacing: "0.04em",
        color: palette.gold,
        fontWeight: 600,
      }}
    >
      {children}
    </Box>
  );
}

// ─── The six round beats ──────────────────────────────────────────────────

interface Phase {
  numeral: string;
  title: string;
  body: React.ReactNode;
}

const PHASES: Phase[] = [
  {
    numeral: "I",
    title: "Load & Aim",
    body: (
      <>
        On yer phone, pick a powder load and a mate to point at. Both choices
        stay hidden 'til the count. Change yer mind freely until ye tap{" "}
        <SmallCaps>ready</SmallCaps>.
      </>
    ),
  },
  {
    numeral: "II",
    title: "Standoff",
    body: (
      <>
        Three… two… one… <em>aim true.</em> Targets revealed on the big screen
        — point yer phone at the mate ye marked.
      </>
    ),
  },
  {
    numeral: "III",
    title: "Yield",
    body: (
      <>
        Any mate may yield — even one no one be aimin' at. Yielders take a
        yellow streak (<Coin>−$5,000</Coin> at day's end) and can't be shot.
        Aimers pointin' at a yielder discard their bullet too — the unwritten
        gangster rule.
      </>
    ),
  },
  {
    numeral: "IV",
    title: "Quickdraw",
    body: (
      <>
        Triple-loaded shots fire first. Yer mark eats a wound and lays down{" "}
        <em>before</em> they get a chance to shoot back.
      </>
    ),
  },
  {
    numeral: "V",
    title: "Shots",
    body: (
      <>
        Single shots resolve. <em>Click</em> means yer powder were wet — no
        harm. Three wounds and ye walk the plank: all yer cash forfeit to the
        box.
      </>
    ),
  },
  {
    numeral: "VI",
    title: "Split",
    body: (
      <>
        Mates still standin' share the loot. Whole coins only — indivisible
        piles wait for next round. Wounded mates get nothin' this round, but
        live to load again.
      </>
    ),
  },
];

function PhaseList() {
  return (
    <Box
      component="ol"
      sx={{
        listStyle: "none",
        margin: 0,
        padding: 0,
        display: "grid",
        gridTemplateColumns: "auto 1fr",
        columnGap: { xs: "1rem", sm: "1.4rem" },
        rowGap: "1.25rem",
      }}
    >
      {PHASES.map((p) => (
        <PhaseRow key={p.numeral} phase={p} />
      ))}
    </Box>
  );
}

function PhaseRow({ phase }: { phase: Phase }) {
  return (
    <>
      <Box
        component="li"
        sx={{
          fontFamily: fonts.blackletter,
          fontSize: "2.6rem",
          lineHeight: 0.82,
          color: palette.paperFaint,
          textAlign: "right",
          paddingTop: "0.05em",
          minWidth: "2.4rem",
          letterSpacing: "0.02em",
        }}
        aria-label={`Phase ${phase.numeral}`}
      >
        {phase.numeral}
      </Box>
      <Box>
        <Box
          sx={{
            fontFamily: fonts.displayCaps,
            fontFeatureSettings: '"smcp"',
            fontSize: "1rem",
            letterSpacing: "0.22em",
            color: palette.paper,
            marginBottom: "0.25rem",
          }}
        >
          {phase.title}
        </Box>
        <Box
          sx={{
            fontFamily: fonts.body,
            fontSize: "1.02rem",
            lineHeight: 1.5,
            color: palette.paper,
          }}
        >
          {phase.body}
        </Box>
      </Box>
    </>
  );
}

// ─── Hand + Hoard tables ──────────────────────────────────────────────────

function HandTable() {
  const rows = [
    { glyph: <DashGlyph />, count: "×5", name: "CLICK", flavor: "wet powder, no harm" },
    { glyph: <ReticleGlyph />, count: "×2", name: "SHOT", flavor: "one wound on the mark" },
    { glyph: <BoltGlyph />, count: "×1", name: "QUICKDRAW", flavor: "fires before any shot" },
  ];
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "auto auto auto 1fr",
        columnGap: { xs: "0.9rem", sm: "1.2rem" },
        rowGap: "0.85rem",
        alignItems: "center",
      }}
    >
      {rows.map((r) => (
        <ItemRow key={r.name} {...r} />
      ))}
    </Box>
  );
}

function HoardTable() {
  const rows = [
    { value: 5000 as const, count: "×15", name: "FIVE THOUSAND", flavor: "silver bit" },
    { value: 10000 as const, count: "×15", name: "TEN THOUSAND", flavor: "gold doubloon" },
    { value: 20000 as const, count: "×10", name: "TWENTY THOUSAND", flavor: "jeweled piece" },
  ];
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "auto auto auto 1fr",
        columnGap: { xs: "0.9rem", sm: "1.2rem" },
        rowGap: "0.85rem",
        alignItems: "center",
      }}
    >
      {rows.map((r) => (
        <ItemRow
          key={r.value}
          glyph={
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <DenominationIcon value={r.value} size={26} aria-label={r.name} />
            </Box>
          }
          count={r.count}
          name={r.name}
          flavor={r.flavor}
        />
      ))}
    </Box>
  );
}

interface ItemRowProps {
  glyph: React.ReactNode;
  count: string;
  name: string;
  flavor: string;
}

function ItemRow({ glyph, count, name, flavor }: ItemRowProps) {
  return (
    <>
      <Box
        sx={{
          width: "2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {glyph}
      </Box>
      <Box
        sx={{
          fontFamily: fonts.displayCaps,
          fontSize: "1.05rem",
          color: palette.paperDim,
          letterSpacing: "0.04em",
          minWidth: "1.7rem",
        }}
      >
        {count}
      </Box>
      <Box
        sx={{
          fontFamily: fonts.displayCaps,
          fontFeatureSettings: '"smcp"',
          fontSize: "0.95rem",
          letterSpacing: "0.22em",
          color: palette.paper,
          whiteSpace: "nowrap",
        }}
      >
        {name}
      </Box>
      <Box
        sx={{
          fontFamily: fonts.body,
          fontStyle: "italic",
          fontSize: "0.98rem",
          color: palette.paperDim,
        }}
      >
        — {flavor}
      </Box>
    </>
  );
}

// ─── Fine-print bullet list ───────────────────────────────────────────────

function FinePrint({ children }: { children: React.ReactNode }) {
  return (
    <Box
      component="ul"
      sx={{
        listStyle: "none",
        margin: 0,
        padding: 0,
        display: "flex",
        flexDirection: "column",
        gap: "0.7rem",
        "& li": {
          position: "relative",
          paddingLeft: "1.4rem",
          fontFamily: fonts.body,
          fontStyle: "italic",
          fontSize: "0.96rem",
          lineHeight: 1.5,
          color: palette.paperDim,
        },
        "& li::before": {
          content: '"✦"',
          position: "absolute",
          left: 0,
          top: 0,
          color: palette.blood,
          fontStyle: "normal",
          fontSize: "0.85em",
          lineHeight: 1.7,
        },
      }}
    >
      {children}
    </Box>
  );
}

// ─── Bullet-card glyphs ───────────────────────────────────────────────────
// Same shapes used on the in-game PowderCard. Inlined here so the rules page
// stays self-contained and the icons can be sized for a typographic row.

function ReticleGlyph() {
  return (
    <svg width={24} height={24} viewBox="0 0 20 20" aria-label="shot">
      <circle cx="10" cy="10" r="8" fill="none" stroke={palette.paper} strokeWidth={1.4} />
      <line x1="0.5" y1="10" x2="19.5" y2="10" stroke={palette.paper} strokeWidth={1.1} opacity={0.85} />
      <line x1="10" y1="0.5" x2="10" y2="19.5" stroke={palette.paper} strokeWidth={1.1} opacity={0.85} />
      <circle cx="10" cy="10" r="2" fill={palette.paper} />
    </svg>
  );
}

function BoltGlyph() {
  return (
    <svg width={20} height={28} viewBox="0 0 20 28" aria-label="quickdraw">
      <path d="M 13 0 L 3 14 L 9 14 L 7 28 L 17 14 L 11 14 Z" fill={palette.blood} />
    </svg>
  );
}

function DashGlyph() {
  return (
    <Box
      aria-label="click"
      sx={{
        fontFamily: fonts.body,
        fontSize: "1.6rem",
        lineHeight: 1,
        color: palette.paper,
        opacity: 0.55,
      }}
    >
      —
    </Box>
  );
}
