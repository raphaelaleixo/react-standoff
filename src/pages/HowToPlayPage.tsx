import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Button, Container, Stack, Typography } from "@mui/material";

export default function HowToPlayPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Stack spacing={4}>
        <Typography variant="h2">{t("howToPlay.title")}</Typography>

        <Box>
          <Typography variant="h5" gutterBottom>The mutiny</Typography>
          <Typography>
            The captain is dead. His hoard is on the table. The navy is hours out. Eight rounds —
            each one a fresh chance to point a flintlock at a crewmate, see who flinches first, and
            take a cut of the spoils.
          </Typography>
        </Box>

        <Box>
          <Typography variant="h5" gutterBottom>Each round</Typography>
          <Typography component="div">
            <ol>
              <li><strong>Load &amp; aim.</strong> On yer phone, pick a powder load and a mate to point at.</li>
              <li><strong>Standoff.</strong> Three… two… one… aim true. Targets revealed.</li>
              <li><strong>Yield.</strong> Anyone aimed at can yield (and take a yellow streak). Yielded mates can't be shot.</li>
              <li><strong>Broadside!</strong> Triple-loaded shots hit first.</li>
              <li><strong>Shots.</strong> Single shots resolve. <em>Click</em> means yer powder was wet — no harm.</li>
              <li><strong>Split.</strong> Mates still standing divide the hoard. Whole coins only.</li>
            </ol>
          </Typography>
        </Box>

        <Box>
          <Typography variant="h5" gutterBottom>Winning</Typography>
          <Typography>
            Survive eight rounds with the most coin (minus $5,000 per yellow streak). Or be the last
            mate standing. Either way: ye walk away rich, or ye walk the plank.
          </Typography>
        </Box>

        <Button variant="outlined" onClick={() => navigate("/")}>
          {t("howToPlay.back")}
        </Button>
      </Stack>
    </Container>
  );
}
