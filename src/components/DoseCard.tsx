import React, { useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Fonts, FontWeights, Radius, Shadows, Spacing } from '../theme';
import { useUI } from '../context/UISettings';
import StatusBadge from './StatusBadge';
import { DoseLog } from '../db/queries';

interface Props {
  type: 'AM' | 'PM';
  scheduledTime: string;
  log: DoseLog | null;
  onMarkTaken: () => void;
  onMarkMissed: () => void;
  onMarkLate: () => void;
  disabled?: boolean;
}

export default function DoseCard({
  type,
  scheduledTime,
  log,
  onMarkTaken,
  onMarkMissed,
  onMarkLate,
  disabled = false,
}: Props) {
  const { fonts } = useUI();
  const styles = useMemo(() => makeStyles(fonts), [fonts]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [log]);

  const isLogged = !!log;
  const status = log?.status ?? 'pending';
  const icon = type === 'AM' ? 'partly-sunny-outline' : 'moon-outline';
  const label = type === 'AM' ? 'Dose du matin' : 'Dose du soir';

  // Liseré de statut sur le bord gauche (sobre, clinique).
  const accentColor =
    status === 'taken' ? Colors.taken :
    status === 'missed' ? Colors.missed :
    status === 'late' ? Colors.late :
    Colors.accent;

  return (
    <Animated.View style={[styles.card, Shadows.card, { opacity: fadeAnim }]}>
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

      <View style={styles.body}>
        {/* En-tête */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <View style={styles.iconCircle}>
              <Ionicons name={icon} size={fonts.lg} color={Colors.accent} />
            </View>
            <View>
              <Text style={styles.label}>{label}</Text>
              <Text style={styles.time}>Programmée à {scheduledTime}</Text>
            </View>
          </View>
          <StatusBadge status={status} size="md" />
        </View>

        {/* Actions */}
        {!isLogged && !disabled && (
          <View style={styles.actions}>
            <ActionButton
              fonts={fonts}
              icon="checkmark-circle-outline"
              label="Prise"
              color={Colors.taken}
              bg={Colors.takenDim}
              onPress={onMarkTaken}
            />
            <ActionButton
              fonts={fonts}
              icon="time-outline"
              label="En retard"
              color={Colors.late}
              bg={Colors.lateDim}
              onPress={onMarkLate}
            />
            <ActionButton
              fonts={fonts}
              icon="close-circle-outline"
              label="Manquée"
              color={Colors.missed}
              bg={Colors.missedDim}
              onPress={onMarkMissed}
            />
          </View>
        )}

        {isLogged && (
          <Text style={styles.loggedAt}>
            Enregistrée à {new Date(log!.logged_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}

        {!isLogged && disabled && (
          <View style={styles.deviceHint}>
            <Ionicons name="hardware-chip-outline" size={fonts.sm} color={Colors.textMuted} />
            <Text style={styles.deviceHintText}>
              À confirmer sur le distributeur
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

function ActionButton({
  fonts, icon, label, color, bg, onPress,
}: {
  fonts: Fonts; icon: keyof typeof Ionicons.glyphMap; label: string;
  color: string; bg: string; onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale }], flex: 1 }}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPressIn={() => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
        onPress={onPress}
        style={[btnStyles.actionBtn, { backgroundColor: bg }]}
      >
        <Ionicons name={icon} size={fonts.md} color={color} />
        <Text style={[btnStyles.actionBtnText, { color, fontSize: fonts.xs }]}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const btnStyles = StyleSheet.create({
  actionBtn: {
    borderRadius: Radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 4,
    minHeight: 60,
    justifyContent: 'center',
  },
  actionBtnText: {
    fontWeight: FontWeights.semibold,
  },
});

function makeStyles(f: Fonts) {
  return StyleSheet.create({
    card: {
      backgroundColor: Colors.bgCard,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: Colors.border,
      marginBottom: Spacing.md,
      flexDirection: 'row',
      overflow: 'hidden',
    },
    accentBar: {
      width: 5,
    },
    body: {
      flex: 1,
      padding: Spacing.lg,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.md,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      flexShrink: 1,
    },
    iconCircle: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: Colors.accentDim,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      fontSize: f.md,
      fontWeight: FontWeights.bold,
      color: Colors.textPrimary,
    },
    time: {
      fontSize: f.sm,
      color: Colors.textSecondary,
      marginTop: 2,
    },
    actions: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    loggedAt: {
      fontSize: f.sm,
      color: Colors.textMuted,
    },
    deviceHint: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
    },
    deviceHintText: {
      fontSize: f.sm,
      color: Colors.textMuted,
      fontStyle: 'italic',
    },
  });
}
