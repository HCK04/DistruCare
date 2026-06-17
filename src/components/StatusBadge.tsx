import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts, FontWeights, Radius, Spacing } from '../theme';
import { useUI } from '../context/UISettings';

type Status = 'taken' | 'missed' | 'late' | 'pending';

interface Props {
  status: Status;
  size?: 'sm' | 'md' | 'lg';
}

const statusConfig: Record<Status, { color: string; bg: string; label: string }> = {
  taken:   { color: Colors.taken,   bg: Colors.takenDim,  label: 'Prise'      },
  missed:  { color: Colors.missed,  bg: Colors.missedDim, label: 'Manquée'    },
  late:    { color: Colors.late,    bg: Colors.lateDim,   label: 'En retard'  },
  pending: { color: Colors.textSecondary, bg: Colors.bgCardAlt, label: 'En attente' },
};

export default function StatusBadge({ status, size = 'md' }: Props) {
  const { fonts } = useUI();
  const cfg = statusConfig[status];

  const sizeConfig = {
    sm: { fontSize: fonts.xs, px: Spacing.sm, py: 4,  radius: Radius.sm },
    md: { fontSize: fonts.sm, px: Spacing.md, py: 6,  radius: Radius.md },
    lg: { fontSize: fonts.md, px: Spacing.lg, py: 9,  radius: Radius.md },
  };
  const sz = sizeConfig[size];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: cfg.bg,
          paddingHorizontal: sz.px,
          paddingVertical: sz.py,
          borderRadius: sz.radius,
        },
      ]}
    >
      <Text style={[styles.label, { color: cfg.color, fontSize: sz.fontSize }]}>
        {cfg.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
  },
  label: {
    fontWeight: FontWeights.semibold,
  },
});
