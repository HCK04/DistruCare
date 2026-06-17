import React, { useRef, useEffect, useMemo } from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import { Colors, Fonts, FontWeights, Radius, Shadows, Spacing } from '../theme';
import { useUI } from '../context/UISettings';

interface Props {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  confirmColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  visible,
  title,
  body,
  confirmLabel = 'Confirmer',
  confirmColor = Colors.accent,
  onConfirm,
  onCancel,
}: Props) {
  const { fonts } = useUI();
  const styles = useMemo(() => makeStyles(fonts), [fonts]);
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    } else {
      scale.setValue(0.9);
      opacity.setValue(0);
    }
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onCancel}>
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View style={[styles.sheet, Shadows.card, { transform: [{ scale }], opacity }]}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.body}>{body}</Text>
              <View style={styles.row}>
                <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={onCancel}>
                  <Text style={styles.cancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btn, { backgroundColor: confirmColor }]}
                  onPress={onConfirm}
                >
                  <Text style={styles.confirmText}>{confirmLabel}</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

function makeStyles(f: Fonts) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: Colors.overlay,
      alignItems: 'center',
      justifyContent: 'center',
      padding: Spacing.lg,
    },
    sheet: {
      backgroundColor: Colors.bgModal,
      borderRadius: Radius.xl,
      padding: Spacing.xl,
      width: '100%',
      maxWidth: 380,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    title: {
      fontSize: f.xl,
      fontWeight: FontWeights.bold,
      color: Colors.textPrimary,
      marginBottom: Spacing.sm,
    },
    body: {
      fontSize: f.md,
      color: Colors.textSecondary,
      lineHeight: f.md * 1.5,
      marginBottom: Spacing.xl,
    },
    row: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    btn: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: Radius.md,
      alignItems: 'center',
      minHeight: 56,
      justifyContent: 'center',
    },
    cancelBtn: {
      backgroundColor: Colors.bgCardAlt,
    },
    cancelText: {
      color: Colors.textSecondary,
      fontSize: f.md,
      fontWeight: FontWeights.semibold,
    },
    confirmText: {
      color: Colors.white,
      fontSize: f.md,
      fontWeight: FontWeights.bold,
    },
  });
}
