import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { brand } from '../brand';
import { Icon } from './Icon';

const c = brand.colors;

// const { show, node } = useToast();  ->  render {node} inside the screen root, call show('Saved')
export function useToast() {
  const insets = useSafeAreaInsets();
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((m: string) => {
    setMsg(m);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 2200);
  }, []);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const node = msg ? (
    <Animated.View key={msg} entering={FadeInDown.springify().damping(14)} exiting={FadeOutUp.duration(200)} style={[styles.toast, { top: insets.top + 8 }]}>
      <View style={styles.icon}>
        <Icon name="check" size={16} color={c.success} />
      </View>
      <Text style={styles.text}>{msg}</Text>
    </Animated.View>
  ) : null;

  return { show, node };
}

const styles = StyleSheet.create({
  toast: { position: 'absolute', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 22, backgroundColor: 'rgba(16,24,52,0.97)', borderWidth: 1, borderColor: c.stroke, zIndex: 120, elevation: 120 },
  icon: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(61,220,151,0.18)', alignItems: 'center', justifyContent: 'center' },
  text: { color: c.text, fontSize: 14, fontWeight: '700' },
});
