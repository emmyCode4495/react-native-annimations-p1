import React, { useEffect } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { Blur, Canvas, Circle, Fill, Path, Skia } from '@shopify/react-native-skia';
import {
  Easing,
  SharedValue,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { brand } from './brand';

const c = brand.colors;
const TAU = Math.PI * 2;

function wavePath(width: number, y: number, amp: number, phase: number, freq: number) {
  'worklet';
  let d = `M0 ${y}`;
  for (let x = 10; x <= width; x += 10) {
    const u = x / width;
    const envelope = Math.sin(u * Math.PI);
    const yy = y + Math.sin(u * TAU * freq + phase) * amp * envelope;
    d += ` L${x} ${yy.toFixed(1)}`;
  }
  return Skia.Path.MakeFromSVGString(d) ?? Skia.Path.Make();
}

type Props = {
  // 0 = quiet (splash), 1 = full glow (welcome)
  intensity: SharedValue<number>;
  // Set true when a Higgsfield video sits underneath, so the ink fill is skipped
  transparent?: boolean;
};

export function AuroraBackground({ intensity, transparent }: Props) {
  const { width: W, height: H } = useWindowDimensions();
  const t = useSharedValue(0);

  useEffect(() => {
    // One full turn, linear, repeating. Every motion below uses whole multiples of t,
    // so the loop never visibly jumps.
    t.value = withRepeat(withTiming(TAU, { duration: 18000, easing: Easing.linear }), -1, false);
  }, [t]);

  const x1 = useDerivedValue(() => W * 0.25 + Math.cos(t.value) * W * 0.22);
  const y1 = useDerivedValue(() => H * 0.26 + Math.sin(t.value) * H * 0.08);
  const x2 = useDerivedValue(() => W * 0.82 + Math.cos(t.value * 2 + 1) * W * 0.14);
  const y2 = useDerivedValue(() => H * 0.5 + Math.sin(t.value + 2) * H * 0.12);
  const x3 = useDerivedValue(() => W * 0.45 + Math.sin(t.value + 4) * W * 0.25);
  const y3 = useDerivedValue(() => H * 0.84 + Math.cos(t.value * 2) * H * 0.06);

  const glow = useDerivedValue(() => 0.25 + intensity.value * 0.55);
  const lineOpacity = useDerivedValue(() => 0.05 + intensity.value * 0.2);

  const wave1 = useDerivedValue(() => wavePath(W, H * 0.62, 34, t.value * 2, 1.2));
  const wave2 = useDerivedValue(() => wavePath(W, H * 0.66, 26, -t.value * 3 + 1, 1.6));
  const wave3 = useDerivedValue(() => wavePath(W, H * 0.7, 40, t.value + 3, 0.9));

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      {!transparent && <Fill color={c.ink} />}

      <Circle cx={x1} cy={y1} r={W * 0.46} color={c.indigo} opacity={glow}>
        <Blur blur={70} />
      </Circle>
      <Circle cx={x2} cy={y2} r={W * 0.36} color={c.coral} opacity={glow}>
        <Blur blur={70} />
      </Circle>
      <Circle cx={x3} cy={y3} r={W * 0.4} color={c.accent} opacity={glow}>
        <Blur blur={80} />
      </Circle>

      <Path path={wave1} style="stroke" strokeWidth={1.5} color="white" opacity={lineOpacity} />
      <Path path={wave2} style="stroke" strokeWidth={1.2} color="white" opacity={lineOpacity} />
      <Path path={wave3} style="stroke" strokeWidth={1} color="white" opacity={lineOpacity} />
    </Canvas>
  );
}