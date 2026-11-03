import { useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { assets, brand } from '../brand';
import { BudgetRing } from '../components/BudgetRing';
import { CountUp } from '../components/CountUp';
import { Icon, IconName } from '../components/Icon';
import { Sparkline } from '../components/Sparkline';

const c = brand.colors;
const PAD = 24;

const SERIES = [38, 42, 40, 47, 52, 49, 58, 63, 60, 71, 76, 74, 88];

const ACTIONS: { label: string; icon: IconName }[] = [
  { label: 'Send', icon: 'send' },
  { label: 'Request', icon: 'request' },
  { label: 'Top up', icon: 'topup' },
  { label: 'More', icon: 'more' },
];

const TXNS = [
  { name: 'Northwind Payroll', cat: 'Salary', amt: 4200, color: c.success, when: 'Today' },
  { name: 'Spotify', cat: 'Subscriptions', amt: -11.99, color: '#1DB954', when: 'Today' },
  { name: 'Amara O.', cat: 'Received', amt: 250, color: c.coral, when: 'Yesterday' },
  { name: 'Uber', cat: 'Transport', amt: -18.4, color: '#8E94B8', when: 'Yesterday' },
  { name: 'Whole Foods', cat: 'Groceries', amt: -64.2, color: c.accent, when: 'Mon' },
];

function usd(n: number) {
  const s = Math.abs(n).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return (n < 0 ? '-$' : '+$') + s;
}

function QuickAction({ label, icon, index }: { label: string; icon: IconName; index: number }) {
  const s = useSharedValue(1);
  const draw = useSharedValue(0);
  const nudge = useSharedValue(0);
  const primary = index === 0; // Send is the main action, so it gets the filled treatment

  useEffect(() => {
    draw.value = withDelay(900 + index * 110, withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }));
  }, [draw, index]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));

  // Each icon reacts in a way that matches what it does.
  const iconStyle = useAnimatedStyle(() => {
    const n = nudge.value;
    if (icon === 'send') return { transform: [{ translateX: n * 9 }, { translateY: n * -9 }] };
    if (icon === 'request') return { transform: [{ translateY: n * 8 }] };
    if (icon === 'topup') return { transform: [{ rotate: `${n * 90}deg` }] };
    return { transform: [{ scale: 1 + n * 0.2 }] };
  });

  return (
    <Animated.View entering={FadeInDown.delay(700 + index * 90).springify().damping(14)} style={styles.actionWrap}>
      <Pressable
        onPressIn={() => {
          s.set(withSpring(0.88, { damping: 15, stiffness: 320 }));
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        onPressOut={() => s.set(withSpring(1, { damping: 6, stiffness: 200 }))}
        onPress={() => nudge.set(withSequence(withTiming(1, { duration: 170 }), withSpring(0, { damping: 7, stiffness: 170 })))}
        style={styles.actionPress}
        accessibilityRole="button"
        accessibilityLabel={label}
      >
        <Animated.View style={[styles.actionBtn, primary && styles.actionPrimary, style]}>
          <Animated.View style={iconStyle}>
            <Icon name={icon} size={28} color={primary ? c.onAccent : c.accent} progress={draw} />
          </Animated.View>
        </Animated.View>
        <Text style={styles.actionLabel}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const TABS = ['Home', 'Cards', 'Pay', 'Me'];

function TabBar({ bottom }: { bottom: number }) {
  const [w, setW] = useState(0);
  const [active, setActive] = useState(0);
  const x = useSharedValue(0);
  const tabW = w / TABS.length;
  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <Animated.View
      entering={FadeInUp.delay(1100).springify().damping(16)}
      style={[styles.tabBar, { bottom }]}
      onLayout={(e) => setW(e.nativeEvent.layout.width - 12)}
    >
      <Animated.View style={[styles.tabPill, { width: tabW }, pill]} />
      {TABS.map((t, i) => (
        <Pressable
          key={t}
          style={styles.tab}
          onPress={() => {
            setActive(i);
            x.set(withSpring(i * tabW, { damping: 17, stiffness: 230 }));
            Haptics.selectionAsync();
          }}
        >
          <Text style={[styles.tabText, active === i && styles.tabTextOn]}>{t}</Text>
        </Pressable>
      ))}
    </Animated.View>
  );
}

export default function Home() {
  const { name } = useLocalSearchParams<{ name?: string }>();
  const insets = useSafeAreaInsets();
  const { width: W } = useWindowDimensions();
  const cardW = W - PAD * 2;
  const who = name && name.length > 0 ? name : 'there';
  const initial = who.charAt(0).toUpperCase();

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 120, paddingHorizontal: PAD }}
      >
        <Animated.View entering={FadeIn.duration(500)} style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={styles.flex}>
            <Text style={styles.hello}>Good evening</Text>
            <Text style={styles.name}>{who}</Text>
          </View>
          <View style={styles.bell}>
            <View style={styles.bellDot} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(150).springify().damping(16)}>
          <LinearGradient
            colors={[c.indigo, '#8250FF', c.coral]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.card}
          >
            <LottieView source={assets.lottieSparkle} autoPlay loop style={styles.sparkle} />
            <Text style={styles.cardLabel}>Total balance</Text>
            <CountUp to={24862.4} delay={450} style={styles.balance} />
            <View style={styles.delta}>
              <Text style={styles.deltaText}>+12.4% this month</Text>
            </View>
            <View style={styles.chart}>
              <Sparkline width={cardW - 44} height={110} data={SERIES} delay={500} />
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={styles.actions}>
          {ACTIONS.map((a, i) => (
            <QuickAction key={a.label} index={i} {...a} />
          ))}
        </View>

        <View style={styles.pair}>
          <Animated.View entering={FadeInDown.delay(850).springify().damping(16)} style={[styles.mini, styles.flex]}>
            <Text style={styles.miniTitle}>Monthly budget</Text>
            <View style={styles.ringBox}>
              <BudgetRing size={96} progress={0.68} delay={1000} />
            </View>
            <Text style={styles.miniFoot}>$1,360 of $2,000</Text>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(950).springify().damping(16)} style={[styles.mini, styles.flex]}>
            <Text style={styles.miniTitle}>Goal: Lisbon trip</Text>
            <Text style={styles.goalAmt}>$3,150</Text>
            <Text style={styles.miniFoot}>of $4,500</Text>
            <View style={styles.track}>
              <Animated.View entering={FadeIn.delay(1300).duration(900)} style={styles.fill} />
            </View>
            <Text style={styles.goalNote}>70% there</Text>
          </Animated.View>
        </View>

        <Animated.Text entering={FadeIn.delay(1000)} style={styles.section}>
          Recent activity
        </Animated.Text>
        {TXNS.map((t, i) => (
          <Animated.View
            key={t.name}
            entering={FadeInDown.delay(1050 + i * 90).springify().damping(18)}
            style={styles.row}
          >
            <View style={[styles.dot, { backgroundColor: t.color + '33' }]}>
              <Text style={[styles.dotText, { color: t.color }]}>{t.name.charAt(0)}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.rowName}>{t.name}</Text>
              <Text style={styles.rowSub}>
                {t.cat}, {t.when}
              </Text>
            </View>
            <Text style={[styles.rowAmt, t.amt > 0 && { color: c.success }]}>{usd(t.amt)}</Text>
          </Animated.View>
        ))}
      </ScrollView>

      <TabBar bottom={insets.bottom + 12} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.ink },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: c.onAccent, fontSize: 20, fontWeight: '800' },
  hello: { color: c.muted, fontSize: 14 },
  name: { color: c.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  bell: { width: 42, height: 42, borderRadius: 21, backgroundColor: c.card, borderWidth: 1, borderColor: c.stroke },
  bellDot: { position: 'absolute', top: 11, right: 12, width: 9, height: 9, borderRadius: 5, backgroundColor: c.coral },
  card: { borderRadius: 30, padding: 22, overflow: 'hidden' },
  sparkle: { position: 'absolute', top: 6, right: 6, width: 64, height: 64 },
  cardLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600' },
  balance: { color: 'white', fontSize: 44, fontWeight: '800', letterSpacing: -1.5, padding: 0, marginTop: 4 },
  delta: { alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)' },
  deltaText: { color: 'white', fontSize: 13, fontWeight: '700' },
  chart: { marginTop: 14 },
  actions: { flexDirection: 'row', marginTop: 22, marginBottom: 6 },
  actionWrap: { flex: 1, alignItems: 'center' },
  actionPress: { alignItems: 'center', gap: 8 },
  actionBtn: { width: 62, height: 62, borderRadius: 31, backgroundColor: c.card, borderWidth: 1, borderColor: c.stroke, alignItems: 'center', justifyContent: 'center' },
  actionPrimary: { backgroundColor: c.accent, borderColor: c.accent, shadowColor: c.accent, shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  actionLabel: { color: c.text, fontSize: 13, fontWeight: '600' },
  pair: { flexDirection: 'row', gap: 14, marginTop: 18 },
  mini: { borderRadius: 26, padding: 18, backgroundColor: c.card, borderWidth: 1, borderColor: c.stroke },
  miniTitle: { color: c.muted, fontSize: 13, fontWeight: '600' },
  ringBox: { alignItems: 'center', marginVertical: 12 },
  miniFoot: { color: c.muted, fontSize: 12 },
  goalAmt: { color: c.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.8, marginTop: 14 },
  track: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.09)', marginTop: 18, overflow: 'hidden' },
  fill: { width: '70%', height: 8, borderRadius: 4, backgroundColor: c.accent },
  goalNote: { color: c.accent, fontSize: 13, fontWeight: '700', marginTop: 10 },
  section: { color: c.text, fontSize: 19, fontWeight: '800', letterSpacing: -0.4, marginTop: 28, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  dot: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  dotText: { fontSize: 18, fontWeight: '800' },
  rowName: { color: c.text, fontSize: 16, fontWeight: '700' },
  rowSub: { color: c.muted, fontSize: 13, marginTop: 2 },
  rowAmt: { color: c.text, fontSize: 16, fontWeight: '700' },
  tabBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 64,
    borderRadius: 32,
    padding: 6,
    flexDirection: 'row',
    backgroundColor: 'rgba(16,24,52,0.94)',
    borderWidth: 1,
    borderColor: c.stroke,
  },
  tabPill: { position: 'absolute', left: 6, top: 6, bottom: 6, borderRadius: 26, backgroundColor: c.accent },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabText: { color: c.muted, fontSize: 14, fontWeight: '700' },
  tabTextOn: { color: c.onAccent },
});
