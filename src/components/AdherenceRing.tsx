import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, FontWeights } from '../theme';
import { useUI } from '../context/UISettings';

interface Props {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
}

export default function AdherenceRing({
  percentage,
  size = 120,
  strokeWidth = 10,
  label = 'Observance',
}: Props) {
  const { fonts } = useUI();
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: percentage,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [percentage]);

  const color =
    percentage >= 80 ? Colors.taken :
    percentage >= 50 ? Colors.late :
    Colors.missed;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Anneau de fond */}
      <View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: Colors.bgCardAlt,
          },
        ]}
      />
      {/* Arc coloré (approximation via bordure) */}
      <View
        style={[
          styles.ring,
          styles.colorRing,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: strokeWidth,
            borderColor: color,
            opacity: percentage > 0 ? 1 : 0.2,
          },
        ]}
      />
      {/* Texte central */}
      <View style={styles.centre}>
        <Text style={[styles.percent, { color, fontSize: size * 0.22 }]}>
          {percentage}%
        </Text>
        <Text style={[styles.label, { fontSize: fonts.xs }]}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
  },
  colorRing: {
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    transform: [{ rotate: '-45deg' }],
  },
  centre: {
    alignItems: 'center',
  },
  percent: {
    fontWeight: FontWeights.bold,
  },
  label: {
    color: Colors.textSecondary,
    fontWeight: FontWeights.medium,
  },
});
