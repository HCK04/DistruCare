import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Fonts, FontWeights, Radius, Spacing } from '../theme';
import { useUI } from '../context/UISettings';
import { useHistoryLogs } from '../hooks/useLogs';
import { getLogsForDate } from '../db/queries';
import StatusBadge from '../components/StatusBadge';
import AdherenceRing from '../components/AdherenceRing';
import { getWeekDays, isSameDayCheck } from '../utils/dateHelpers';
import { DoseLog } from '../db/queries';

function toDateStr(d: Date) {
  return d.toISOString().split('T')[0];
}

const DAYS = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];

export default function HistoryScreen() {
  const { fonts } = useUI();
  const styles = useMemo(() => makeStyles(fonts), [fonts]);
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [weekRef, setWeekRef] = useState(today);
  const [dayLogs, setDayLogs] = useState<DoseLog[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const startDate = (() => {
    const d = new Date(); d.setDate(d.getDate() - 29); return toDateStr(d);
  })();
  const endDate = toDateStr(today);

  const { logs: allLogs, stats, reload } = useHistoryLogs(startDate, endDate);

  const loadDayLogs = useCallback(async (date: Date) => {
    const l = await getLogsForDate(toDateStr(date));
    setDayLogs(l);
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
      loadDayLogs(selectedDate);
    }, [])
  );

  const onSelectDate = (d: Date) => {
    setSelectedDate(d);
    loadDayLogs(d);
  };

  const weekDays = getWeekDays(weekRef);

  const shiftWeek = (dir: number) => {
    const d = new Date(weekRef);
    d.setDate(d.getDate() + dir * 7);
    setWeekRef(d);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await reload();
    await loadDayLogs(selectedDate);
    setRefreshing(false);
  };

  const logsByDate: Record<string, DoseLog[]> = {};
  allLogs.forEach((l) => {
    if (!logsByDate[l.date]) logsByDate[l.date] = [];
    logsByDate[l.date].push(l);
  });
  const sortedDates = Object.keys(logsByDate).sort((a, b) => b.localeCompare(a));

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
        <Text style={styles.title}>Historique</Text>

        {/* Statistiques */}
        <View style={styles.statsCard}>
          <AdherenceRing percentage={stats.percentage} size={100} strokeWidth={8} label="30 jours" />
          <View style={styles.statsList}>
            <StatRow fonts={fonts} label="Total enregistré" value={stats.total} color={Colors.textPrimary} />
            <StatRow fonts={fonts} label="Prises" value={stats.taken} color={Colors.taken} />
            <StatRow fonts={fonts} label="En retard" value={stats.late} color={Colors.late} />
            <StatRow fonts={fonts} label="Manquées" value={stats.missed} color={Colors.missed} />
          </View>
        </View>

        {/* Bandeau semaine */}
        <View style={styles.weekHeader}>
          <TouchableOpacity onPress={() => shiftWeek(-1)} style={styles.weekArrow}>
            <Ionicons name="chevron-back" size={fonts.lg} color={Colors.accent} />
          </TouchableOpacity>
          <Text style={styles.weekLabel}>
            {weekDays[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
            {' – '}
            {weekDays[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
          </Text>
          <TouchableOpacity onPress={() => shiftWeek(1)} style={styles.weekArrow}>
            <Ionicons name="chevron-forward" size={fonts.lg} color={Colors.accent} />
          </TouchableOpacity>
        </View>

        <View style={styles.calendarStrip}>
          {weekDays.map((d, i) => {
            const isSelected = isSameDayCheck(d, selectedDate);
            const isToday = isSameDayCheck(d, today);
            const dateStr = toDateStr(d);
            const dayHasLogs = allLogs.some((l) => l.date === dateStr);
            const allTaken = dayHasLogs && allLogs.filter(l => l.date === dateStr).every(l => l.status === 'taken' || l.status === 'late');
            const hasMissed = allLogs.some(l => l.date === dateStr && l.status === 'missed');

            const dotColor = hasMissed ? Colors.missed : allTaken ? Colors.taken : dayHasLogs ? Colors.late : 'transparent';

            return (
              <TouchableOpacity
                key={i}
                style={[styles.dayBtn, isSelected && styles.dayBtnSelected]}
                onPress={() => onSelectDate(d)}
              >
                <Text style={[styles.dayName, isSelected && styles.dayTextSelected]}>{DAYS[i]}</Text>
                <Text style={[styles.dayNum, isSelected && styles.dayTextSelected, isToday && !isSelected && styles.dayNumToday]}>
                  {d.getDate()}
                </Text>
                <View style={[styles.dot, { backgroundColor: dotColor }]} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Détail du jour sélectionné */}
        <View style={styles.dayDetail}>
          <Text style={styles.dayDetailTitle}>
            {isSameDayCheck(selectedDate, today) ? "Aujourd'hui" : selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Text>
          {dayLogs.length === 0 ? (
            <Text style={styles.emptyText}>Aucune dose enregistrée ce jour-là.</Text>
          ) : (
            dayLogs.map((log) => (
              <DayLogRow key={log.id} fonts={fonts} styles={styles} log={log} />
            ))
          )}
        </View>

        <Text style={styles.sectionTitle}>Historique récent</Text>

        {sortedDates.length === 0 ? (
          <Text style={styles.emptyText}>Aucun historique pour le moment. Commencez à enregistrer vos prises !</Text>
        ) : (
          sortedDates.slice(0, 14).map((date) => (
            <View key={date} style={styles.historyGroup}>
              <Text style={styles.historyDate}>
                {new Date(date + 'T12:00:00').toLocaleDateString('fr-FR', {
                  weekday: 'short', day: 'numeric', month: 'short',
                })}
              </Text>
              {logsByDate[date].map((log) => (
                <DayLogRow key={log.id} fonts={fonts} styles={styles} log={log} />
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DayLogRow({ fonts, styles, log }: { fonts: Fonts; styles: any; log: DoseLog }) {
  const icon = log.dose_type === 'AM' ? 'partly-sunny-outline' : 'moon-outline';
  const label = log.dose_type === 'AM' ? 'Dose du matin' : 'Dose du soir';
  return (
    <View style={styles.logRow}>
      <Ionicons name={icon} size={fonts.lg} color={Colors.accent} />
      <View style={styles.logInfo}>
        <Text style={styles.logLabel}>{label}</Text>
        <Text style={styles.logTime}>
          {new Date(log.logged_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      <StatusBadge status={log.status} size="sm" />
    </View>
  );
}

function StatRow({ fonts, label, value, color }: { fonts: Fonts; label: string; value: number; color: string }) {
  return (
    <View style={rowStyles.statRow}>
      <Text style={[rowStyles.statRowLabel, { fontSize: fonts.sm }]}>{label}</Text>
      <Text style={[rowStyles.statRowValue, { color, fontSize: fonts.sm }]}>{value}</Text>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statRowLabel: { color: Colors.textSecondary, fontWeight: FontWeights.medium },
  statRowValue: { fontWeight: FontWeights.bold },
});

function makeStyles(f: Fonts) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.bg },
    scroll: { flex: 1 },
    content: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },

    title: {
      fontSize: f.xxl,
      fontWeight: FontWeights.extrabold,
      color: Colors.textPrimary,
      marginTop: Spacing.lg,
      marginBottom: Spacing.lg,
    },

    statsCard: {
      backgroundColor: Colors.bgCard,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: Colors.border,
      padding: Spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.lg,
      marginBottom: Spacing.lg,
    },
    statsList: { flex: 1 },

    weekHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: Spacing.sm,
    },
    weekArrow: { padding: Spacing.sm },
    weekLabel: { fontSize: f.sm, color: Colors.textSecondary, fontWeight: FontWeights.medium },

    calendarStrip: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      backgroundColor: Colors.bgCard,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: Colors.border,
      padding: Spacing.sm,
      marginBottom: Spacing.lg,
    },
    dayBtn: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: Spacing.sm,
      borderRadius: Radius.md,
    },
    dayBtnSelected: {
      backgroundColor: Colors.accent,
    },
    dayName: { fontSize: f.xs, color: Colors.textMuted, fontWeight: FontWeights.medium, marginBottom: 3 },
    dayNum: { fontSize: f.md, color: Colors.textPrimary, fontWeight: FontWeights.bold, marginBottom: 4 },
    dayNumToday: { color: Colors.accent },
    dayTextSelected: { color: Colors.white },
    dot: { width: 6, height: 6, borderRadius: 3 },

    dayDetail: {
      backgroundColor: Colors.bgCard,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: Colors.border,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
    },
    dayDetailTitle: {
      fontSize: f.md,
      fontWeight: FontWeights.bold,
      color: Colors.textPrimary,
      marginBottom: Spacing.md,
      textTransform: 'capitalize',
    },
    emptyText: {
      color: Colors.textMuted,
      fontSize: f.sm,
      textAlign: 'center',
      paddingVertical: Spacing.md,
    },

    sectionTitle: {
      fontSize: f.lg,
      fontWeight: FontWeights.bold,
      color: Colors.textPrimary,
      marginBottom: Spacing.md,
    },
    historyGroup: {
      backgroundColor: Colors.bgCard,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: Colors.border,
      paddingHorizontal: Spacing.md,
      marginBottom: Spacing.md,
    },
    historyDate: {
      fontSize: f.sm,
      fontWeight: FontWeights.bold,
      color: Colors.textSecondary,
      paddingTop: Spacing.md,
      paddingBottom: Spacing.xs,
      textTransform: 'capitalize',
    },

    logRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
      gap: Spacing.sm,
    },
    logInfo: { flex: 1 },
    logLabel: { fontSize: f.sm, fontWeight: FontWeights.semibold, color: Colors.textPrimary },
    logTime: { fontSize: f.xs, color: Colors.textMuted, marginTop: 2 },
  });
}
