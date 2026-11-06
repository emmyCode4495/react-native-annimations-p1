import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { brand } from '../brand';

const c = brand.colors;

type Props = { options: string[]; index: number; onChange: (i: number) => void };

export function SegmentedControl({ options, index, onChange }: Props) {
  const [w, setW] = useState(0);
  const x = useSharedValue(index);
  const segW = w / options.length;

  useEffect(() => {
    x.value = withSpring(index, { damping: 16, stiffness: 220 });
  }, [index, x]);

  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.value * segW }] }));

  return (
    <View style={styles.seg} onLayout={(e) => setW(e.nativeEvent.layout.width - 8)}>
      <Animated.View style={[styles.pill, { width: segW }, pill]} />
      {options.map((o, i) => (
        <Pressable
          key={o}
          style={styles.tab}
          accessibilityRole="button"
          onPress={() => {
            if (i !== index) Haptics.selectionAsync();
            onChange(i);
          }}
        >
          <Text style={[styles.text, index === i && styles.textOn]}>{o}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  seg: { flexDirection: 'row', padding: 4, borderRadius: 18, backgroundColor: c.card, borderWidth: 1, borderColor: c.stroke },
  pill: { position: 'absolute', left: 4, top: 4, bottom: 4, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.14)' },
  tab: { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center' },
  text: { color: c.muted, fontSize: 15, fontWeight: '700' },
  textOn: { color: c.text },
});
