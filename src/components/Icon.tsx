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
  // phase 2
  lock: 'M6 11 H18 A1 1 0 0 1 19 12 V19 A1 1 0 0 1 18 20 H6 A1 1 0 0 1 5 19 V12 A1 1 0 0 1 6 11 Z M8 11 V8 A4 4 0 0 1 16 8 V11',
  plus: 'M12 5 V19 M5 12 H19',
  check: 'M5 12.5 L10 17.5 L19 7',
  close: 'M6 6 L18 18 M18 6 L6 18',
  back: 'M15 5 L8 12 L15 19',
  freeze: 'M12 3 V21 M4.2 7.5 L19.8 16.5 M4.2 16.5 L19.8 7.5 M9.5 4.8 L12 7 L14.5 4.8 M9.5 19.2 L12 17 L14.5 19.2',
  eye: 'M2 12 C4.5 7.5 8 5.5 12 5.5 C16 5.5 19.5 7.5 22 12 C19.5 16.5 16 18.5 12 18.5 C8 18.5 4.5 16.5 2 12 Z M12 9 A3 3 0 1 1 11.99 9 Z',
  limit: 'M4 17 A9 9 0 1 1 20 17 M12 13 L15.5 8.5',
  trash: 'M4 7 H20 M9 7 V4.5 H15 V7 M6.5 7 L7.5 19.5 A1 1 0 0 0 8.5 20.5 H15.5 A1 1 0 0 0 16.5 19.5 L17.5 7 M10 11 V16.5 M14 11 V16.5',
  warning: 'M12 4 L21 20 H3 Z M12 10 V14 M12 17 V17.2',
  shield: 'M12 3 L19 6 V12 C19 16.5 16 19.5 12 21 C8 19.5 5 16.5 5 12 V6 Z M9 12 L11.2 14.2 L15 10',
  bolt: 'M13 2 L4 14 H11 L10 22 L20 9 H13 Z',
  truck: 'M2 7 H14 V17 H2 Z M14 10 H18 L21 13 V17 H14 M6.5 19 A1.5 1.5 0 1 1 6.49 19 Z M17.5 19 A1.5 1.5 0 1 1 17.49 19 Z',
  backspace: 'M9 6 H20 A1 1 0 0 1 21 7 V17 A1 1 0 0 1 20 18 H9 L3 12 Z M12 9.5 L16.5 14.5 M16.5 9.5 L12 14.5',
  home: 'M4 11 L12 4 L20 11 V19 A1 1 0 0 1 19 20 H5 A1 1 0 0 1 4 19 Z M10 20 V14 H14 V20',
  card: 'M6 5 H18 A3 3 0 0 1 21 8 V16 A3 3 0 0 1 18 19 H6 A3 3 0 0 1 3 16 V8 A3 3 0 0 1 6 5 Z M3 10 H21 M7 15 H11',
  pay: 'M4 8 H18 M14 4 L18 8 L14 12 M20 16 H6 M10 12 L6 16 L10 20',
  user: 'M12 12 A4 4 0 1 1 11.99 12 Z M4 20 C4 16.5 7.5 14.5 12 14.5 C16.5 14.5 20 16.5 20 20',
  // phase 3 (pay + me)
  search: 'M11 4 A7 7 0 1 1 10.99 4 Z M16 16 L20.5 20.5',
  chevron: 'M9 5 L16 12 L9 19',
  bell: 'M6 17 V11 A6 6 0 0 1 18 11 V17 L20 19 H4 Z M10 21 H14',
  eyeoff: 'M2 12 C4.5 7.5 8 5.5 12 5.5 C16 5.5 19.5 7.5 22 12 C19.5 16.5 16 18.5 12 18.5 C8 18.5 4.5 16.5 2 12 Z M12 9 A3 3 0 1 1 11.99 9 Z M4 4 L20 20',
  help: 'M12 3 A9 9 0 1 1 11.99 3 Z M9.5 9.5 A2.5 2.5 0 0 1 14.5 9.5 C14.5 11.5 12 11.5 12 13.5 M12 16.8 V17',
  logout: 'M9 4 H6 A2 2 0 0 0 4 6 V18 A2 2 0 0 0 6 20 H9 M16 8 L21 12 L16 16 M21 12 H9',
  edit: 'M4 20 L5 15 L16 4 L20 8 L9 19 Z M14 6 L18 10',
  mail: 'M4 6 H20 V18 H4 Z M4 7 L12 13 L20 7',
  share: 'M12 3 V15 M7.5 7.5 L12 3 L16.5 7.5 M5 12 V19 A1 1 0 0 0 6 20 H18 A1 1 0 0 0 19 19 V12',
  circle: 'M12 4 A8 8 0 1 1 11.99 4 Z',
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
