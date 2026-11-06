import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { brand } from '../brand';
import { PressableScale } from './PressableScale';

const c = brand.colors;
export const LIMITS = [500, 1000, 2500, 5000];

function Chip({ amount, selected, onPress }: { amount: number; selected: boolean; onPress: () => void }) {
  const p = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    p.value = withSpring(selected ? 1 : 0, { damping: 15, stiffness: 240 });
  }, [selected, p]);
  const bg = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(p.value, [0, 1], ['rgba(255,255,255,0.06)', c.accent]),
    borderColor: interpolateColor(p.value, [0, 1], [c.stroke, c.accent]),
  }));
  const label = useAnimatedStyle(() => ({ color: interpolateColor(p.value, [0, 1], [c.text, c.onAccent]) }));
  return (
    <PressableScale containerStyle={styles.cell} haptic onPress={onPress} accessibilityLabel={`Limit ${amount} dollars`}>
      <Animated.View style={[styles.chip, bg]}>
        <Animated.Text style={[styles.text, label]}>${amount.toLocaleString('en-US')}</Animated.Text>
      </Animated.View>
    </PressableScale>
  );
}

export function LimitPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={styles.row}>
      {LIMITS.map((l) => (
        <Chip key={l} amount={l} selected={value === l} onPress={() => onChange(l)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cell: { width: '48%' },
  chip: { height: 50, borderRadius: 25, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 16, fontWeight: '800' },
});
