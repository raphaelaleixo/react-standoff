import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { Role } from '../../game/types';
import { palette } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { Button } from '../shell/Button';

interface Props {
  role: Role;
  onAcknowledge: () => void;
}

// Phone full-screen, one-time role flip shown to each player before
// round 1 commit starts. Privateer / Pirate copy. Tap to acknowledge.
export function RoleRevealScreen({ role, onAcknowledge }: Props) {
  const { t } = useTranslation();
  const isCop = role === 'cop';
  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1.4rem',
        padding: '1.6rem',
        background: isCop ? palette.ink : palette.bloodDeep,
      }}
    >
      <Box
        sx={{
          fontFamily: fonts.displayCaps,
          fontFeatureSettings: '"smcp"',
          fontSize: '0.9rem',
          letterSpacing: '0.4em',
          color: palette.paperDim,
        }}
      >
        {t('cop.reveal.title')}
      </Box>
      <Box
        sx={{
          fontFamily: fonts.blackletter,
          fontSize: '2.6rem',
          lineHeight: 1.05,
          textAlign: 'center',
          color: palette.paper,
        }}
      >
        {isCop ? t('cop.reveal.cop') : t('cop.reveal.mafia')}
      </Box>
      <Box
        sx={{
          fontFamily: fonts.body,
          fontStyle: 'italic',
          fontSize: '1.05rem',
          textAlign: 'center',
          color: palette.paperDim,
          maxWidth: '24rem',
        }}
      >
        {isCop ? t('cop.reveal.copBody') : t('cop.reveal.mafiaBody')}
      </Box>
      <Button variant="primary" emphasis onClick={onAcknowledge}>
        {t('cop.reveal.ack').toUpperCase()}
      </Button>
    </Box>
  );
}
