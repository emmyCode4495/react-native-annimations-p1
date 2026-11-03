import React, { useEffect } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { brand } from '../brand';

const c = brand.colors;
const TAU = Math.PI * 2;

type Props = { top: number };

// Two payment cards that drift gently, plus a "received" notification that drops in.
export function FloatingCards({ top }: Props) {
  const { width: W, height: H } = useWindowDimensions();
  const cw = Math.min(260, W * 0.66, H * 0.3);
  const ch = cw * 0.63;
  const f = useSharedValue(0);

  useEffect(() => {
    f.value = withRepeat(withTiming(1, { duration: 6000, easing: Easing.linear }), -1, false);
  }, [f]);

  const front = useAnimatedStyle(() => ({
    transform: [
      { translateY: Math.sin(f.value * TAU) * 7 },
      { rotate: `${8 + Math.sin(f.value * TAU + 1) * 1.5}deg` },
    ],
  }));
  const back = useAnimatedStyle(() => ({
    transform: [
      { translateY: Math.sin(f.value * TAU + 2) * 9 },
      { rotate: `${-7 + Math.sin(f.value * TAU + 3) * 2}deg` },
    ],
  }));

  return (
    <View pointerEvents="none" style={[styles.wrap, { top, width: W, height: ch + 50 }]}>
      <Animated.View entering={FadeInUp.delay(250).springify().damping(16)} style={[styles.abs, { left: W - cw - 56 }]}>
        <Animated.View style={back}>
          <LinearGradient colors={['#1D2756', '#0E1535']} style={[styles.card, { width: cw, height: ch }, styles.backCard]}>
            <View style={styles.stripe} />
          </LinearGradient>
        </Animated.View>
      </Animated.View>

      <Animated.View entering={FadeInUp.delay(450).springify().damping(15)} style={[styles.abs, { left: W - cw - 28, top: 26 }]}>
        <Animated.View style={front}>
          <LinearGradient
            colors={[c.indigo, '#8250FF', c.coral]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.card, { width: cw, height: ch, padding: cw * 0.07 }]}
          >
            <View style={styles.cardTop}>
              <Text style={styles.cardBrand}>{brand.name}</Text>
              <View style={styles.chip} />
            </View>
            <View style={styles.cardBottom}>
              <Text style={styles.cardNumber}>••••  ••••  ••••  4821</Text>
              <View style={styles.cardMeta}>
                <Text style={styles.cardName}>Alex Morgan</Text>
                <Text style={styles.cardName}>09/29</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(1500).springify().damping(11)} style={[styles.toast, { top: ch + 6, left: 24 }]}>
        <View style={styles.toastIcon}>
          <Text style={styles.toastArrow}>↓</Text>
        </View>
        <View>
          <Text style={styles.toastTitle}>+$250.00 received</Text>
          <Text style={styles.toastSub}>From Amara O.</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0 },
  abs: { position: 'absolute', top: 0 },
  card: { borderRadius: 20, justifyContent: 'space-between' },
  backCard: { borderWidth: 1, borderColor: c.stroke },
  stripe: { marginTop: 22, height: 28, backgroundColor: 'rgba(0,0,0,0.35)' },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardBrand: { color: 'white', fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
  chip: { width: 32, height: 24, borderRadius: 6, backgroundColor: c.accent, opacity: 0.92 },
  cardBottom: { gap: 6 },
  cardNumber: { color: 'white', fontSize: 14, fontWeight: '700', letterSpacing: 1 },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  cardName: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontWeight: '600' },
  toast: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(16,24,52,0.94)',
    borderWidth: 1,
    borderColor: c.stroke,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  toastIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(61,220,151,0.2)', alignItems: 'center', justifyContent: 'center' },
  toastArrow: { color: c.success, fontSize: 16, fontWeight: '800' },
  toastTitle: { color: c.text, fontSize: 14, fontWeight: '700' },
  toastSub: { color: c.muted, fontSize: 12, marginTop: 1 },
});
