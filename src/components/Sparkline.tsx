import React, { useEffect, useMemo } from 'react';
import { Blur, Canvas, Circle, LinearGradient, Path, Skia, vec } from '@shopify/react-native-skia';
import {
  Easing,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

type Props = { width: number; height: number; data: number[]; delay?: number };

// Smooth line through the points (Catmull-Rom converted to cubic beziers).
function buildLine(pts: { x: number; y: number }[]) {
  const p = Skia.PathBuilder.Make();
  p.moveTo(pts[0].x, pts[0].y);
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    p.cubicTo(
      p1.x + (p2.x - p0.x) / 6,
      p1.y + (p2.y - p0.y) / 6,
      p2.x - (p3.x - p1.x) / 6,
      p2.y - (p3.y - p1.y) / 6,
      p2.x,
      p2.y,
    );
  }
  return p.build();
}

// The line draws itself left to right, then the area fades in and the end dot starts to pulse.
export function Sparkline({ width, height, data, delay = 0 }: Props) {
  const draw = useSharedValue(0);
  const pulse = useSharedValue(0);

  const { line, area, last } = useMemo(() => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const padY = 10;
    const pts = data.map((d, i) => ({
      x: (i / (data.length - 1)) * (width - 12) + 2,
      y: padY + (1 - (d - min) / (max - min)) * (height - padY * 2),
    }));
    const l = buildLine(pts);
    const a = Skia.PathBuilder.MakeFromPath(l)
      .lineTo(pts[pts.length - 1].x, height)
      .lineTo(pts[0].x, height)
      .close()
      .build();
    return { line: l, area: a, last: pts[pts.length - 1] };
  }, [data, width, height]);

  useEffect(() => {
    draw.value = withDelay(delay, withTiming(1, { duration: 1700, easing: Easing.inOut(Easing.cubic) }));
    pulse.value = withDelay(
      delay + 1700,
      withRepeat(withTiming(1, { duration: 1400, easing: Easing.out(Easing.quad) }), -1, false),
    );
  }, [delay, draw, pulse]);

  const areaOpacity = useDerivedValue(() => Math.max(0, draw.value - 0.4) * 1.2);
  const dotOpacity = useDerivedValue(() => (draw.value > 0.98 ? 1 : 0));
  const haloR = useDerivedValue(() => 5 + pulse.value * 12);
  const haloOpacity = useDerivedValue(() => (draw.value > 0.98 ? (1 - pulse.value) * 0.55 : 0));

  return (
    <Canvas style={{ width, height }}>
      <Path path={area} opacity={areaOpacity}>
        <LinearGradient start={vec(0, 0)} end={vec(0, height)} colors={['rgba(255,255,255,0.35)', 'rgba(255,255,255,0)']} />
      </Path>
      <Path path={line} style="stroke" strokeWidth={5} strokeCap="round" strokeJoin="round" color="white" start={0} end={draw} opacity={0.5}>
        <Blur blur={7} />
      </Path>
      <Path path={line} style="stroke" strokeWidth={3} strokeCap="round" strokeJoin="round" color="white" start={0} end={draw} />
      <Circle cx={last.x} cy={last.y} r={haloR} color="white" opacity={haloOpacity} />
      <Circle cx={last.x} cy={last.y} r={5} color="white" opacity={dotOpacity} />
    </Canvas>
  );
}
