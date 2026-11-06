import React, { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { brand } from '../brand';

const c = brand.colors;

export function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  const p = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    p.value = withSpring(value ? 1 : 0, { damping: 14, stiffness: 220 });
  }, [value, p]);

  const track = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(p.value, [0, 1], ['rgba(255,255,255,0.14)', c.accent]),
  }));
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: p.value * 22 }, { scale: 1 + Math.sin(p.value * Math.PI) * 0.12 }] }));

  return (
    <Pressable
      hitSlop={10}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={() => {
        Haptics.selectionAsync();
        onChange(!value);
      }}
    >
      <Animated.View style={[styles.track, track]}>
        <Animated.View style={[styles.knob, knob]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: { width: 52, height: 30, borderRadius: 15, padding: 3 },
  knob: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'white' },
});
