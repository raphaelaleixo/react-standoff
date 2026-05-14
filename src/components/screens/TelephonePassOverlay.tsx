import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { Game } from '../../game/types';
import { palette } from '../../theme/colors';
import { fonts } from '../../theme/typography';

interface Props {
  game: Game;
  // Optional anchor for positioning the token next to a specific player's
  // character card. If not supplied, falls back to centered.
  anchorFor?: (playerId: string) => { x: number; y: number } | null;
}

// Big-screen overlay for the telephone (bottle) pass beat. Reads the
// per-round telephone state and renders the bottle token either:
//   - at the current holder's character card while the pass is in progress, or
//   - face-up at table center after the pass finalises (showing used/not-used).
export function TelephonePassOverlay({ game, anchorFor }: Props) {
  const { t } = useTranslation();
  if (game.round.phase !== 'telephone') return null;
  const tel = game.round.telephone;
  if (!tel) return null;  // Awaiting init effect.

  const currentHolderId = tel.currentHolderId;
  const finalised = !currentHolderId;
  const finalUsed = finalised ? tel.used : undefined;
  const anchor = currentHolderId && anchorFor ? anchorFor(currentHolderId) : null;

  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 30,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          left: anchor ? `${anchor.x}px` : '50%',
          top: anchor ? `${anchor.y}px` : '50%',
          transform: 'translate(-50%, -50%)',
          transition: 'left 360ms ease, top 360ms ease',
          width: 96,
          height: 140,
          background: finalUsed === true ? palette.paper : palette.inkUp,
          border: `3px solid ${palette.paper}`,
          boxShadow: `4px 4px 0 ${palette.inkDeep}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: fonts.displayCaps,
          fontSize: '0.7rem',
          letterSpacing: '0.16em',
          color: finalUsed === true ? palette.ink : palette.paper,
          textAlign: 'center',
          padding: '0.5rem',
          animation: !finalised ? 'bottlePulse 1400ms ease-in-out infinite' : undefined,
          '@keyframes bottlePulse': {
            '0%, 100%': { transform: 'translate(-50%, -50%) scale(1)' },
            '50%': { transform: 'translate(-50%, -50%) scale(1.06)' },
          },
        }}
      >
        {finalUsed === true && t('cop.telephone.used')}
        {finalUsed === false && t('cop.telephone.notUsed')}
      </Box>
    </Box>
  );
}
