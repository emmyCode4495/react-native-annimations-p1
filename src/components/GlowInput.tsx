import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOut,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { brand } from '../brand';

const c = brand.colors;

type Props = TextInputProps & {
  label: string;
  error?: string | null;
  // Adds a Show/Hide toggle and masks the text
  password?: boolean;
};

// Floating label, focus glow, and an error state that blends the border to red.
export function GlowInput({ label, error, password, value, onFocus, onBlur, ...rest }: Props) {
  const focus = useSharedValue(0);
  const filled = useSharedValue(value ? 1 : 0);
  const err = useSharedValue(0);
  const [hidden, setHidden] = useState(!!password);

  useEffect(() => {
    filled.value = withTiming(value ? 1 : 0, { duration: 180 });
  }, [value, filled]);

  useEffect(() => {
    err.value = withTiming(error ? 1 : 0, { duration: 220 });
  }, [error, err]);

  const lift = useDerivedValue(() => Math.max(focus.value, filled.value));

  const box = useAnimatedStyle(() => {
    const base = interpolateColor(focus.value, [0, 1], [c.stroke, c.indigo]);
    return {
      borderColor: interpolateColor(err.value, [0, 1], [base, c.danger]),
      shadowColor: err.value > 0.5 ? c.danger : c.indigo,
      shadowOpacity: Math.max(focus.value * 0.55, err.value * 0.4),
      backgroundColor: interpolateColor(focus.value, [0, 1], ['rgba(255,255,255,0.05)', 'rgba(79,91,255,0.10)']),
    };
  });

  const labelStyle = useAnimatedStyle(() => ({
    color: interpolateColor(lift.value, [0, 1], [c.muted, focus.value > 0.5 ? '#C9D0FF' : c.muted]),
    transform: [
      { translateY: interpolate(lift.value, [0, 1], [0, -11]) },
      { scale: interpolate(lift.value, [0, 1], [1, 0.76]) },
    ],
  }));

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.box, box]}>
        <Animated.Text pointerEvents="none" style={[styles.label, labelStyle]}>
          {label}
        </Animated.Text>
        <TextInput
          {...rest}
          value={value}
          secureTextEntry={hidden}
          selectionColor={c.accent}
          placeholderTextColor={c.muted}
          onFocus={(e) => {
            focus.set(withTiming(1, { duration: 200 }));
            onFocus?.(e);
          }}
          onBlur={(e) => {
            focus.set(withTiming(0, { duration: 200 }));
            onBlur?.(e);
          }}
          style={styles.input}
        />
        {password && (
          <Pressable hitSlop={12} onPress={() => setHidden((h) => !h)} style={styles.toggle}>
            <Text style={styles.toggleText}>{hidden ? 'Show' : 'Hide'}</Text>
          </Pressable>
        )}
      </Animated.View>
      {error ? (
        <Animated.Text entering={FadeInDown.duration(200)} exiting={FadeOut.duration(120)} style={styles.error}>
          {error}
        </Animated.Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  box: {
    height: 62,
    borderRadius: 18,
    borderWidth: 1.5,
    justifyContent: 'center',
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
  label: {
    position: 'absolute',
    left: 18,
    fontSize: 16,
    transformOrigin: 'left center',
  },
  input: {
    height: 62,
    paddingTop: 22,
    paddingBottom: 6,
    paddingLeft: 18,
    paddingRight: 64,
    fontSize: 16,
    color: c.text,
  },
  toggle: { position: 'absolute', right: 16, height: 62, justifyContent: 'center' },
  toggleText: { color: c.accent, fontSize: 13, fontWeight: '700' },
  error: { color: c.danger, fontSize: 13, marginTop: 6, marginLeft: 6 },
});
