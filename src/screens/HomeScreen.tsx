import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInRight,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { brand } from '../brand';
import { AuroraBackground } from '../components/AuroraBackground';

const c = brand.colors;

const TRANSACTIONS = [
  { id: '1', title: 'Stripe Payout', subtitle: 'Business · Today', amount: '+$2,480.00', positive: true },
  { id: '2', title: 'Notion AI', subtitle: 'Subscription · Yesterday', amount: '-$20.00', positive: false },
  { id: '3', title: 'Transfer to Ada', subtitle: 'Instant · Yesterday', amount: '-$150.00', positive: false },
  { id: '4', title: 'Figma Pro', subtitle: 'Design · Mon', amount: '-$15.00', positive: false },
  { id: '5', title: 'Client invoice', subtitle: 'Received · Sun', amount: '+$1,200.00', positive: true },
];

const QUICK = [
  { id: 'send', label: 'Send', icon: '↑' },
  { id: 'request', label: 'Request', icon: '↓' },
  { id: 'pay', label: 'Pay', icon: '⚡' },
  { id: 'more', label: 'More', icon: '···' },
];

type Props = { onLogout?: () => void };

export function HomeScreen({ onLogout }: Props) {
  const insets = useSafeAreaInsets();
  const { width: W } = useWindowDimensions();
  const intensity = useSharedValue(0.45);
  const balance = useSharedValue(0);
  const [displayBalance, setDisplayBalance] = useState('0.00');

  useEffect(() => {
    intensity.value = withTiming(0.55, { duration: 1000 });
    // Count-up balance animation
    balance.value = withDelay(
      400,
      withTiming(12847.62, {
        duration: 1400,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [intensity, balance]);

  // Sync shared value to React state for display
  useEffect(() => {
    const id = setInterval(() => {
      // Approximate read for demo (in production use useDerivedValue + runOnJS carefully)
    }, 50);
    // Simple JS count-up instead for reliability
    const target = 12847.62;
    const start = performance.now();
    const duration = 1400;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayBalance((target * eased).toFixed(2));
      if (t < 1) requestAnimationFrame(tick);
    };
    const raf = requestAnimationFrame(tick);
    return () => {
      clearInterval(id);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <View style={styles.screen}>
      <AuroraBackground intensity={intensity} />
      <LinearGradient
        colors={['transparent', c.ink]}
        locations={[0.25, 0.7]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(60).springify().damping(16)} style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good evening</Text>
            <Text style={styles.name}>Alex Rivera</Text>
          </View>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onLogout?.();
            }}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>AR</Text>
          </Pressable>
        </Animated.View>

        {/* Balance card */}
        <Animated.View entering={FadeInDown.delay(140).springify().damping(16)} style={styles.balanceCard}>
          <LinearGradient
            colors={['rgba(79,91,255,0.25)', 'rgba(255,107,154,0.12)', 'rgba(15,22,48,0.9)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.balanceLabel}>Total balance</Text>
          <Text style={styles.balanceValue}>
            <Text style={styles.currency}>$</Text>
            {displayBalance}
          </Text>
          <View style={styles.balanceMeta}>
            <View style={styles.pill}>
              <Text style={styles.pillText}>+12.4% this month</Text>
            </View>
            <Text style={styles.metaMuted}>USD · Available</Text>
          </View>
        </Animated.View>

        {/* Cards carousel */}
        <Animated.View entering={FadeIn.delay(220)} style={styles.section}>
          <Text style={styles.sectionTitle}>Your cards</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardsRow}
            decelerationRate="fast"
            snapToInterval={W * 0.72 + 14}
          >
            <Card
              delay={260}
              title="Tallyo Debit"
              last4="4821"
              gradient={['#4F5BFF', '#7B61FF']}
              width={W * 0.72}
            />
            <Card
              delay={340}
              title="Travel · EUR"
              last4="9033"
              gradient={['#FF6B9A', '#FF8F6B']}
              width={W * 0.72}
            />
          </ScrollView>
        </Animated.View>

        {/* Quick actions */}
        <Animated.View entering={FadeInDown.delay(300).springify().damping(16)} style={styles.quickRow}>
          {QUICK.map((q, i) => (
            <QuickAction key={q.id} item={q} delay={320 + i * 50} />
          ))}
        </Animated.View>

        {/* Transactions */}
        <Animated.View entering={FadeIn.delay(400)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent</Text>
            <Pressable>
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          </View>
          <View style={styles.txList}>
            {TRANSACTIONS.map((tx, i) => (
              <TxRow key={tx.id} tx={tx} delay={440 + i * 60} />
            ))}
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

function Card({
  title,
  last4,
  gradient,
  width,
  delay,
}: {
  title: string;
  last4: string;
  gradient: [string, string];
  width: number;
  delay: number;
}) {
  return (
    <Animated.View entering={FadeInRight.delay(delay).springify().damping(16)} style={[styles.card, { width }]}>
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <View style={styles.cardTop}>
        <Text style={styles.cardBrand}>{brand.name}</Text>
        <Text style={styles.cardChip}>◆</Text>
      </View>
      <Text style={styles.cardNumber}>••••  ••••  ••••  {last4}</Text>
      <View style={styles.cardBottom}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardExp}>09/28</Text>
      </View>
    </Animated.View>
  );
}

function QuickAction({
  item,
  delay,
}: {
  item: { id: string; label: string; icon: string };
  delay: number;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify().damping(14)} style={styles.quickItem}>
      <Pressable
        onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
        style={({ pressed }) => [styles.quickBtn, pressed && { transform: [{ scale: 0.94 }], opacity: 0.85 }]}
      >
        <Text style={styles.quickIcon}>{item.icon}</Text>
      </Pressable>
      <Text style={styles.quickLabel}>{item.label}</Text>
    </Animated.View>
  );
}

function TxRow({
  tx,
  delay,
}: {
  tx: (typeof TRANSACTIONS)[0];
  delay: number;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify().damping(16)} style={styles.txRow}>
      <View style={[styles.txIcon, tx.positive ? styles.txIconIn : styles.txIconOut]}>
        <Text style={styles.txIconText}>{tx.positive ? '↓' : '↑'}</Text>
      </View>
      <View style={styles.txMeta}>
        <Text style={styles.txTitle}>{tx.title}</Text>
        <Text style={styles.txSub}>{tx.subtitle}</Text>
      </View>
      <Text style={[styles.txAmount, tx.positive && styles.txAmountPos]}>{tx.amount}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.ink },
  scroll: { paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: { fontSize: 14, color: c.muted, fontWeight: '500', marginBottom: 2 },
  name: { fontSize: 22, fontWeight: '800', color: c.text, letterSpacing: -0.4 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: c.indigo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '700', color: c.text },
  balanceCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  balanceLabel: { fontSize: 13, fontWeight: '600', color: c.muted, marginBottom: 8 },
  balanceValue: {
    fontSize: 42,
    fontWeight: '800',
    color: c.text,
    letterSpacing: -1.5,
    marginBottom: 14,
  },
  currency: { fontSize: 28, fontWeight: '700', color: c.muted },
  balanceMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pill: {
    backgroundColor: 'rgba(52,211,153,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  pillText: { fontSize: 12, fontWeight: '700', color: c.success },
  metaMuted: { fontSize: 12, color: c.muted, fontWeight: '500' },
  section: { marginBottom: 28 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: c.text,
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  seeAll: { fontSize: 13, fontWeight: '600', color: c.indigo, marginBottom: 14 },
  cardsRow: { gap: 14, paddingRight: 20 },
  card: {
    height: 180,
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardBrand: { fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.95)' },
  cardChip: { fontSize: 18, color: 'rgba(255,255,255,0.7)' },
  cardNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.95)',
    letterSpacing: 2,
  },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  cardTitle: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  cardExp: { fontSize: 12, fontWeight: '500', color: 'rgba(255,255,255,0.7)' },
  quickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    paddingHorizontal: 4,
  },
  quickItem: { alignItems: 'center', gap: 8 },
  quickBtn: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickIcon: { fontSize: 20, color: c.text },
  quickLabel: { fontSize: 12, fontWeight: '600', color: c.muted },
  txList: { gap: 4 },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 14,
  },
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txIconIn: { backgroundColor: 'rgba(52,211,153,0.15)' },
  txIconOut: { backgroundColor: 'rgba(255,255,255,0.06)' },
  txIconText: { fontSize: 16, color: c.text },
  txMeta: { flex: 1 },
  txTitle: { fontSize: 15, fontWeight: '600', color: c.text, marginBottom: 2 },
  txSub: { fontSize: 12, color: c.muted },
  txAmount: { fontSize: 15, fontWeight: '700', color: c.text },
  txAmountPos: { color: c.success },
});
