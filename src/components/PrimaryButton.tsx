import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { brand } from '../brand';
import { PressableScale } from './PressableScale';

const c = brand.colors;

type Props = {
  label: string;
  onPress: () => void;
  tone?: 'accent' | 'danger' | 'ghost';
  disabled?: boolean;
  // Share a row equally with a sibling
  flex?: boolean;
  height?: number;
};

export function PrimaryButton({ label, onPress, tone = 'accent', disabled, flex, height = 58 }: Props) {
  const bg = tone === 'accent' ? c.accent : tone === 'danger' ? c.danger : c.card;
  const fg = tone === 'accent' ? c.onAccent : c.text;
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      haptic
      accessibilityLabel={label}
      containerStyle={flex ? styles.flex : undefined}
      style={[
        styles.btn,
        { height, borderRadius: height / 2, backgroundColor: bg, opacity: disabled ? 0.4 : 1 },
        tone === 'ghost' && styles.ghost,
        tone === 'accent' && styles.glow,
      ]}
    >
      <Text style={[styles.label, { color: fg }]}>{label}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  btn: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  ghost: { borderWidth: 1, borderColor: c.stroke },
  glow: {
    shadowColor: c.accent,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  label: { fontSize: 17, fontWeight: '800', letterSpacing: 0.1 },
});
