import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

// The touch zone is bigger than the button. When a finger lands anywhere in
// the zone, the button leans toward it like a magnet. On release it snaps back
// with a wobble. That oversized zone is what makes it feel magnetic on touch.
const ZONE_W = 340;
const ZONE_H = 150;
const DEFAULT_BTN_W = 264;
const DEFAULT_BTN_H = 64;

const PULL = 0.32; // how much of the finger offset the button follows
const MAX_X = 26;
const MAX_Y = 16;

const FOLLOW = { damping: 18, stiffness: 220, mass: 0.6 };
const SNAP = { damping: 14, stiffness: 260, mass: 0.5 };
const RELEASE = { damping: 6, stiffness: 170, mass: 0.7 }; // underdamped = wobble

type Props = {
  label: string;
  color: string;
  textColor: string;
  onPress?: () => void;
  width?: number;
  height?: number;
};

function limit(v: number, max: number) {
  'worklet';
  return Math.max(-max, Math.min(max, v));
}

export function MagneticButton({
  label,
  color,
  textColor,
  onPress,
  width = DEFAULT_BTN_W,
  height = DEFAULT_BTN_H,
}: Props) {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const pressed = useSharedValue(0);
  const ring = useSharedValue(0);

  // Idle invitation: a slow ring that pulses out from the button.
  useEffect(() => {
    ring.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }),
      -1,
      false,
    );
  }, [ring]);

  const lightTick = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  const confirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress?.();
  };

  const pull = (x: number, y: number, config: typeof FOLLOW) => {
    'worklet';
    const dx = x - ZONE_W / 2;
    const dy = y - ZONE_H / 2;
    tx.value = withSpring(limit(dx * PULL, MAX_X), config);
    ty.value = withSpring(limit(dy * PULL, MAX_Y), config);
  };

  const pan = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      pressed.value = withSpring(1, SNAP);
      pull(e.x, e.y, SNAP);
      runOnJS(lightTick)();
    })
    .onUpdate((e) => {
      pull(e.x, e.y, FOLLOW);
    })
    .onFinalize(() => {
      pressed.value = withSpring(0, RELEASE);
      tx.value = withSpring(0, RELEASE);
      ty.value = withSpring(0, RELEASE);
    });

  const tap = Gesture.Tap()
    .maxDistance(60)
    .onEnd((_e, success) => {
      if (success) runOnJS(confirm)();
    });

  const gesture = Gesture.Simultaneous(pan, tap);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: 1 + pressed.value * 0.05 },
    ],
  }));

  // The label travels further than the button, a small parallax that sells depth.
  const labelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value * 0.55 }, { translateY: ty.value * 0.55 }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: (1 - ring.value) * 0.45 * (1 - pressed.value),
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { scale: 1 + ring.value * 0.3 },
    ],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.zone} accessible accessibilityRole="button" accessibilityLabel={label}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ring,
            { width, height, borderRadius: height / 2, borderColor: color },
            ringStyle,
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.button,
            {
              width,
              height,
              borderRadius: height / 2,
              backgroundColor: color,
              shadowColor: color,
            },
            buttonStyle,
          ]}
        >
          <Animated.Text style={[styles.label, { color: textColor }, labelStyle]}>
            {label}
          </Animated.Text>
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  zone: {
    width: ZONE_W,
    height: ZONE_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.45,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  ring: {
    position: 'absolute',
    borderWidth: 2,
  },
  label: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
