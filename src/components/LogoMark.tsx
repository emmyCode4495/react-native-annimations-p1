import React, { useEffect, useMemo } from 'react';
import {
  Canvas,
  Circle,
  Group,
  LinearGradient,
  Oval,
  RadialGradient,
  RoundedRect,
  Skia,
  vec,
} from '@shopify/react-native-skia';
import {
  Easing,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { brand } from '../brand';

const c = brand.colors;
const TAU = Math.PI * 2;

// Keep in sync with scripts/make_logo_assets.py (static icon + SVG).
const BARS = [0.24, 0.36, 0.5]; // heights as a fraction of the mark
const BAR_W = 0.13;
const BAR_GAP = 0.07;
const BASE_Y = 0.72;

type Props = { size: number; delay?: number };

function Bar({ size, i, grow }: { size: number; i: number; grow: ReturnType<typeof useSharedValue<number>> }) {
  const w = size * BAR_W;
  const x = size * (0.235 + i * (BAR_W + BAR_GAP));
  const full = size * BARS[i];
  const h = useDerivedValue(() => Math.max(0.01, full * grow.value));
  const y = useDerivedValue(() => size * BASE_Y - h.value);
  return (
    <RoundedRect x={x} y={y} width={w} height={h} r={w * 0.4} color={i === 2 ? c.accent : 'white'} opacity={i === 2 ? 1 : 0.94} />
  );
}

// Tallyo mark: a liquid-glass orb with slow-moving color inside and three rising bars
// (a tally that grows). The bars rise on mount, then the orb keeps drifting.
export function LogoMark({ size, delay = 0 }: Props) {
  const t = useSharedValue(0);
  const g0 = useSharedValue(0);
  const g1 = useSharedValue(0);
  const g2 = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 12000, easing: Easing.linear }), -1, false);
    const spring = { damping: 11, stiffness: 140 };
    g0.value = withDelay(delay, withSpring(1, spring));
    g1.value = withDelay(delay + 110, withSpring(1, spring));
    g2.value = withDelay(delay + 220, withSpring(1, spring));
  }, [t, g0, g1, g2, delay]);

  const S = size;
  const clip = useMemo(() => Skia.PathBuilder.Make().addCircle(S / 2, S / 2, S / 2).build(), [S]);

  const coral = useDerivedValue(() => vec(S * (0.64 + Math.cos(t.value * TAU) * 0.2), S * (0.7 + Math.sin(t.value * TAU) * 0.12)));
  const gold = useDerivedValue(() => vec(S * (0.28 + Math.cos(t.value * TAU + 2.2) * 0.16), S * (0.74 + Math.sin(t.value * TAU + 2.2) * 0.1)));
  const light = useDerivedValue(() => vec(S * (0.66 + Math.cos(t.value * TAU + 4.1) * 0.14), S * (0.26 + Math.sin(t.value * TAU + 4.1) * 0.1)));

  return (
    <Canvas style={{ width: S, height: S }}>
      <Group clip={clip}>
        <Circle cx={S / 2} cy={S / 2} r={S / 2}>
          <RadialGradient c={vec(S * 0.38, S * 0.3)} r={S * 0.9} colors={['#7D86FF', c.indigo, '#1A1F66']} positions={[0, 0.45, 1]} />
        </Circle>
        <Circle cx={S / 2} cy={S / 2} r={S}>
          <RadialGradient c={coral} r={S * 0.37} colors={['rgba(255,107,154,0.9)', 'rgba(255,107,154,0)']} />
        </Circle>
        <Circle cx={S / 2} cy={S / 2} r={S}>
          <RadialGradient c={gold} r={S * 0.29} colors={['rgba(255,200,87,0.75)', 'rgba(255,200,87,0)']} />
        </Circle>
        <Circle cx={S / 2} cy={S / 2} r={S}>
          <RadialGradient c={light} r={S * 0.33} colors={['rgba(154,164,255,0.7)', 'rgba(154,164,255,0)']} />
        </Circle>
        <Oval x={S * 0.17} y={S * 0.08} width={S * 0.52} height={S * 0.3} opacity={0.5}>
          <LinearGradient start={vec(0, S * 0.08)} end={vec(0, S * 0.38)} colors={['rgba(255,255,255,0.85)', 'rgba(255,255,255,0)']} />
        </Oval>
        <Bar size={S} i={0} grow={g0} />
        <Bar size={S} i={1} grow={g1} />
        <Bar size={S} i={2} grow={g2} />
      </Group>
      <Circle cx={S / 2} cy={S / 2} r={S / 2 - S * 0.01} style="stroke" strokeWidth={S * 0.02} color="white" opacity={0.22} />
    </Canvas>
  );
}
