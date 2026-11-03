import React, { useMemo } from 'react';
import { Canvas, Group, Path, Skia } from '@shopify/react-native-skia';
import { SharedValue } from 'react-native-reanimated';

// Line icons on a 24x24 grid, drawn as strokes so they can "write themselves" in.
export const ICONS = {
  // paper plane
  send: 'M21 3 L3 9.5 L10 14 L14.5 21 Z M10 14 L21 3',
  // arrow coming down-left into a tray
  request: 'M17 6 L7 16 M7 8.5 V16 H14.5 M4 21 H20',
  // plus in a circle
  topup: 'M12 3 A9 9 0 1 1 11.99 3 Z M12 8 V16 M8 12 H16',
  // four tiles
  more: 'M5.8 4 H8.2 A1.8 1.8 0 0 1 10 5.8 V8.2 A1.8 1.8 0 0 1 8.2 10 H5.8 A1.8 1.8 0 0 1 4 8.2 V5.8 A1.8 1.8 0 0 1 5.8 4 Z ' +
    'M15.8 4 H18.2 A1.8 1.8 0 0 1 20 5.8 V8.2 A1.8 1.8 0 0 1 18.2 10 H15.8 A1.8 1.8 0 0 1 14 8.2 V5.8 A1.8 1.8 0 0 1 15.8 4 Z ' +
    'M5.8 14 H8.2 A1.8 1.8 0 0 1 10 15.8 V18.2 A1.8 1.8 0 0 1 8.2 20 H5.8 A1.8 1.8 0 0 1 4 18.2 V15.8 A1.8 1.8 0 0 1 5.8 14 Z ' +
    'M15.8 14 H18.2 A1.8 1.8 0 0 1 20 15.8 V18.2 A1.8 1.8 0 0 1 18.2 20 H15.8 A1.8 1.8 0 0 1 14 18.2 V15.8 A1.8 1.8 0 0 1 15.8 14 Z',
} as const;

export type IconName = keyof typeof ICONS;

type Props = {
  name: IconName;
  size: number;
  color: string;
  // 0..1, trims the stroke so the icon draws itself. Omit for a fully drawn icon.
  progress?: SharedValue<number>;
};

export function Icon({ name, size, color, progress }: Props) {
  const path = useMemo(() => Skia.Path.MakeFromSVGString(ICONS[name]) ?? Skia.Path.Make(), [name]);

  return (
    <Canvas style={{ width: size, height: size }}>
      <Group transform={[{ scale: size / 24 }]}>
        <Path
          path={path}
          style="stroke"
          strokeWidth={1.9}
          strokeCap="round"
          strokeJoin="round"
          color={color}
          start={0}
          end={progress ?? 1}
        />
      </Group>
    </Canvas>
  );
}
