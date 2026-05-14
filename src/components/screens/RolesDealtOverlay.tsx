import { Box } from '@mui/material';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { palette } from '../../theme/colors';
import { fonts } from '../../theme/typography';

interface Props {
  visible: boolean;
  onDone: () => void;
  acknowledgedCount: number;
  totalCount: number;
}

const HOLD_MS = 2400;

// One-shot full-screen overlay shown at round 1 commit entry when the
// cop variant is on. The parent page controls `visible` and calls
// `onDone` when the overlay finishes. The overlay dismisses early once
// all phones have acknowledged their role card, or after a max hold.
export function RolesDealtOverlay({ visible, onDone, acknowledgedCount, totalCount }: Props) {
  const { t } = useTranslation();
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!visible) {
      setActive(false);
      return;
    }
    setActive(true);
    // Auto-dismiss once all phones have acknowledged OR after a max hold.
    if (acknowledgedCount >= totalCount && totalCount > 0) {
      const id = window.setTimeout(() => {
        setActive(false);
        onDone();
      }, 600);
      return () => clearTimeout(id);
    }
    const id = window.setTimeout(() => {
      setActive(false);
      onDone();
    }, HOLD_MS * 2);
    return () => clearTimeout(id);
  }, [visible, acknowledgedCount, totalCount, onDone]);

  if (!active) return null;
  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        background: palette.ink,
        opacity: 0.94,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        zIndex: 40,
      }}
    >
      <Box
        sx={{
          fontFamily: fonts.blackletter,
          fontSize: '4rem',
          color: palette.paper,
        }}
      >
        {t('cop.reveal.allDealt')}
      </Box>
      <Box
        sx={{
          fontFamily: fonts.displayCaps,
          fontFeatureSettings: '"smcp"',
          fontSize: '1rem',
          letterSpacing: '0.3em',
          color: palette.paperDim,
          marginTop: '1.6rem',
        }}
      >
        {acknowledgedCount} / {totalCount}
      </Box>
    </Box>
  );
}
