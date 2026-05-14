import { Box } from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Game } from '../../game/types';
import { palette } from '../../theme/colors';
import { fonts } from '../../theme/typography';

interface Props {
  game: Game;
}

// One-shot full-screen overlay that fires the first time
// Game.cop.reinforcementsRoundOnTheWay transitions from undefined to a
// number *during this mount*. ~3s linger; unmounts to null afterward.
// Pirate copy: "SAILS ON THE HORIZON" — the King's Navy is on its way.
//
// If we mount with reinforcements already on the way (e.g. a dev scenario
// pre-seeds a post-call state, or the page reloads mid-game), seed `shown`
// to true so the overlay does NOT replay — it's not "news" anymore.
export function ReinforcementsOverlay({ game }: Props) {
  const { t } = useTranslation();
  const round = game.cop?.reinforcementsRoundOnTheWay;
  const [shown, setShown] = useState(round !== undefined);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (round === undefined) return;
    if (shown) return;
    setShown(true);
    setActive(true);
    const id = window.setTimeout(() => setActive(false), 3000);
    return () => clearTimeout(id);
  }, [round, shown]);

  if (!active) return null;
  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(circle, ${palette.blood} 0%, ${palette.ink} 80%)`,
        animation: 'siren-wash 800ms ease-in-out infinite alternate',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        color: palette.paper,
        zIndex: 50,
        '@keyframes siren-wash': {
          from: { filter: 'hue-rotate(0deg)' },
          to: { filter: 'hue-rotate(20deg)' },
        },
      }}
    >
      <Box
        sx={{
          fontFamily: fonts.blackletter,
          fontSize: '5rem',
          lineHeight: 1,
          textShadow: `4px 4px 0 ${palette.inkDeep}`,
        }}
      >
        {t('cop.reinforcements.overlayTitle')}
      </Box>
      <Box
        sx={{
          fontFamily: fonts.body,
          fontStyle: 'italic',
          fontSize: '1.6rem',
          marginTop: '1.2rem',
          color: palette.paperDim,
        }}
      >
        {t('cop.reinforcements.overlaySub')}
      </Box>
    </Box>
  );
}
