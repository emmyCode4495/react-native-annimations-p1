import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, SharedValue, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { brand } from '../brand';

const c = brand.colors;
const TAU = Math.PI * 2;
const COLORS = [c.accent, c.coral, c.indigo, '#9AA4FF', c.success, '#FFFFFF'];

// Deterministic pseudo-random so every take of the recording looks the same.
function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

type Piece = { angle: number; speed: number; w: number; h: number; spin: number; color: string };

function Particle({ p, prog }: { p: Piece; prog: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    const t = prog.value;
    return {
      opacity: t < 0.7 ? 1 : Math.max(0, 1 - (t - 0.7) / 0.3),
      transform: [
        { translateX: Math.cos(p.angle) * p.speed * t },
        { translateY: Math.sin(p.angle) * p.speed * t + 280 * t * t },
        { rotate: `${p.spin * t}deg` },
      ],
    };
  });
  return <Animated.View style={[styles.piece, { width: p.w, height: p.h, backgroundColor: p.color }, style]} />;
}

// Bursts outward from its own origin (position it with an absolute wrapper).
export function Confetti({ count = 32 }: { count?: number }) {
  const prog = useSharedValue(0);

  useEffect(() => {
    prog.value = withTiming(1, { duration: 1900, easing: Easing.out(Easing.quad) });
  }, [prog]);

  const pieces = useMemo<Piece[]>(
    () =>
      Array.from({ length: count }, (_, i) => ({
        angle: rand(i + 1) * TAU,
        speed: 120 + rand(i + 50) * 210,
        w: 6 + rand(i + 90) * 6,
        h: 3 + rand(i + 20) * 5,
        spin: (rand(i + 130) - 0.5) * 1000,
        color: COLORS[i % COLORS.length],
      })),
    [count],
  );

  return (
    <View pointerEvents="none" style={styles.origin}>
      {pieces.map((p, i) => (
        <Particle key={i} p={p} prog={prog} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  origin: { position: 'absolute', left: 0, top: 0, width: 0, height: 0 },
  piece: { position: 'absolute', borderRadius: 2 },
});
