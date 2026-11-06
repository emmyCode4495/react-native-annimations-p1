import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInUp, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { brand } from '../brand';
import { Icon, IconName } from './Icon';
import { PressableScale } from './PressableScale';

const c = brand.colors;
const TABS: { label: string; icon: IconName }[] = [
  { label: 'Home', icon: 'home' },
  { label: 'Cards', icon: 'card' },
  { label: 'Pay', icon: 'pay' },
  { label: 'Me', icon: 'user' },
];

type Props = { active: number; onChange: (i: number) => void; bottom: number };

export function TabBar({ active, onChange, bottom }: Props) {
  const [w, setW] = useState(0);
  const x = useSharedValue(0);
  const tabW = w / TABS.length;

  useEffect(() => {
    x.value = withSpring(active * tabW, { damping: 17, stiffness: 230 });
  }, [active, tabW, x]);

  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <Animated.View
      entering={FadeInUp.delay(1100).springify().damping(16)}
      style={[styles.bar, { bottom }]}
      onLayout={(e) => setW(e.nativeEvent.layout.width - 12)}
    >
      <Animated.View style={[styles.pill, { width: tabW }, pill]} />
      {TABS.map((t, i) => (
        <PressableScale
          key={t.label}
          containerStyle={styles.tab}
          style={styles.tabInner}
          scaleTo={0.92}
          accessibilityLabel={t.label}
          onPress={() => {
            if (i !== active) Haptics.selectionAsync();
            onChange(i);
          }}
        >
          <View>
            <Icon name={t.icon} size={22} color={active === i ? c.onAccent : c.muted} />
          </View>
          <Text style={[styles.text, active === i && styles.textOn]}>{t.label}</Text>
        </PressableScale>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 68,
    borderRadius: 34,
    padding: 6,
    flexDirection: 'row',
    backgroundColor: 'rgba(16,24,52,0.96)',
    borderWidth: 1,
    borderColor: c.stroke,
    zIndex: 5,
  },
  pill: { position: 'absolute', left: 6, top: 6, bottom: 6, borderRadius: 28, backgroundColor: c.accent },
  tab: { flex: 1 },
  tabInner: { height: 56, alignItems: 'center', justifyContent: 'center', gap: 3 },
  text: { color: c.muted, fontSize: 11, fontWeight: '700' },
  textOn: { color: c.onAccent },
});
