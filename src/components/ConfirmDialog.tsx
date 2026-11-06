import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';
import { brand } from '../brand';
import { Icon, IconName } from './Icon';
import { PrimaryButton } from './PrimaryButton';

const c = brand.colors;

type Props = {
  visible: boolean;
  icon: IconName;
  tone?: 'default' | 'danger';
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

// The one confirmation dialog for every destructive or committing action.
// Render it as the last child of a screen's root view so it covers everything.
export function ConfirmDialog({
  visible,
  icon,
  tone = 'default',
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}: Props) {
  const tint = tone === 'danger' ? c.danger : c.accent;

  return (
    <>
      {visible && (
        <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(160)} style={styles.layer}>
          <Pressable style={styles.scrim} onPress={onCancel} accessibilityLabel="Dismiss" />
          <Animated.View entering={ZoomIn.springify().damping(15).stiffness(220)} style={styles.card}>
            <View style={[styles.iconWrap, { backgroundColor: tint + '26', borderColor: tint + '55' }]}>
              <Icon name={icon} size={30} color={tint} />
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>
            <View style={styles.row}>
              <PrimaryButton label={cancelLabel} tone="ghost" flex height={52} onPress={onCancel} />
              <PrimaryButton label={confirmLabel} tone={tone === 'danger' ? 'danger' : 'accent'} flex height={52} onPress={onConfirm} />
            </View>
          </Animated.View>
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  layer: { ...StyleSheet.absoluteFill, justifyContent: 'center', paddingHorizontal: 28, zIndex: 100, elevation: 100 },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(3,6,18,0.74)' },
  card: {
    padding: 24,
    borderRadius: 30,
    backgroundColor: '#111A3B',
    borderWidth: 1,
    borderColor: c.stroke,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 16 },
  },
  iconWrap: { width: 68, height: 68, borderRadius: 34, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  title: { color: c.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.5, textAlign: 'center' },
  message: { color: c.muted, fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 8, marginBottom: 22 },
  row: { flexDirection: 'row', gap: 12, alignSelf: 'stretch' },
});
