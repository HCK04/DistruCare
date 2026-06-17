import React from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator, StyleSheet,
} from 'react-native';
import { Colors, FontWeights, Radius } from '../theme';
import { useUI } from '../context/UISettings';
import { useHardware } from './HardwareContext';

export default function HardwareStatusBar() {
  const { fonts } = useUI();
  const { status, connect } = useHardware();

  const isConnected  = status === 'connected';
  const isConnecting = status === 'connecting';

  return (
    <TouchableOpacity
      onPress={() => { if (status === 'disconnected') connect(); }}
      disabled={isConnecting || isConnected}
      style={[styles.chip, isConnected && styles.chipActive]}
      activeOpacity={0.7}
    >
      {isConnecting ? (
        <ActivityIndicator size="small" color={Colors.textMuted} />
      ) : (
        <View style={[styles.dot, { backgroundColor: isConnected ? Colors.taken : Colors.textMuted }]} />
      )}
      <Text style={[styles.label, { fontSize: fonts.xs, color: isConnected ? Colors.taken : Colors.textMuted }]}>
        {isConnected ? 'Distributeur' : isConnecting ? 'Connexion…' : 'Connecter'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.bgCardAlt,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    borderColor: Colors.borderAccent,
    backgroundColor: Colors.accentDim,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    fontWeight: FontWeights.semibold,
  },
});
