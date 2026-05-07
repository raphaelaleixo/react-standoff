import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box } from "@mui/material";
import { palette } from "../theme/colors";
import { fonts } from "../theme/typography";
import { PageCanvas } from "../components/shell/PageCanvas";
import { Masthead } from "../components/shell/Masthead";
import { Button } from "../components/shell/Button";

// 2-column broadside ballad. Masthead at the top, four sections in a 1fr 1fr
// grid bordered by the same double-rule treatment as the in-game shell, and a
// ghost back button at the foot. The first section gets a drop-cap on its
// opening letter — the small piratical flourish that says "this is a
// broadside, not a help page".
export default function HowToPlayPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <Box sx={{ minHeight: "100vh", padding: "8px", boxSizing: "border-box" }}>
      <PageCanvas
        sx={{
          width: "min(960px, 100%)",
          margin: "0 auto",
          minHeight: "calc(100vh - 16px)",
        }}
      >
        <Masthead left="HOW TO PLAY" right="— a true ballad —" />
        <Box
          sx={{
            padding: "1.5rem 2rem",
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            gap: "1.5rem",
            borderTop: `4px double ${palette.ruleStrong}`,
            borderBottom: `4px double ${palette.ruleStrong}`,
            flex: 1,
          }}
        >
          <Section title="The mutiny">
            <DropCap>
              The captain is dead. His hoard is on the table. The navy is hours out. Eight rounds — each one a fresh chance to point a flintlock at a crewmate, see who flinches first, and take a cut of the spoils.
            </DropCap>
          </Section>
          <Section title="Each round">
            <Box component="ol" sx={{ paddingLeft: "1.1rem", margin: 0, lineHeight: 1.55 }}>
              <li>
                <strong>Load &amp; aim.</strong> On yer phone, pick a powder load and a mate to point at.
              </li>
              <li>
                <strong>Standoff.</strong> Three… two… one… aim true. Targets revealed.
              </li>
              <li>
                <strong>Yield.</strong> Anyone aimed at can yield (and take a yellow streak). Yielded mates can't be shot.
              </li>
              <li>
                <strong>Quickdraw!</strong> Triple-loaded shots hit first.
              </li>
              <li>
                <strong>Shots.</strong> Single shots resolve. <em>Click</em> means yer powder were wet — no harm.
              </li>
              <li>
                <strong>Split.</strong> Mates still standing divide the hoard. Whole coins only.
              </li>
            </Box>
          </Section>
          <Section title="Winning">
            Survive eight rounds with the most coin (minus $5,000 per yellow streak). Or be the last mate standing. Either way: ye walk away rich, or ye walk the plank.
          </Section>
          <Section title="The crew">
            Four to six mates per game. Each picks a flag and a nickname. Once the captain hoists the colours, no new crew can join.
          </Section>
        </Box>
        <Box sx={{ padding: "1.5rem 2rem", display: "flex", justifyContent: "center" }}>
          <Button variant="ghost" onClick={() => navigate("/")}>
            {t("howToPlay.back").toUpperCase()}
          </Button>
        </Box>
      </PageCanvas>
    </Box>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box>
      <Box
        sx={{
          fontFamily: fonts.displayCaps,
          fontFeatureSettings: '"smcp"',
          fontSize: "1rem",
          letterSpacing: "0.18em",
          marginBottom: "0.45rem",
          color: palette.paper,
        }}
      >
        {title}
      </Box>
      <Box
        sx={{
          fontFamily: fonts.body,
          fontSize: "0.95rem",
          lineHeight: 1.55,
          color: palette.paper,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

// Drop-cap on the first letter of the first paragraph — pure CSS, no DOM
// surgery. Used once on the lead section's opening sentence.
function DropCap({ children }: { children: string }) {
  return (
    <Box
      sx={{
        "&::first-letter": {
          fontFamily: fonts.displayCaps,
          fontFeatureSettings: '"smcp"',
          fontSize: "3.4em",
          float: "left",
          lineHeight: 0.85,
          padding: "0.05em 0.18em 0 0",
          color: palette.blood,
        },
      }}
    >
      {children}
    </Box>
  );
}
