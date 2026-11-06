import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { brand } from '../brand';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

const c = brand.colors;

type Props = { onKey: (k: string) => void; onBack: () => void; size?: number };

export function AmountPad({ onKey, onBack, size = 64 }: Props) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0'];
  return (
    <View style={[styles.grid, { width: size * 3 + 36 }]}>
      {keys.map((k) => (
        <PressableScale key={k} haptic scaleTo={0.9} onPress={() => onKey(k)} style={[styles.key, { width: size, height: size - 8, borderRadius: (size - 8) / 2 }]} accessibilityLabel={k === '.' ? 'Decimal point' : k}>
          <Text style={styles.text}>{k}</Text>
        </PressableScale>
      ))}
      <PressableScale scaleTo={0.9} onPress={onBack} style={[styles.key, { width: size, height: size - 8, borderRadius: (size - 8) / 2 }]} accessibilityLabel="Delete">
        <Icon name="backspace" size={26} color={c.muted} />
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10, alignSelf: 'center' },
  key: { alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)' },
  text: { color: c.text, fontSize: 26, fontWeight: '600' },
});
