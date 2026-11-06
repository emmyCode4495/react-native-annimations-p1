import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { brand } from '../brand';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

const c = brand.colors;
type Status = 'idle' | 'ok' | 'error';

function Dot({ filled, status }: { filled: boolean; status: Status }) {
  const f = useSharedValue(0);
  useEffect(() => {
    f.value = withSpring(filled ? 1 : 0, { damping: 11, stiffness: 260 });
  }, [filled, f]);
  const color = status === 'ok' ? c.success : status === 'error' ? c.danger : c.accent;
  const style = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(f.value, [0, 1], ['rgba(255,255,255,0)', color]),
    borderColor: interpolateColor(f.value, [0, 1], [c.stroke, color]),
    transform: [{ scale: 1 + f.value * 0.18 }],
  }));
  return <Animated.View style={[styles.dot, style]} />;
}

type Props = {
  validate: (pin: string) => boolean;
  onSuccess: () => void;
};

export function PinPad({ validate, onSuccess }: Props) {
  const [pin, setPin] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const shake = useSharedValue(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const list = timers.current;
    return () => list.forEach(clearTimeout);
  }, []);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };

  const press = (d: string) => {
    if (status !== 'idle' || pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    if (next.length < 4) return;
    later(() => {
      if (validate(next)) {
        setStatus('ok');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        later(onSuccess, 550);
      } else {
        setStatus('error');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        shake.set(
          withSequence(
            withTiming(-12, { duration: 50 }),
            withRepeat(withTiming(12, { duration: 90 }), 5, true),
            withTiming(0, { duration: 50 }),
          ),
        );
        later(() => {
          setPin('');
          setStatus('idle');
        }, 650);
      }
    }, 180);
  };

  const del = () => {
    if (status !== 'idle') return;
    setPin((p) => p.slice(0, -1));
    Haptics.selectionAsync();
  };

  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.dots, shakeStyle]}>
        {[0, 1, 2, 3].map((i) => (
          <Dot key={i} filled={i < pin.length} status={status} />
        ))}
      </Animated.View>
      <Text style={[styles.hint, status === 'error' && { color: c.danger }]}>
        {status === 'error' ? 'Incorrect PIN. Try again.' : status === 'ok' ? 'Verified' : ' '}
      </Text>
      <View style={styles.grid}>
        {keys.map((k) => (
          <PressableScale key={k} haptic scaleTo={0.9} onPress={() => press(k)} style={styles.key} accessibilityLabel={k}>
            <Text style={styles.keyText}>{k}</Text>
          </PressableScale>
        ))}
        <View style={styles.key} />
        <PressableScale haptic scaleTo={0.9} onPress={() => press('0')} style={styles.key} accessibilityLabel="0">
          <Text style={styles.keyText}>0</Text>
        </PressableScale>
        <PressableScale scaleTo={0.9} onPress={del} style={styles.key} accessibilityLabel="Delete">
          <Icon name="backspace" size={28} color={c.muted} />
        </PressableScale>
      </View>
    </View>
  );
}

const KEY = 76;
const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  dots: { flexDirection: 'row', gap: 18, marginTop: 8 },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5 },
  hint: { color: c.muted, fontSize: 14, marginTop: 16, marginBottom: 26, height: 20 },
  grid: { width: KEY * 3 + 24 * 2, flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'space-between' },
  key: { width: KEY, height: KEY, borderRadius: KEY / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.06)' },
  keyText: { color: c.text, fontSize: 30, fontWeight: '600' },
});
