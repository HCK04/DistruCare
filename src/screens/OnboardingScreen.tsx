import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Animated, Platform, ScrollView, KeyboardAvoidingView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Colors, Fonts, FontWeights, Radius, Shadows, Spacing } from '../theme';
import { useUI } from '../context/UISettings';
import { updateSchedule } from '../db/queries';
import { scheduleDoseReminders, requestNotificationPermission } from '../notifications/notificationService';
import { dateToTimeString } from '../utils/dateHelpers';

interface Props {
  onComplete: () => void;
}

const STEPS = ['welcome', 'medication', 'schedule', 'done'] as const;
type Step = typeof STEPS[number];

export default function OnboardingScreen({ onComplete }: Props) {
  const { fonts } = useUI();
  const styles = useMemo(() => makeStyles(fonts), [fonts]);
  const [step, setStep] = useState<Step>('welcome');
  const [medName, setMedName] = useState('');
  const [amTime, setAmTime] = useState(() => { const d = new Date(); d.setHours(8, 0, 0, 0); return d; });
  const [pmTime, setPmTime] = useState(() => { const d = new Date(); d.setHours(20, 0, 0, 0); return d; });
  const [showAmPicker, setShowAmPicker] = useState(false);
  const [showPmPicker, setShowPmPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  const animateIn = () => {
    fadeAnim.setValue(0);
    slideAnim.setValue(24);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => { animateIn(); }, [step]);

  const goNext = () => {
    const idx = STEPS.indexOf(step);
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1]);
  };

  const handleMedicationNext = () => {
    if (!medName.trim()) {
      Alert.alert('Champ requis', 'Veuillez saisir le nom de votre médicament pour continuer.');
      return;
    }
    goNext();
  };

  const handleFinish = async () => {
    setSaving(true);
    const amStr = dateToTimeString(amTime);
    const pmStr = dateToTimeString(pmTime);
    await updateSchedule(medName.trim(), amStr, pmStr, true);
    const granted = await requestNotificationPermission();
    if (granted) await scheduleDoseReminders(amStr, pmStr, medName.trim());
    setSaving(false);
    onComplete();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Indicateur d'étapes */}
          <View style={styles.stepRow}>
            {STEPS.map((s, i) => (
              <View
                key={s}
                style={[
                  styles.stepDot,
                  s === step && styles.stepDotActive,
                  STEPS.indexOf(step) > i && styles.stepDotDone,
                ]}
              />
            ))}
          </View>

          <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

            {/* Étape 1 : Bienvenue */}
            {step === 'welcome' && (
              <>
                <HeroIcon name="medkit-outline" fonts={fonts} styles={styles} />
                <Text style={styles.headline}>Bienvenue sur{'\n'}DisrtuCare</Text>
                <Text style={styles.body}>
                  Votre compagnon de prise de médicaments.{'\n'}
                  Configurons votre programme en quelques étapes pour ne plus jamais oublier une dose.
                </Text>
                <View style={styles.featureList}>
                  <FeatureRow styles={styles} fonts={fonts} icon="time-outline" text="Définir vos heures du matin et du soir" />
                  <FeatureRow styles={styles} fonts={fonts} icon="checkmark-circle-outline" text="Enregistrer et suivre chaque prise" />
                  <FeatureRow styles={styles} fonts={fonts} icon="bar-chart-outline" text="Consulter votre observance" />
                  <FeatureRow styles={styles} fonts={fonts} icon="notifications-outline" text="Recevoir des rappels en douceur" />
                </View>
                <TouchableOpacity style={[styles.primaryBtn, Shadows.accent]} onPress={goNext} activeOpacity={0.85}>
                  <Text style={styles.primaryBtnText}>Commencer</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Étape 2 : Nom du médicament */}
            {step === 'medication' && (
              <>
                <HeroIcon name="medical-outline" fonts={fonts} styles={styles} />
                <Text style={styles.headline}>Quel médicament{'\n'}prenez-vous ?</Text>
                <Text style={styles.body}>
                  Saisissez le nom de votre médicament tel qu'il figure sur la boîte.
                </Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={medName}
                    onChangeText={setMedName}
                    placeholder="ex. Metformine 500 mg"
                    placeholderTextColor={Colors.textMuted}
                    maxLength={50}
                    autoFocus
                    returnKeyType="next"
                    onSubmitEditing={handleMedicationNext}
                  />
                </View>
                <TouchableOpacity style={[styles.primaryBtn, Shadows.accent]} onPress={handleMedicationNext} activeOpacity={0.85}>
                  <Text style={styles.primaryBtnText}>Continuer</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Étape 3 : Programme */}
            {step === 'schedule' && (
              <>
                <HeroIcon name="alarm-outline" fonts={fonts} styles={styles} />
                <Text style={styles.headline}>Réglez votre{'\n'}programme</Text>
                <Text style={styles.body}>
                  Votre distributeur fonctionne en deux prises : matin et soir. Touchez chaque heure pour l'ajuster.
                </Text>

                <View style={styles.timeLabelRow}>
                  <Ionicons name="partly-sunny-outline" size={fonts.md} color={Colors.accent} />
                  <Text style={styles.timeLabel}>Dose du matin</Text>
                </View>
                <TouchableOpacity style={styles.timeBtn} onPress={() => setShowAmPicker(true)} activeOpacity={0.8}>
                  <Text style={styles.timeBtnText}>
                    {amTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <Text style={styles.timeBtnHint}>Modifier</Text>
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

                <View style={[styles.timeLabelRow, { marginTop: Spacing.lg }]}>
                  <Ionicons name="moon-outline" size={fonts.md} color={Colors.accent} />
                  <Text style={styles.timeLabel}>Dose du soir</Text>
                </View>
                <TouchableOpacity style={styles.timeBtn} onPress={() => setShowPmPicker(true)} activeOpacity={0.8}>
                  <Text style={styles.timeBtnText}>
                    {pmTime.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <Text style={styles.timeBtnHint}>Modifier</Text>
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

                <TouchableOpacity
                  style={[styles.primaryBtn, Shadows.accent, saving && { opacity: 0.6 }]}
                  onPress={handleFinish}
                  disabled={saving}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryBtnText}>{saving ? 'Configuration…' : 'Terminer'}</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Étape 4 : Terminé */}
            {step === 'done' && (
              <>
                <HeroIcon name="checkmark-circle-outline" fonts={fonts} styles={styles} />
                <Text style={styles.headline}>Tout est prêt !</Text>
                <Text style={styles.body}>Ouverture de votre tableau de bord…</Text>
              </>
            )}

          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function HeroIcon({ name, fonts, styles }: { name: keyof typeof Ionicons.glyphMap; fonts: Fonts; styles: any }) {
  return (
    <View style={styles.heroCircle}>
      <Ionicons name={name} size={fonts.xxxl} color={Colors.accent} />
    </View>
  );
}

function FeatureRow({ styles, fonts, icon, text }: { styles: any; fonts: Fonts; icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.featureRow}>
      <Ionicons name={icon} size={fonts.lg} color={Colors.accent} style={{ width: 32, textAlign: 'center' }} />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

function makeStyles(f: Fonts) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.bg },
    scroll: { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },

    stepRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: Spacing.sm,
      marginTop: Spacing.lg,
      marginBottom: Spacing.xxl,
    },
    stepDot: {
      width: 8, height: 8,
      borderRadius: 4,
      backgroundColor: Colors.border,
    },
    stepDotActive: { backgroundColor: Colors.accent, width: 24 },
    stepDotDone: { backgroundColor: Colors.borderAccent },

    content: { flex: 1, alignItems: 'center' },

    heroCircle: {
      width: 112,
      height: 112,
      borderRadius: 56,
      backgroundColor: Colors.accentDim,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.lg,
    },
    headline: {
      fontSize: f.xxl,
      fontWeight: FontWeights.extrabold,
      color: Colors.textPrimary,
      textAlign: 'center',
      lineHeight: f.xxl * 1.25,
      marginBottom: Spacing.md,
    },
    body: {
      fontSize: f.md,
      color: Colors.textSecondary,
      textAlign: 'center',
      lineHeight: f.md * 1.5,
      marginBottom: Spacing.xl,
    },

    featureList: {
      width: '100%',
      backgroundColor: Colors.bgCard,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: Colors.border,
      padding: Spacing.md,
      marginBottom: Spacing.xl,
      gap: Spacing.sm,
    },
    featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: 8 },
    featureText: { fontSize: f.md, color: Colors.textPrimary, fontWeight: FontWeights.medium, flex: 1 },

    inputWrapper: {
      width: '100%',
      backgroundColor: Colors.bgCard,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: Colors.border,
      marginBottom: Spacing.xl,
    },
    input: {
      color: Colors.textPrimary,
      fontSize: f.xl,
      fontWeight: FontWeights.medium,
      paddingHorizontal: Spacing.lg,
      paddingVertical: 18,
      textAlign: 'center',
    },

    timeLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.xs,
      alignSelf: 'flex-start',
      marginBottom: Spacing.sm,
    },
    timeLabel: {
      fontSize: f.sm,
      fontWeight: FontWeights.semibold,
      color: Colors.textSecondary,
    },
    timeBtn: {
      width: '100%',
      backgroundColor: Colors.bgCard,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: Colors.border,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      minHeight: 64,
    },
    timeBtnText: {
      fontSize: f.xxl,
      fontWeight: FontWeights.bold,
      color: Colors.textPrimary,
    },
    timeBtnHint: { fontSize: f.sm, color: Colors.accent, fontWeight: FontWeights.semibold },

    primaryBtn: {
      width: '100%',
      backgroundColor: Colors.accent,
      borderRadius: Radius.lg,
      paddingVertical: 18,
      alignItems: 'center',
      marginTop: Spacing.lg,
      minHeight: 58,
      justifyContent: 'center',
    },
    primaryBtnText: {
      color: Colors.white,
      fontSize: f.lg,
      fontWeight: FontWeights.bold,
    },
  });
}
