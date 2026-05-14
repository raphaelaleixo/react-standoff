import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import type { Role } from '../../game/types';
import { palette } from '../../theme/colors';
import { fonts } from '../../theme/typography';

interface Props {
  role: Role;
  // Cop-only. Shows current 0/3 → 3/3 ✓ count.
  callsMade?: 0 | 1 | 2 | 3;
  // Cop-only. Free-form hint string (already translated).
  hint?: string;
  // When pressed, expand into a read-only modal/sheet.
  onTap?: () => void;
}

// Persistent corner widget for the phone — shows role + (for cop) the
// switchboard count and a per-round hint. Mafia-side is name-only.
export function RoleWidget({ role, callsMade, hint, onTap }: Props) {
  const { t } = useTranslation();
  const isCop = role === 'cop';
  return (
    <Box
      onClick={onTap}
      sx={{
        background: isCop ? palette.ink : palette.bloodDeep,
        border: `2px solid ${palette.paper}`,
        boxShadow: `3px 3px 0 ${palette.inkDeep}`,
        padding: '0.5rem 0.8rem',
        cursor: onTap ? 'pointer' : 'default',
        color: palette.paper,
        minWidth: '6rem',
      }}
    >
      <Box sx={{ fontFamily: fonts.displayCaps, fontSize: '0.9rem', letterSpacing: '0.15em' }}>
        {isCop ? t('cop.widget.cop') : t('cop.widget.mafia')}
      </Box>
      {isCop && callsMade !== undefined && (
        <Box sx={{ fontFamily: fonts.body, fontSize: '0.85rem', marginTop: '0.2rem' }}>
          {callsMade === 3 ? t('cop.widget.callsDone') : t('cop.widget.calls', { n: callsMade })}
        </Box>
      )}
      {isCop && hint && (
        <Box
          sx={{
            fontFamily: fonts.body,
            fontStyle: 'italic',
            fontSize: '0.75rem',
            marginTop: '0.2rem',
            color: palette.paperDim,
          }}
        >
          {hint}
        </Box>
      )}
    </Box>
  );
}
