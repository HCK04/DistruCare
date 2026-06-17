import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Switch, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Colors, Fonts, FontWeights, Radius, Shadows, Spacing } from '../theme';
import { useUI } from '../context/UISettings';
import { useSchedule } from '../hooks/useSchedule';
import { useTodayLogs } from '../hooks/useLogs';
import ConfirmModal from '../components/ConfirmModal';
import {
  scheduleDoseReminders,
  cancelAllReminders,
  requestNotificationPermission,
} from '../notifications/notificationService';
import { timeStringToDate, dateToTimeString } from '../utils/dateHelpers';
import { combinedMedLabel, parseMedList } from '../db/queries';
import { useHardware } from '../hardware/HardwareContext';

type MedItem = { id: number; name: string };

export default function SettingsScreen() {
  const { fonts, largeText, setLargeText } = useUI();
  const styles = useMemo(() => makeStyles(fonts), [fonts]);
  const { schedule, loading, save } = useSchedule();
  const { resetToday } = useTodayLogs();
  const { status: hwStatus, syncSchedule } = useHardware();

  const [amMeds, setAmMeds] = useState<MedItem[]>([]);
  const [pmMeds, setPmMeds] = useState<MedItem[]>([]);
  const nextId = useRef(1);
  const [amTime, setAmTime] = useState(new Date());
  const [pmTime, setPmTime] = useState(new Date());
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  const [showAmPicker, setShowAmPicker] = useState(false);
  const [showPmPicker, setShowPmPicker] = useState(false);

  // Convert a stored list into editable rows; always keep at least one input row.
  const toItems = useCallback((raw: string): MedItem[] => {
    const names = parseMedList(raw);
    const list = (names.length ? names : ['']).map((name) => ({ id: nextId.current++, name }));
    return list;
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (schedule) {
        setAmMeds(toItems(schedule.am_medication_name));
        setPmMeds(toItems(schedule.pm_medication_name));
        setAmTime(timeStringToDate(schedule.am_time));
        setPmTime(timeStringToDate(schedule.pm_time));
        setNotifEnabled(schedule.notifications_enabled === 1);
      }
    }, [schedule, toItems])
  );

  // List editing helpers (shared by morning & evening lists).
  const editMed = (setList: React.Dispatch<React.SetStateAction<MedItem[]>>, id: number, name: string) =>
    setList((prev) => prev.map((m) => (m.id === id ? { ...m, name } : m)));
  const addMed = (setList: React.Dispatch<React.SetStateAction<MedItem[]>>) =>
    setList((prev) => [...prev, { id: nextId.current++, name: '' }]);
  const removeMed = (setList: React.Dispatch<React.SetStateAction<MedItem[]>>, id: number) =>
    setList((prev) => (prev.length <= 1 ? prev : prev.filter((m) => m.id !== id)));

  const handleSave = async () => {
    const amList = amMeds.map((m) => m.name.trim()).filter(Boolean);
    const pmList = pmMeds.map((m) => m.name.trim()).filter(Boolean);
    if (!amList.length || !pmList.length) {
      Alert.alert('Champ requis', 'Ajoutez au moins un médicament pour le matin et pour le soir.');
      return;
    }
    setSaving(true);
    const amStr = dateToTimeString(amTime);
    const pmStr = dateToTimeString(pmTime);
    await save(amList, pmList, amStr, pmStr, notifEnabled);

    if (notifEnabled) {
      const granted = await requestNotificationPermission();
      if (granted) {
        await scheduleDoseReminders(amStr, pmStr, amList, pmList);
      }
    } else {
      await cancelAllReminders();
    }

    if (hwStatus === 'connected') {
      try {
        await syncSchedule({ am_time: amStr, pm_time: pmStr, medication_name: combinedMedLabel(amList, pmList) });
      } catch { /* non bloquant : la synchro se fera à la prochaine connexion */ }
    }

    setSaving(false);
    const hwNote = hwStatus === 'connected' ? ' Synchronisé avec le distributeur.' : '';
    Alert.alert('Enregistré', `Votre programme a été mis à jour.${hwNote}`);
  };

  const handleReset = async () => {
    await resetToday();
    setShowResetModal(false);
    Alert.alert('Réinitialisé', "Les enregistrements du jour ont été effacés.");
  };

  if (loading) {
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
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Réglages</Text>
        <Text style={styles.subtitle}>Gérez votre programme de prise</Text>

        {/* Accessibilité */}
        <SectionLabel styles={styles} label="Accessibilité" />
        <View style={styles.toggleRow}>
          <View style={styles.toggleIcon}>
            <Ionicons name="eye-outline" size={fonts.lg} color={Colors.accent} />
          </View>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Confort visuel</Text>
            <Text style={styles.toggleSub}>Agrandir tout le texte de l'application</Text>
          </View>
          <Switch
            value={largeText}
            onValueChange={setLargeText}
            trackColor={{ false: Colors.bgCardAlt, true: Colors.accent }}
            thumbColor={Colors.white}
          />
        </View>

        {/* Médicaments du matin */}
        <MedListSection
          styles={styles} fonts={fonts}
          label="Médicaments du matin"
          icon="partly-sunny-outline"
          placeholder="ex. Metformine 500 mg"
          items={amMeds}
          onEdit={(id, name) => editMed(setAmMeds, id, name)}
          onAdd={() => addMed(setAmMeds)}
          onRemove={(id) => removeMed(setAmMeds, id)}
        />

        {/* Médicaments du soir */}
        <MedListSection
          styles={styles} fonts={fonts}
          label="Médicaments du soir"
          icon="moon-outline"
          placeholder="ex. Atorvastatine 20 mg"
          items={pmMeds}
          onEdit={(id, name) => editMed(setPmMeds, id, name)}
          onAdd={() => addMed(setPmMeds)}
          onRemove={(id) => removeMed(setPmMeds, id)}
        />

        {/* Heure du matin */}
        <SectionLabel styles={styles} label="Heure de la dose du matin" />
        <TouchableOpacity style={styles.timeButton} onPress={() => setShowAmPicker(true)} activeOpacity={0.8}>
          <View style={styles.timeLeft}>
            <Ionicons name="partly-sunny-outline" size={fonts.lg} color={Colors.accent} />
            <Text style={styles.timeButtonText}>
              {amTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <Text style={styles.timeEditLabel}>Modifier</Text>
        </TouchableOpacity>
        {showAmPicker && (
          <DateTimePicker
            value={amTime}
            mode="time"
            is24Hour
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_: DateTimePickerEvent, date?: Date) => {
              setShowAmPicker(Platform.OS === 'ios');
              if (date) setAmTime(date);
            }}
            themeVariant="light"
          />
        )}

        {/* Heure du soir */}
        <SectionLabel styles={styles} label="Heure de la dose du soir" />
        <TouchableOpacity style={styles.timeButton} onPress={() => setShowPmPicker(true)} activeOpacity={0.8}>
          <View style={styles.timeLeft}>
            <Ionicons name="moon-outline" size={fonts.lg} color={Colors.accent} />
            <Text style={styles.timeButtonText}>
              {pmTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <Text style={styles.timeEditLabel}>Modifier</Text>
        </TouchableOpacity>
        {showPmPicker && (
          <DateTimePicker
            value={pmTime}
            mode="time"
            is24Hour
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_: DateTimePickerEvent, date?: Date) => {
              setShowPmPicker(Platform.OS === 'ios');
              if (date) setPmTime(date);
            }}
            themeVariant="light"
          />
        )}

        {/* Notifications */}
        <SectionLabel styles={styles} label="Rappels" />
        <View style={styles.toggleRow}>
          <View style={styles.toggleIcon}>
            <Ionicons name="notifications-outline" size={fonts.lg} color={Colors.accent} />
          </View>
          <View style={styles.toggleInfo}>
            <Text style={styles.toggleLabel}>Rappels de prise</Text>
            <Text style={styles.toggleSub}>Être notifié à chaque dose</Text>
          </View>
          <Switch
            value={notifEnabled}
            onValueChange={setNotifEnabled}
            trackColor={{ false: Colors.bgCardAlt, true: Colors.accent }}
            thumbColor={Colors.white}
          />
        </View>

        {/* Enregistrer */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled, Shadows.accent]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          <Text style={styles.saveBtnText}>{saving ? 'Enregistrement…' : 'Enregistrer le programme'}</Text>
        </TouchableOpacity>

        {/* Zone sensible */}
        <View style={styles.danger}>
          <Text style={styles.dangerTitle}>Zone sensible</Text>
          <TouchableOpacity style={styles.dangerBtn} onPress={() => setShowResetModal(true)} activeOpacity={0.8}>
            <Text style={styles.dangerBtnText}>Réinitialiser les prises du jour</Text>
          </TouchableOpacity>
        </View>

        {/* Infos */}
        <View style={styles.info}>
          <Text style={styles.infoText}>Distrucare v1.0.0</Text>
          <Text style={styles.infoText}>Hors-ligne · Sécurisé · Toujours avec vous</Text>
        </View>
      </ScrollView>

      <ConfirmModal
        visible={showResetModal}
        title="Réinitialiser les prises du jour ?"
        body="Cette action effacera tous les enregistrements de doses d'aujourd'hui. Elle est irréversible."
        confirmLabel="Réinitialiser"
        confirmColor={Colors.missed}
        onConfirm={handleReset}
        onCancel={() => setShowResetModal(false)}
      />
    </SafeAreaView>
  );
}

function SectionLabel({ styles, label }: { styles: any; label: string }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
}

function MedListSection({
  styles, fonts, label, icon, placeholder, items, onEdit, onAdd, onRemove,
}: {
  styles: any;
  fonts: Fonts;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  items: MedItem[];
  onEdit: (id: number, name: string) => void;
  onAdd: () => void;
  onRemove: (id: number) => void;
}) {
  const single = items.length <= 1;
  return (
    <>
      <SectionLabel styles={styles} label={label} />
      {items.map((item) => (
        <View key={item.id} style={styles.medRow}>
          <Ionicons name={icon} size={fonts.lg} color={Colors.accent} />
          <TextInput
            style={styles.medInput}
            value={item.name}
            onChangeText={(t) => onEdit(item.id, t)}
            placeholder={placeholder}
            placeholderTextColor={Colors.textMuted}
            maxLength={50}
          />
          <TouchableOpacity
            onPress={() => onRemove(item.id)}
            disabled={single}
            style={styles.medRemoveBtn}
            accessibilityLabel="Retirer ce médicament"
            activeOpacity={0.7}
          >
            <Ionicons name="close-circle" size={fonts.xl} color={single ? Colors.border : Colors.missed} />
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity style={styles.addMedBtn} onPress={onAdd} activeOpacity={0.8}>
        <Ionicons name="add-circle-outline" size={fonts.md} color={Colors.accent} />
        <Text style={styles.addMedText}>Ajouter un médicament</Text>
      </TouchableOpacity>
    </>
  );
}

function makeStyles(f: Fonts) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.bg },
    scroll: { flex: 1 },
    content: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
    loadingText: { color: Colors.textSecondary, fontSize: f.md },

    title: {
      fontSize: f.xxl,
      fontWeight: FontWeights.extrabold,
      color: Colors.textPrimary,
      marginTop: Spacing.lg,
    },
    subtitle: {
      fontSize: f.sm,
      color: Colors.textSecondary,
      marginTop: 4,
      marginBottom: Spacing.xl,
    },

    sectionLabel: {
      fontSize: f.sm,
      fontWeight: FontWeights.semibold,
      color: Colors.textSecondary,
      marginBottom: Spacing.sm,
    },

    inputWrapper: {
      backgroundColor: Colors.bgCard,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: Colors.border,
      marginBottom: Spacing.lg,
    },
    input: {
      color: Colors.textPrimary,
      fontSize: f.lg,
      fontWeight: FontWeights.medium,
      paddingHorizontal: Spacing.md,
      paddingVertical: 16,
      minHeight: 58,
    },
    medRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      backgroundColor: Colors.bgCard,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: Colors.border,
      paddingLeft: Spacing.md,
      paddingRight: Spacing.xs,
      marginBottom: Spacing.sm,
    },
    medInput: {
      flex: 1,
      color: Colors.textPrimary,
      fontSize: f.lg,
      fontWeight: FontWeights.medium,
      paddingVertical: 16,
      minHeight: 58,
    },
    medRemoveBtn: {
      padding: Spacing.xs,
    },
    addMedBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.xs,
      paddingVertical: 12,
      marginBottom: Spacing.lg,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: Colors.borderAccent,
      borderStyle: 'dashed',
      backgroundColor: Colors.accentDim,
    },
    addMedText: {
      color: Colors.accent,
      fontSize: f.sm,
      fontWeight: FontWeights.semibold,
    },

    timeButton: {
      backgroundColor: Colors.bgCard,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: Colors.border,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.lg,
      minHeight: 64,
    },
    timeLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    timeButtonText: {
      fontSize: f.xxl,
      fontWeight: FontWeights.bold,
      color: Colors.textPrimary,
    },
    timeEditLabel: {
      fontSize: f.sm,
      color: Colors.accent,
      fontWeight: FontWeights.semibold,
    },

    toggleRow: {
      backgroundColor: Colors.bgCard,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: Colors.border,
      padding: Spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
      marginBottom: Spacing.lg,
    },
    toggleIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: Colors.accentDim,
      alignItems: 'center',
      justifyContent: 'center',
    },
    toggleInfo: { flex: 1 },
    toggleLabel: {
      fontSize: f.md,
      fontWeight: FontWeights.semibold,
      color: Colors.textPrimary,
    },
    toggleSub: {
      fontSize: f.xs,
      color: Colors.textMuted,
      marginTop: 2,
    },

    saveBtn: {
      backgroundColor: Colors.accent,
      borderRadius: Radius.lg,
      paddingVertical: 18,
      alignItems: 'center',
      marginTop: Spacing.sm,
      marginBottom: Spacing.xl,
      minHeight: 58,
      justifyContent: 'center',
    },
    saveBtnDisabled: { opacity: 0.6 },
    saveBtnText: {
      color: Colors.white,
      fontSize: f.lg,
      fontWeight: FontWeights.bold,
    },

    danger: {
      backgroundColor: Colors.missedDim,
      borderRadius: Radius.md,
      padding: Spacing.lg,
      marginBottom: Spacing.xl,
    },
    dangerTitle: {
      fontSize: f.sm,
      fontWeight: FontWeights.bold,
      color: Colors.missed,
      marginBottom: Spacing.md,
    },
    dangerBtn: {
      borderWidth: 1.5,
      borderColor: Colors.missed,
      borderRadius: Radius.md,
      paddingVertical: 14,
      alignItems: 'center',
    },
    dangerBtnText: {
      color: Colors.missed,
      fontSize: f.md,
      fontWeight: FontWeights.semibold,
    },

    info: { alignItems: 'center', gap: 4 },
    infoText: { fontSize: f.xs, color: Colors.textMuted },
  });
}
