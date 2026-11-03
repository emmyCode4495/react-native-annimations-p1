import React, { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { Blur, Canvas, Circle, Fill, Path, Points, Skia, vec } from '@shopify/react-native-skia';
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

// Account nodes as fractions of the screen, and the payment routes between them.
const NODES = [
  [0.12, 0.2], [0.8, 0.16], [0.55, 0.34], [0.9, 0.46],
  [0.2, 0.5], [0.62, 0.62], [0.1, 0.78], [0.85, 0.8],
];
const ROUTES: { a: number; b: number; color: string; speed: number; phase: number; bend: number }[] = [
  { a: 0, b: 2, color: c.accent, speed: 1, phase: 0.0, bend: 0.18 },
  { a: 2, b: 1, color: '#9AA4FF', speed: 1, phase: 0.35, bend: -0.2 },
  { a: 2, b: 3, color: c.coral, speed: 2, phase: 0.6, bend: 0.16 },
  { a: 4, b: 2, color: c.accent, speed: 1, phase: 0.8, bend: -0.15 },
  { a: 4, b: 5, color: '#9AA4FF', speed: 1, phase: 0.2, bend: 0.2 },
  { a: 5, b: 3, color: c.accent, speed: 2, phase: 0.45, bend: -0.18 },
  { a: 6, b: 5, color: c.coral, speed: 1, phase: 0.7, bend: 0.15 },
  { a: 5, b: 7, color: c.accent, speed: 1, phase: 0.1, bend: -0.2 },
];

function Route({
  path,
  t,
  intensity,
  color,
  speed,
  phase,
}: {
  path: ReturnType<typeof Skia.Path.Make>;
  t: SharedValue<number>;
  intensity: SharedValue<number>;
  color: string;
  speed: number;
  phase: number;
}) {
  // Head position along the route. `speed` is a whole number, so the loop never jumps.
  const head = useDerivedValue(() => (t.value * speed + phase) % 1);
  const end = useDerivedValue(() => head.value);
  const start = useDerivedValue(() => Math.max(0, head.value - 0.2));
  const fade = useDerivedValue(() => Math.min(1, head.value * 6, (1 - head.value) * 6));
  const opacity = useDerivedValue(() => (0.15 + intensity.value * 0.85) * fade.value);

  return (
    <>
      <Path path={path} style="stroke" strokeWidth={5} strokeCap="round" color={color} start={start} end={end} opacity={opacity}>
        <Blur blur={6} />
      </Path>
      <Path path={path} style="stroke" strokeWidth={2.2} strokeCap="round" color={color} start={start} end={end} opacity={opacity} />
    </>
  );
}

function Node({ x, y, t, index, intensity }: { x: number; y: number; t: SharedValue<number>; index: number; intensity: SharedValue<number> }) {
  const halo = useDerivedValue(() => 10 + (Math.sin(t.value * TAU + index * 1.3) + 1) * 4);
  const haloOpacity = useDerivedValue(() => (0.12 + intensity.value * 0.25) * (0.6 + 0.4 * Math.sin(t.value * TAU + index)));
  const coreOpacity = useDerivedValue(() => 0.3 + intensity.value * 0.6);
  return (
    <>
      <Circle cx={x} cy={y} r={halo} color={c.indigo} opacity={haloOpacity}>
        <Blur blur={8} />
      </Circle>
      <Circle cx={x} cy={y} r={3.2} color="white" opacity={coreOpacity} />
    </>
  );
}

type Props = {
  // 0 = quiet (splash), 1 = full activity (welcome)
  intensity: SharedValue<number>;
  // Set true when a video sits underneath, so the ink fill is skipped
  transparent?: boolean;
};

// A quiet payments network: a faint ledger grid, account nodes, and light pulses that travel
// between them like transfers. Drop-in replacement for AuroraBackground (same props).
export function FlowBackground({ intensity, transparent }: Props) {
  const { width: W, height: H } = useWindowDimensions();
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 14000, easing: Easing.linear }), -1, false);
  }, [t]);

  const grid = useMemo(() => {
    const step = 30;
    const pts = [];
    for (let x = step / 2; x < W; x += step) for (let y = step / 2; y < H; y += step) pts.push(vec(x, y));
    return pts;
  }, [W, H]);

  const routes = useMemo(
    () =>
      ROUTES.map((r) => {
        const ax = NODES[r.a][0] * W, ay = NODES[r.a][1] * H;
        const bx = NODES[r.b][0] * W, by = NODES[r.b][1] * H;
        const mx = (ax + bx) / 2, my = (ay + by) / 2;
        const dx = bx - ax, dy = by - ay;
        // control point pushed sideways from the midpoint so every route is a soft arc
        const path = Skia.PathBuilder.Make()
          .moveTo(ax, ay)
          .quadTo(mx - dy * r.bend, my + dx * r.bend, bx, by)
          .build();
        return { ...r, path };
      }),
    [W, H],
  );

  const gx1 = useDerivedValue(() => W * 0.25 + Math.cos(t.value * TAU) * W * 0.18);
  const gy1 = useDerivedValue(() => H * 0.3 + Math.sin(t.value * TAU) * H * 0.06);
  const gx2 = useDerivedValue(() => W * 0.8 + Math.cos(t.value * TAU + 2) * W * 0.12);
  const gy2 = useDerivedValue(() => H * 0.62 + Math.sin(t.value * TAU + 1) * H * 0.08);
  const glow = useDerivedValue(() => 0.16 + intensity.value * 0.3);
  const gridOpacity = useDerivedValue(() => 0.05 + intensity.value * 0.1);
  const arcOpacity = useDerivedValue(() => 0.04 + intensity.value * 0.1);

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      {!transparent && <Fill color={c.ink} />}
      <Circle cx={gx1} cy={gy1} r={W * 0.5} color={c.indigo} opacity={glow}>
        <Blur blur={80} />
      </Circle>
      <Circle cx={gx2} cy={gy2} r={W * 0.36} color={c.coral} opacity={glow}>
        <Blur blur={80} />
      </Circle>

      <Points points={grid} mode="points" style="stroke" strokeWidth={1.6} strokeCap="round" color="white" opacity={gridOpacity} />

      {routes.map((r, i) => (
        <Path key={`arc${i}`} path={r.path} style="stroke" strokeWidth={1} color="white" opacity={arcOpacity} />
      ))}
      {routes.map((r, i) => (
        <Route key={`pulse${i}`} path={r.path} t={t} intensity={intensity} color={r.color} speed={r.speed} phase={r.phase} />
      ))}
      {NODES.map(([nx, ny], i) => (
        <Node key={`n${i}`} x={nx * W} y={ny * H} t={t} index={i} intensity={intensity} />
      ))}
    </Canvas>
  );
}
