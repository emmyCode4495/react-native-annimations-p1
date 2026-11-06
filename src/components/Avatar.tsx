import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

function initials(name: string) {
  const parts = name.replace(/[^A-Za-z ]/g, '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[1][0] : '')).toUpperCase();
}

export function Avatar({ name, color, size = 46, solid }: { name: string; color: string; size?: number; solid?: boolean }) {
  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: size / 2, backgroundColor: solid ? color : color + '2E' }]}>
      <Text style={[styles.text, { fontSize: size * 0.36, color: solid ? '#1A1405' : color }]}>{initials(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  text: { fontWeight: '800', letterSpacing: 0.3 },
});
