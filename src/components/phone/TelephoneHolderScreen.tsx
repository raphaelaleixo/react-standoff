import { Box } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { palette } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { Button } from '../shell/Button';

interface Props {
  isCop: boolean;
  // Whether this holder is the last in the pass order. Unused by current
  // UI but exposed for future tweaks (e.g. label change for last holder).
  isLastHolder: boolean;
  onPass: () => void;
  // Fires when the user taps CALL/Send. For mafia (isCop=false), the
  // parent should ignore this — or this component can no-op it itself
  // (we pick the latter to keep parent wiring uniform).
  onCall: () => void;
}

// Phone full-screen for the current bottle-holder. Same shape for cop
// and pirate — the Send button is a decoy social-bluff prop for pirates
// (taps are inert). Cop taps Send → 1.2s "Note slipped" confirmation →
// auto-pass.
export function TelephoneHolderScreen({ isCop, onPass, onCall }: Props) {
  const { t } = useTranslation();
  const [callPlaced, setCallPlaced] = useState(false);

  const handleCallTap = () => {
    if (!isCop) {
      // Decoy — no engine effect. (The Button visual handles its own
      // press feedback; nothing else happens.)
      return;
    }
    if (callPlaced) return;
    setCallPlaced(true);
    onCall();
    // Brief private confirmation; auto-pass after ~1.2s.
    window.setTimeout(() => {
      onPass();
    }, 1200);
  };

  if (callPlaced) {
    return (
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          background: palette.ink,
          color: palette.paper,
          textAlign: 'center',
          fontFamily: fonts.blackletter,
          fontSize: '2rem',
          animation: 'callPlaced 1200ms ease-out',
          '@keyframes callPlaced': {
            from: { opacity: 0, transform: 'scale(0.96)' },
            to: { opacity: 1, transform: 'scale(1)' },
          },
        }}
      >
        {t('cop.telephone.callPlaced')}
      </Box>
    );
  }

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
        background: palette.ink,
      }}
    >
      <Box
        sx={{
          fontFamily: fonts.displayCaps,
          fontFeatureSettings: '"smcp"',
          fontSize: '1.1rem',
          letterSpacing: '0.3em',
          color: palette.paper,
        }}
      >
        {t('cop.telephone.heading')}
      </Box>
      <Button variant="primary" emphasis onClick={onPass}>
        {t('cop.telephone.pass').toUpperCase()}
      </Button>
      <Button variant="ghost" onClick={handleCallTap}>
        {t('cop.telephone.call').toUpperCase()}
      </Button>
    </Box>
  );
}
