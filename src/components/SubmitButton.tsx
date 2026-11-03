import React, { useEffect, useState } from 'react';
import { ActivityIndicator, LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import { assets, brand } from '../brand';

const c = brand.colors;
const H = 64;

export type SubmitStatus = 'idle' | 'loading' | 'success';

type Props = { label: string; status: SubmitStatus; onPress: () => void };

// idle: full-width pill. loading: pill collapses to a circle with a spinner.
// success: the circle plays the Lottie checkmark and a ring bursts out.
export function SubmitButton({ label, status, onPress }: Props) {
  const [fullW, setFullW] = useState(300);
  const morph = useSharedValue(0);
  const press = useSharedValue(0);

  useEffect(() => {
    morph.value = withTiming(status === 'idle' ? 0 : 1, {
      duration: 460,
      easing: Easing.inOut(Easing.cubic),
    });
  }, [status, morph]);

  const onLayout = (e: LayoutChangeEvent) => setFullW(e.nativeEvent.layout.width);

  const pill = useAnimatedStyle(() => ({
    width: interpolate(morph.value, [0, 1], [fullW, H]),
    transform: [{ scale: 1 - press.value * 0.03 }],
  }));
  const labelStyle = useAnimatedStyle(() => ({ opacity: 1 - Math.min(1, morph.value * 2.2) }));
  const spinnerStyle = useAnimatedStyle(() => ({
    opacity: status === 'loading' ? Math.max(0, morph.value * 2 - 1) : 0,
  }));

  return (
    <View style={styles.row} onLayout={onLayout}>
      <Pressable
        disabled={status !== 'idle'}
        onPress={onPress}
        onPressIn={() => press.set(withSpring(1, { damping: 15, stiffness: 300 }))}
        onPressOut={() => press.set(withSpring(0, { damping: 9, stiffness: 220 }))}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Animated.View style={[styles.pill, pill]}>
          <Animated.Text style={[styles.label, labelStyle]}>{label}</Animated.Text>
          <Animated.View style={[StyleSheet.absoluteFill, styles.center, spinnerStyle]}>
            <ActivityIndicator color={c.onAccent} />
          </Animated.View>
        </Animated.View>
      </Pressable>
      {status === 'success' && (
        <LottieView
          source={assets.lottieSuccess}
          autoPlay
          loop={false}
          style={[styles.lottie, { left: (fullW - 200) / 2 }]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { height: H, alignItems: 'center', justifyContent: 'center' },
  pill: {
    height: H,
    borderRadius: H / 2,
    backgroundColor: c.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: c.accent,
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  center: { alignItems: 'center', justifyContent: 'center' },
  label: { color: c.onAccent, fontSize: 18, fontWeight: '800', letterSpacing: 0.2 },
  lottie: { position: 'absolute', pointerEvents: 'none', top: -(200 - H) / 2, width: 200, height: 200 },
});
