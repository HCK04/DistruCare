import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Fonts, FontWeights, Radius, Spacing } from '../theme';
import { useUI } from '../context/UISettings';
import { useHardware } from '../hardware/HardwareContext';
import { useSchedule } from '../hooks/useSchedule';
import { HardwareEvent } from '../hardware/httpService';

type LogEntry = { label: string; time: string };

export default function HardwareScreen() {
  const { fonts } = useUI();
  const styles = useMemo(() => makeStyles(fonts), [fonts]);
  const { status, lastEvent, savedIp, connect, disconnect, syncSchedule, runDiag, runSelfTest, testMotor } =
    useHardware();
  const { schedule } = useSchedule();

  const [ipInput, setIpInput] = useState('');
  const [log, setLog] = useState<LogEntry[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const prevEvent = useRef<HardwareEvent | null>(null);

  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting';

  useEffect(() => { if (savedIp) setIpInput(savedIp); }, [savedIp]);

  useEffect(() => {
    if (!lastEvent || lastEvent === prevEvent.current) return;
    prevEvent.current = lastEvent;
    const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLog((prev) => [{ label: formatEvent(lastEvent), time }, ...prev].slice(0, 8));
  }, [lastEvent]);

  const run = async (key: string, action: () => Promise<void>) => {
    setBusy(key);
    try {
      await action();
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? "L'action a échoué.");
    } finally {
      setBusy(null);
    }
  };

  const handleConnect = () => {
    if (!ipInput.trim()) {
      Alert.alert('Adresse requise', "Saisissez l'adresse IP affichée sur l'écran LCD au démarrage.");
      return;
    }
    run('connect', () => connect(ipInput.trim()));
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Appareil</Text>
          <Text style={styles.subtitle}>Connectez-vous au distributeur via le WiFi</Text>

          {/* Carte de connexion */}
          <View style={[styles.connCard, isConnected && styles.connCardActive]}>
            <View style={styles.connTop}>
              <View style={{ flex: 1, marginRight: Spacing.md }}>
                <Text style={styles.connTitle}>
                  {isConnected ? 'Distributeur connecté' : isConnecting ? 'Connexion…' : 'Distributeur hors ligne'}
                </Text>
                <Text style={styles.connSub}>
                  {isConnected
                    ? `Connecté à ${savedIp} · interrogation toutes les 3 s`
                    : isConnecting
                    ? "Tentative de connexion à l'appareil…"
                    : "Saisissez l'adresse IP affichée sur l'écran LCD, puis touchez Connecter."}
                </Text>
              </View>
              <View
                style={[styles.statusDot, {
                  backgroundColor: isConnected ? Colors.taken : isConnecting ? Colors.late : Colors.missed,
                }]}
              />
            </View>

            {!isConnected && (
              <View style={styles.ipRow}>
                <TextInput
                  style={styles.ipInput}
                  value={ipInput}
                  onChangeText={setIpInput}
                  placeholder="ex. 192.168.1.42"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="default"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="off"
                  returnKeyType="done"
                  onSubmitEditing={handleConnect}
                />
                <TouchableOpacity
                  style={[styles.connBtn, isConnecting && styles.connBtnDisabled]}
                  onPress={handleConnect}
                  disabled={isConnecting}
                  activeOpacity={0.8}
                >
                  <Text style={styles.connBtnText}>
                    {busy === 'connect' ? 'Connexion…' : 'Connecter'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {isConnected && (
              <TouchableOpacity style={styles.disconnectBtn} onPress={disconnect} activeOpacity={0.8}>
                <Text style={styles.disconnectBtnText}>Déconnecter</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Commandes */}
          <Text style={styles.sectionTitle}>Commandes</Text>
          <View style={styles.grid}>
            <CtrlBtn
              fonts={fonts} styles={styles}
              label="Synchroniser"
              icon="sync-outline"
              loading={busy === 'sync'}
              disabled={!isConnected || !schedule}
              onPress={() => run('sync', () => syncSchedule(schedule!))}
            />
            <CtrlBtn
              fonts={fonts} styles={styles}
              label="Diagnostic"
              icon="pulse-outline"
              loading={busy === 'diag'}
              disabled={!isConnected}
              onPress={() => run('diag', async () => {
                const d = await runDiag();
                Alert.alert(
                  'Diagnostic du distributeur',
                  `Écran LCD : ${d.lcd ? 'détecté ✓' : 'absent ✗'}\n` +
                  `Horloge RTC : ${d.rtc_hw ? (d.rtc_running ? 'active ✓' : 'présente, arrêtée') : 'logicielle'}\n` +
                  `Bus I2C : ${d.i2c.length ? d.i2c.join(', ') : 'aucun périphérique'}\n` +
                  `Signal WiFi : ${d.rssi} dBm\n` +
                  `Mémoire libre : ${(d.heap / 1024).toFixed(1)} Ko`,
                );
              })}
            />
            <CtrlBtn
              fonts={fonts} styles={styles}
              label="Auto-test moteur"
              icon="construct-outline"
              loading={busy === 'selftest'}
              disabled={!isConnected}
              onPress={() => run('selftest', async () => {
                await runSelfTest();
                Alert.alert('Auto-test terminé', 'Le moteur a effectué sa séquence de test complète.');
              })}
            />
            <CtrlBtn
              fonts={fonts} styles={styles}
              label="Tourner d'un cran"
              icon="refresh-circle-outline"
              loading={busy === 'motor'}
              disabled={!isConnected}
              onPress={() => run('motor', () => testMotor(1))}
            />
          </View>

          {/* Journal d'événements */}
          <Text style={styles.sectionTitle}>Journal d'événements</Text>
          {log.length === 0 ? (
            <View style={styles.emptyLog}>
              <Text style={styles.emptyLogText}>Aucun événement reçu pour le moment.</Text>
            </View>
          ) : (
            log.map((entry, i) => (
              <View key={i} style={styles.logRow}>
                <Text style={styles.logTime}>{entry.time}</Text>
                <Text style={styles.logLabel} numberOfLines={1}>{entry.label}</Text>
              </View>
            ))
          )}

          {/* Aide */}
          <View style={styles.noteCard}>
            <Ionicons name="information-circle-outline" size={fonts.md} color={Colors.textMuted} />
            <Text style={styles.noteText}>
              L'appareil affiche son adresse IP sur l'écran LCD pendant 20 secondes au démarrage.
              Votre téléphone et le distributeur doivent être sur le même réseau WiFi (le partage
              de connexion <Text style={styles.noteHighlight}>iPhone</Text>).
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function formatEvent(evt: HardwareEvent): string {
  switch (evt.evt) {
    case 'dispensed': return `Dose délivrée : ${evt.type}`;
    case 'confirmed': return `Confirmée au bouton : ${evt.type}`;
    case 'error':     return `Erreur : ${evt.msg}`;
    default:          return JSON.stringify(evt);
  }
}

function CtrlBtn({ fonts, styles, label, icon, onPress, loading, disabled }: {
  fonts: Fonts; styles: any; label: string; icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void; loading: boolean; disabled: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.ctrlBtn, disabled && styles.ctrlBtnDisabled]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
    >
      <Ionicons name={icon} size={fonts.lg} color={disabled ? Colors.textMuted : Colors.accent} />
      <Text style={[styles.ctrlLabel, disabled && { color: Colors.textMuted }]}>
        {loading ? '…' : label}
      </Text>
    </TouchableOpacity>
  );
}

function makeStyles(f: Fonts) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: Colors.bg },
    scroll: { flex: 1 },
    content: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },

    title: {
      fontSize: f.xxl, fontWeight: FontWeights.extrabold,
      color: Colors.textPrimary, marginTop: Spacing.lg,
    },
    subtitle: {
      fontSize: f.sm, color: Colors.textSecondary,
      marginTop: 4, marginBottom: Spacing.xl,
    },

    connCard: {
      backgroundColor: Colors.bgCard, borderRadius: Radius.xl,
      padding: Spacing.lg, borderWidth: 1,
      borderColor: Colors.border, marginBottom: Spacing.xl,
    },
    connCardActive: { borderColor: Colors.borderAccent, backgroundColor: Colors.accentDim },
    connTop: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'flex-start', marginBottom: Spacing.md,
    },
    connTitle: { fontSize: f.lg, fontWeight: FontWeights.bold, color: Colors.textPrimary },
    connSub: { fontSize: f.xs, color: Colors.textSecondary, marginTop: 4 },
    statusDot: { width: 13, height: 13, borderRadius: 7, marginTop: 4 },

    ipRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' },
    ipInput: {
      flex: 1, backgroundColor: Colors.bgCardAlt, borderRadius: Radius.md,
      borderWidth: 1, borderColor: Colors.border,
      color: Colors.textPrimary, fontSize: f.md,
      paddingHorizontal: Spacing.md, paddingVertical: 12,
    },
    connBtn: {
      backgroundColor: Colors.accent, borderRadius: Radius.md,
      paddingVertical: 14, paddingHorizontal: Spacing.md, alignItems: 'center',
    },
    connBtnDisabled: { opacity: 0.5 },
    connBtnText: { color: Colors.white, fontSize: f.sm, fontWeight: FontWeights.bold },

    disconnectBtn: {
      borderWidth: 1.5, borderColor: Colors.missed,
      borderRadius: Radius.md, paddingVertical: 13, alignItems: 'center',
    },
    disconnectBtnText: { color: Colors.missed, fontSize: f.md, fontWeight: FontWeights.semibold },

    sectionTitle: {
      fontSize: f.md, fontWeight: FontWeights.bold,
      color: Colors.textPrimary, marginBottom: Spacing.md,
    },

    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.xl },
    ctrlBtn: {
      backgroundColor: Colors.bgCard, borderRadius: Radius.md,
      borderWidth: 1, borderColor: Colors.border,
      paddingVertical: 16, paddingHorizontal: Spacing.sm,
      alignItems: 'center', gap: 6, minWidth: '47%', flex: 1,
    },
    ctrlBtnDisabled: { opacity: 0.4 },
    ctrlLabel: { fontSize: f.xs, fontWeight: FontWeights.semibold, color: Colors.textPrimary, textAlign: 'center' },

    emptyLog: {
      backgroundColor: Colors.bgCard, borderRadius: Radius.md,
      padding: Spacing.lg, alignItems: 'center',
      borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.xl,
    },
    emptyLogText: { color: Colors.textMuted, fontSize: f.sm },

    logRow: {
      backgroundColor: Colors.bgCard, borderRadius: Radius.md,
      paddingHorizontal: Spacing.md, paddingVertical: 12,
      marginBottom: 6, borderWidth: 1, borderColor: Colors.border,
      flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    },
    logTime: { fontSize: f.xs, color: Colors.textMuted, fontWeight: FontWeights.medium, minWidth: 72 },
    logLabel: { fontSize: f.xs, color: Colors.textSecondary, flex: 1 },

    noteCard: {
      flexDirection: 'row', gap: 8, backgroundColor: Colors.bgCardAlt,
      borderRadius: Radius.md, padding: Spacing.md, alignItems: 'flex-start',
      marginTop: Spacing.md,
    },
    noteText: { fontSize: f.xs, color: Colors.textMuted, flex: 1, lineHeight: f.xs * 1.45 },
    noteHighlight: { color: Colors.accent, fontWeight: FontWeights.semibold },
  });
}
