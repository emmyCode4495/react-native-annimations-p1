import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { brand } from '../brand';
import { CardModel } from '../cards-store';
import { THEMES, ThemeKey } from '../cardThemes';
import { Icon } from './Icon';

const c = brand.colors;

export const CARD_RATIO = 0.63;

type FaceCard = Pick<CardModel, 'name' | 'kind' | 'theme' | 'number' | 'last4' | 'expiry' | 'frozen'>;

// Cross-fades between themes: the previous gradient stays underneath while the new one fades in.
function ThemedGradient({ theme }: { theme: ThemeKey }) {
  const [shown, setShown] = useState(theme);
  const [under, setUnder] = useState(theme);
  if (shown !== theme) {
    setUnder(shown);
    setShown(theme);
  }
  return (
    <>
      <LinearGradient colors={THEMES[under].colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <Animated.View key={shown} entering={FadeIn.duration(520)} style={StyleSheet.absoluteFill}>
        <LinearGradient colors={THEMES[shown].colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      </Animated.View>
    </>
  );
}

export function CardFace({ card, width, revealed }: { card: FaceCard; width: number; revealed?: boolean }) {
  const h = width * CARD_RATIO;
  const k = width / 300;
  const preview = card.last4 === '';
  const number = revealed && !preview ? card.number : `••••  ••••  ••••  ${preview ? '••••' : card.last4}`;

  return (
    <View style={{ width, height: h, borderRadius: 22 * k, overflow: 'hidden' }}>
      <ThemedGradient theme={card.theme} />
      <LinearGradient
        colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.7, y: 0.6 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={{ flex: 1, padding: 20 * k, justifyContent: 'space-between' }}>
        <View style={styles.row}>
          <Text style={[styles.brand, { fontSize: 17 * k }]}>{brand.name}</Text>
          <View style={[styles.pill, { paddingHorizontal: 9 * k, paddingVertical: 3 * k }]}>
            <Text style={[styles.pillText, { fontSize: 10 * k }]}>{card.kind === 'virtual' ? 'VIRTUAL' : 'PHYSICAL'}</Text>
          </View>
        </View>
        <View style={{ width: 38 * k, height: 28 * k, borderRadius: 6 * k, backgroundColor: c.accent, opacity: 0.92 }} />
        <View style={{ gap: 8 * k }}>
          <Text style={[styles.number, { fontSize: 17 * k }]} numberOfLines={1}>
            {number}
          </Text>
          <View style={styles.row}>
            <Text style={[styles.meta, { fontSize: 12 * k }]} numberOfLines={1}>
              {card.name}
            </Text>
            <Text style={[styles.meta, { fontSize: 12 * k }]}>{card.expiry}</Text>
          </View>
        </View>
      </View>
      {card.frozen && (
        <Animated.View entering={FadeIn.duration(350)} exiting={FadeOut.duration(250)} style={styles.frozen}>
          <Icon name="freeze" size={34 * k} color="white" />
          <Text style={[styles.frozenText, { fontSize: 12 * k }]}>FROZEN</Text>
        </Animated.View>
      )}
    </View>
  );
}

export function CardBack({ card, width }: { card: CardModel; width: number }) {
  const h = width * CARD_RATIO;
  const k = width / 300;
  return (
    <View style={{ width, height: h, borderRadius: 22 * k, overflow: 'hidden' }}>
      <LinearGradient colors={THEMES[card.theme].colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(5,8,25,0.45)' }]} />
      <View style={{ marginTop: 22 * k, height: 38 * k, backgroundColor: 'rgba(0,0,0,0.6)' }} />
      <View style={{ padding: 20 * k, gap: 10 * k }}>
        <View style={styles.row}>
          <View>
            <Text style={[styles.label, { fontSize: 10 * k }]}>CARD NUMBER</Text>
            <Text style={[styles.backNumber, { fontSize: 15 * k }]}>{card.number}</Text>
          </View>
        </View>
        <View style={[styles.row, { alignItems: 'flex-end' }]}>
          <View>
            <Text style={[styles.label, { fontSize: 10 * k }]}>EXPIRES</Text>
            <Text style={[styles.backNumber, { fontSize: 15 * k }]}>{card.expiry}</Text>
          </View>
          <View style={[styles.cvv, { paddingHorizontal: 12 * k, paddingVertical: 6 * k, borderRadius: 8 * k }]}>
            <Text style={[styles.label, { fontSize: 9 * k, color: '#5A6490' }]}>CVV</Text>
            <Text style={[styles.cvvText, { fontSize: 16 * k }]}>{card.cvv}</Text>
          </View>
        </View>
        <Text style={[styles.demo, { fontSize: 9 * k }]}>Demo card for a design showcase. Not usable for payments.</Text>
      </View>
    </View>
  );
}

// Tap (or flip from a button) to turn the card over and reveal the details.
export function FlipCard({ card, width, flipped, onPress }: { card: CardModel; width: number; flipped: boolean; onPress?: () => void }) {
  const f = useSharedValue(0);

  useEffect(() => {
    f.value = withTiming(flipped ? 1 : 0, { duration: 650, easing: Easing.inOut(Easing.cubic) });
  }, [flipped, f]);

  const front = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1200 },
      { rotateY: `${interpolate(f.value, [0, 1], [0, 180])}deg` },
      { scale: interpolate(f.value, [0, 0.5, 1], [1, 1.06, 1]) },
    ],
  }));
  const back = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1200 },
      { rotateY: `${interpolate(f.value, [0, 1], [180, 360])}deg` },
      { scale: interpolate(f.value, [0, 0.5, 1], [1, 1.06, 1]) },
    ],
  }));

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${card.name} card, tap to flip`}>
      <View style={{ width, height: width * CARD_RATIO }}>
        <Animated.View style={[styles.face, front]}>
          <CardFace card={card} width={width} />
        </Animated.View>
        <Animated.View style={[styles.face, back]}>
          <CardBack card={card} width={width} />
        </Animated.View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  face: { position: 'absolute', top: 0, left: 0, backfaceVisibility: 'hidden' },
  brand: { color: 'white', fontWeight: '800', letterSpacing: -0.3 },
  pill: { borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)' },
  pillText: { color: 'white', fontWeight: '800', letterSpacing: 0.8 },
  number: { color: 'white', fontWeight: '700', letterSpacing: 1.2 },
  meta: { color: 'rgba(255,255,255,0.88)', fontWeight: '600', flexShrink: 1 },
  frozen: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(170,205,255,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  frozenText: { color: 'white', fontWeight: '800', letterSpacing: 2 },
  label: { color: 'rgba(255,255,255,0.65)', fontWeight: '700', letterSpacing: 1 },
  backNumber: { color: 'white', fontWeight: '700', letterSpacing: 1, marginTop: 2 },
  cvv: { backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center' },
  cvvText: { color: '#0B1030', fontWeight: '800', letterSpacing: 1 },
  demo: { color: 'rgba(255,255,255,0.55)', marginTop: 2 },
});
