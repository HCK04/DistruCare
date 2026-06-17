import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Fonts, FontWeights, Radius, Shadows, Spacing } from '../theme';
import { useUI } from '../context/UISettings';
import { useSchedule } from '../hooks/useSchedule';
import { useTodayLogs } from '../hooks/useLogs';
import DoseCard from '../components/DoseCard';
import AdherenceRing from '../components/AdherenceRing';
import HardwareStatusBar from '../hardware/HardwareStatusBar';
import { useHardware } from '../hardware/HardwareContext';
import { getAdherenceStats } from '../db/queries';
import { getNextDoseInfo, formatTime, timeStringToDate, formatDayLabel } from '../utils/dateHelpers';

export default function DashboardScreen() {
  const { fonts, largeText, toggleLargeText } = useUI();
  const styles = useMemo(() => makeStyles(fonts), [fonts]);
  const { schedule, loading: schedLoading, reload: reloadSchedule } = useSchedule();
  const { logs, reload: reloadLogs, logDose, getLogForType } = useTodayLogs();
  const { lastEvent } = useHardware();
  const prevHwEvent = useRef<typeof lastEvent>(null);
  const [stats, setStats] = useState({ percentage: 0, taken: 0, missed: 0, late: 0, total: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [countdown, setCountdown] = useState('');
  const [nextLabel, setNextLabel] = useState('');
  const [nextTime, setNextTime] = useState('');

  // Enregistrement automatique lorsqu'on appuie sur le bouton du distributeur.
  useEffect(() => {
    if (!lastEvent || lastEvent === prevHwEvent.current) return;
    prevHwEvent.current = lastEvent;
    if (lastEvent.evt === 'confirmed' && (lastEvent.type === 'AM' || lastEvent.type === 'PM')) {
      logDose(lastEvent.type, 'taken');
      const t = lastEvent.type === 'AM' ? 'du matin' : 'du soir';
      Alert.alert('Prise confirmée', `La dose ${t} a été enregistrée automatiquement depuis le distributeur.`);
    }
  }, [lastEvent, logDose]);

  const greetFade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(greetFade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, []);

  const loadStats = async () => {
    const s = await getAdherenceStats(30);
    setStats(s);
  };

  useEffect(() => { loadStats(); }, [logs]);

  useEffect(() => {
    if (!schedule) return;
    const update = () => {
      const info = getNextDoseInfo(schedule.am_time, schedule.pm_time);
      setNextLabel(info.label);
      setNextTime(info.time);
      setCountdown(info.countdown);
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [schedule]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([reloadSchedule(), reloadLogs(), loadStats()]);
    setRefreshing(false);
  };

  const amLog = getLogForType('AM');
  const pmLog = getLogForType('PM');

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Bonjour';
    if (h < 18) return 'Bon après-midi';
    return 'Bonsoir';
  })();

  if (schedLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Chargement…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />
        }
      >
        {/* En-tête */}
        <Animated.View style={[styles.header, { opacity: greetFade }]}>
          <View style={{ flexShrink: 1 }}>
            <Text style={styles.greeting}>{greeting}</Text>
            <Text style={styles.today}>{formatDayLabel(new Date())}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={toggleLargeText}
              style={[styles.eyeBtn, largeText && styles.eyeBtnActive]}
              activeOpacity={0.7}
              accessibilityLabel="Activer ou désactiver les gros caractères"
            >
              <Ionicons
                name={largeText ? 'eye' : 'eye-outline'}
                size={fonts.lg}
                color={largeText ? Colors.accent : Colors.textSecondary}
              />
            </TouchableOpacity>
            <HardwareStatusBar />
          </View>
        </Animated.View>

        {/* Médicament */}
        <View style={styles.medRow}>
          <Ionicons name="medical-outline" size={fonts.md} color={Colors.accent} />
          <Text style={styles.medName} numberOfLines={1}>
            {schedule?.medication_name ?? 'Médicament'}
          </Text>
        </View>

        {/* Carte prochaine dose */}
        <View style={[styles.nextCard, Shadows.card]}>
          <View style={styles.nextIconCircle}>
            <Ionicons name="alarm-outline" size={fonts.xl} color={Colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.nextCardLabel}>Prochaine dose dans</Text>
            <Text style={styles.countdownText}>{countdown}</Text>
            <Text style={styles.nextDoseSub}>{nextLabel} · {nextTime}</Text>
          </View>
        </View>

        {/* Statistiques */}
        <View style={styles.statsRow}>
          <AdherenceRing percentage={stats.percentage} size={110} strokeWidth={9} label="30 jours" />
          <View style={styles.statsGrid}>
            <StatPill fonts={fonts} label="Prises" value={stats.taken} color={Colors.taken} />
            <StatPill fonts={fonts} label="En retard" value={stats.late} color={Colors.late} />
            <StatPill fonts={fonts} label="Manquées" value={stats.missed} color={Colors.missed} />
          </View>
        </View>

        {/* Doses du jour */}
        <Text style={styles.sectionTitle}>Doses du jour</Text>

        {schedule && (
          <>
            <DoseCard
              type="AM"
              scheduledTime={formatTime(timeStringToDate(schedule.am_time))}
              log={amLog}
              onMarkTaken={() => logDose('AM', 'taken')}
              onMarkMissed={() => logDose('AM', 'missed')}
              onMarkLate={() => logDose('AM', 'late')}
            />
            <DoseCard
              type="PM"
              scheduledTime={formatTime(timeStringToDate(schedule.pm_time))}
              log={pmLog}
              onMarkTaken={() => logDose('PM', 'taken')}
              onMarkMissed={() => logDose('PM', 'missed')}
              onMarkLate={() => logDose('PM', 'late')}
            />
          </>
        )}

        {amLog && pmLog && (
          <View style={styles.allDoneCard}>
            <Ionicons name="checkmark-circle" size={fonts.xl} color={Colors.taken} />
            <Text style={styles.allDoneText}>Toutes les doses du jour sont enregistrées. Bravo !</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatPill({ fonts, label, value, color }: { fonts: Fonts; label: string; value: number; color: string }) {
  return (
    <View style={[pillStyles.statPill, { backgroundColor: color + '14' }]}>
      <Text style={[pillStyles.statValue, { color, fontSize: fonts.lg }]}>{value}</Text>
      <Text style={[pillStyles.statLabel, { fontSize: fonts.sm }]}>{label}</Text>
    </View>
  );
}

const pillStyles = StyleSheet.create({
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  statValue: {
    fontWeight: FontWeights.bold,
    minWidth: 32,
  },
  statLabel: {
    color: Colors.textSecondary,
    fontWeight: FontWeights.medium,
  },
});

function makeStyles(f: Fonts) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.bg },
    scroll: { flex: 1 },
    content: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
    loadingText: { color: Colors.textSecondary, fontSize: f.md },

    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: Spacing.lg,
      marginBottom: Spacing.md,
    },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    greeting: {
      fontSize: f.xl,
      fontWeight: FontWeights.bold,
      color: Colors.textPrimary,
    },
    today: {
      fontSize: f.sm,
      color: Colors.textSecondary,
      marginTop: 2,
    },
    eyeBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: Colors.bgCard,
      borderWidth: 1,
      borderColor: Colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    eyeBtnActive: {
      backgroundColor: Colors.accentDim,
      borderColor: Colors.borderAccent,
    },

    medRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      marginBottom: Spacing.lg,
    },
    medName: {
      color: Colors.textSecondary,
      fontSize: f.sm,
      fontWeight: FontWeights.semibold,
      flexShrink: 1,
    },

    nextCard: {
      backgroundColor: Colors.bgCard,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: Colors.border,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    nextIconCircle: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: Colors.accentDim,
      alignItems: 'center',
      justifyContent: 'center',
    },
    nextCardLabel: {
      fontSize: f.sm,
      color: Colors.textSecondary,
      fontWeight: FontWeights.medium,
    },
    countdownText: {
      fontSize: f.xxxl,
      fontWeight: FontWeights.extrabold,
      color: Colors.textPrimary,
      marginVertical: 2,
    },
    nextDoseSub: {
      fontSize: f.md,
      color: Colors.accent,
      fontWeight: FontWeights.semibold,
    },

    statsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.bgCard,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
      borderWidth: 1,
      borderColor: Colors.border,
      gap: Spacing.lg,
    },
    statsGrid: {
      flex: 1,
      gap: Spacing.sm,
    },

    sectionTitle: {
      fontSize: f.lg,
      fontWeight: FontWeights.bold,
      color: Colors.textPrimary,
      marginBottom: Spacing.md,
    },

    allDoneCard: {
      backgroundColor: Colors.takenDim,
      borderRadius: Radius.lg,
      padding: Spacing.lg,
      alignItems: 'center',
      flexDirection: 'row',
      gap: Spacing.sm,
      marginTop: Spacing.sm,
    },
    allDoneText: {
      fontSize: f.md,
      color: Colors.taken,
      fontWeight: FontWeights.semibold,
      flex: 1,
    },
  });
}
