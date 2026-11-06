import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Canvas, Path, Skia, SweepGradient, vec } from '@shopify/react-native-skia';
import { Easing, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { brand } from '../brand';

const c = brand.colors;
const STROKE = 10;

type Props = { size: number; progress: number; delay?: number; label?: string };

// Ring that fills to `progress` (0..1) with a round cap and a sweep gradient.
export function BudgetRing({ size, progress, delay = 0, label = 'used' }: Props) {
  const fill = useSharedValue(0);

  const arc = useMemo(() => {
    const r = size / 2 - STROKE;
    return Skia.PathBuilder.Make()
      .addArc({ x: size / 2 - r, y: size / 2 - r, width: r * 2, height: r * 2 }, -90, 359.9)
      .build();
  }, [size]);

  useEffect(() => {
    fill.value = withDelay(delay, withTiming(progress, { duration: 1500, easing: Easing.out(Easing.cubic) }));
  }, [progress, delay, fill]);

  return (
    <View style={{ width: size, height: size }}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Path path={arc} style="stroke" strokeWidth={STROKE} color="rgba(255,255,255,0.09)" />
        <Path path={arc} style="stroke" strokeWidth={STROKE} strokeCap="round" start={0} end={fill}>
          <SweepGradient c={vec(size / 2, size / 2)} colors={[c.indigo, c.coral, c.accent]} />
        </Path>
      </Canvas>
      <View style={[StyleSheet.absoluteFill, styles.center]}>
        <Text style={styles.pct}>{Math.round(progress * 100)}%</Text>
        <Text style={styles.sub}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  pct: { color: c.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  sub: { color: c.muted, fontSize: 12, marginTop: 1 },
});
