import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOutUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { brand } from '../brand';
import { useCards } from '../cards-store';
import { BottomSheet } from '../components/BottomSheet';
import { CardCarousel, carouselMetrics } from '../components/CardCarousel';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { CountUp } from '../components/CountUp';
import { Icon, IconName } from '../components/Icon';
import { LimitPicker } from '../components/LimitPicker';
import { PressableScale } from '../components/PressableScale';
import { PrimaryButton } from '../components/PrimaryButton';
import { Toggle } from '../components/Toggle';

const c = brand.colors;

function usd(n: number) {
  return '$' + n.toLocaleString('en-US');
}

function Dot({ active }: { active: boolean }) {
  const w = useSharedValue(active ? 20 : 6);
  useEffect(() => {
    w.value = withSpring(active ? 20 : 6, { damping: 16, stiffness: 240 });
  }, [active, w]);
  const style = useAnimatedStyle(() => ({ width: w.value }));
  return <Animated.View style={[styles.dot, active && styles.dotOn, style]} />;
}

function ActionButton({ icon, label, onPress, active, danger }: { icon: IconName; label: string; onPress: () => void; active?: boolean; danger?: boolean }) {
  const tint = danger ? c.danger : active ? c.onAccent : c.accent;
  return (
    <View style={styles.actionCell}>
      <PressableScale
        haptic
        scaleTo={0.9}
        onPress={onPress}
        accessibilityLabel={label}
        style={[styles.actionBtn, active && styles.actionActive, danger && styles.actionDanger]}
      >
        <Icon name={icon} size={26} color={tint} />
      </PressableScale>
      <Text style={styles.actionLabel}>{label}</Text>
    </View>
  );
}

function SpendBar({ spent, limit }: { spent: number; limit: number }) {
  const p = useSharedValue(0);
  const ratio = Math.min(1, spent / limit);
  useEffect(() => {
    p.value = withSpring(ratio, { damping: 18, stiffness: 90 });
  }, [ratio, p]);
  const fill = useAnimatedStyle(() => ({ width: `${p.value * 100}%` }));
  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, fill, ratio > 0.85 && { backgroundColor: c.coral }]} />
    </View>
  );
}

export function CardsTab() {
  const insets = useSafeAreaInsets();
  const { width: W } = useWindowDimensions();
  const { item } = carouselMetrics(W);
  const { cards, toggleFreeze, removeCard, setLimit, setControl, focusId, clearFocus } = useCards();

  const [index, setIndex] = useState(0);
  const [flippedId, setFlippedId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<null | 'freeze' | 'remove'>(null);
  const [limitOpen, setLimitOpen] = useState(false);
  const [draftLimit, setDraftLimit] = useState(1000);
  const [toast, setToast] = useState<string | null>(null);
  const scrollRef = useRef<Animated.ScrollView>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const active = cards[Math.min(index, cards.length - 1)];

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  // After a card is created, glide to it and confirm.
  useEffect(() => {
    if (!focusId) return;
    const i = cards.findIndex((x) => x.id === focusId);
    if (i < 0) return;
    const t = setTimeout(() => {
      scrollRef.current?.scrollTo({ x: i * item, animated: true });
      setIndex(i);
      setFlippedId(null);
      showToast('New card added to your wallet');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      clearFocus();
    }, 500);
    return () => clearTimeout(t);
  }, [focusId, cards, item, clearFocus, showToast]);

  const onFreeze = () => {
    if (!active) return;
    if (active.frozen) {
      toggleFreeze(active.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Card unfrozen');
    } else {
      setDialog('freeze');
    }
  };

  const confirmFreeze = () => {
    if (active) toggleFreeze(active.id);
    setDialog(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    showToast('Card frozen. Payments are paused.');
  };

  const confirmRemove = () => {
    if (!active) return;
    const next = Math.max(0, index - 1);
    removeCard(active.id);
    setDialog(null);
    setIndex(next);
    setFlippedId(null);
    scrollRef.current?.scrollTo({ x: next * item, animated: false });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    showToast('Card removed');
  };

  const saveLimit = () => {
    if (active) setLimit(active.id, draftLimit);
    setLimitOpen(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showToast('Monthly limit updated');
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 120 }}
      >
        <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
          <Text style={styles.title}>Cards</Text>
          <PressableScale haptic onPress={() => router.push('/new-card')} style={styles.newBtn} accessibilityLabel="New card">
            <Icon name="plus" size={18} color={c.onAccent} />
            <Text style={styles.newText}>New card</Text>
          </PressableScale>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).springify().damping(16)}>
          <CardCarousel
            cards={cards}
            width={W}
            flippedId={flippedId}
            scrollRef={scrollRef}
            onTapCard={(id) => setFlippedId((f) => (f === id ? null : id))}
            onAdd={() => router.push('/new-card')}
            onIndexChange={(i) => {
              setIndex(i);
              setFlippedId(null);
            }}
          />
        </Animated.View>

        <View style={styles.dots}>
          {Array.from({ length: cards.length + 1 }, (_, i) => (
            <Dot key={i} active={i === Math.min(index, cards.length)} />
          ))}
        </View>

        {active ? (
          <>
            <Animated.View key={active.id} entering={FadeInDown.duration(350)} style={styles.pad}>
              <View style={styles.infoRow}>
                <View style={styles.flex}>
                  <Text style={styles.cardName}>{active.name}</Text>
                  <Text style={styles.cardSub}>
                    {active.kind === 'virtual' ? 'Virtual' : 'Physical'} card, ending {active.last4}
                  </Text>
                </View>
                <View style={[styles.status, active.frozen && styles.statusFrozen]}>
                  <View style={[styles.statusDot, active.frozen && { backgroundColor: '#9CC4FF' }]} />
                  <Text style={[styles.statusText, active.frozen && { color: '#9CC4FF' }]}>{active.frozen ? 'Frozen' : 'Active'}</Text>
                </View>
              </View>

              <View style={styles.spendRow}>
                <Text style={styles.spendLabel}>Spent this month</Text>
                <Text style={styles.spendVal}>
                  {usd(active.spent)} <Text style={styles.spendOf}>of {usd(active.limit)}</Text>
                </Text>
              </View>
              <SpendBar spent={active.spent} limit={active.limit} />
            </Animated.View>

            <View style={styles.actions}>
              <ActionButton icon="freeze" label={active.frozen ? 'Unfreeze' : 'Freeze'} active={active.frozen} onPress={onFreeze} />
              <ActionButton
                icon="eye"
                label={flippedId === active.id ? 'Hide' : 'Details'}
                onPress={() => setFlippedId((f) => (f === active.id ? null : active.id))}
              />
              <ActionButton
                icon="limit"
                label="Limit"
                onPress={() => {
                  setDraftLimit(active.limit);
                  setLimitOpen(true);
                }}
              />
              <ActionButton icon="trash" label="Remove" danger onPress={() => setDialog('remove')} />
            </View>

            <Animated.View key={`ctl-${active.id}`} entering={FadeInDown.delay(80).duration(350)} style={[styles.pad, styles.controls]}>
              <Text style={styles.sectionTitle}>Card controls</Text>
              <View style={styles.ctlRow}>
                <View style={styles.flex}>
                  <Text style={styles.ctlName}>Online payments</Text>
                  <Text style={styles.ctlSub}>Shop on websites and in apps</Text>
                </View>
                <Toggle value={active.online} onChange={(v) => setControl(active.id, 'online', v)} />
              </View>
              <View style={styles.sep} />
              <View style={styles.ctlRow}>
                <View style={styles.flex}>
                  <Text style={styles.ctlName}>International use</Text>
                  <Text style={styles.ctlSub}>Pay in other countries</Text>
                </View>
                <Toggle value={active.intl} onChange={(v) => setControl(active.id, 'intl', v)} />
              </View>
            </Animated.View>
          </>
        ) : (
          <Animated.View entering={FadeIn.delay(200)} style={[styles.pad, styles.empty]}>
            <Text style={styles.cardName}>No cards yet</Text>
            <Text style={styles.cardSub}>Create a virtual card in seconds.</Text>
            <View style={{ height: 16 }} />
            <PrimaryButton label="Create a card" onPress={() => router.push('/new-card')} />
          </Animated.View>
        )}
      </ScrollView>

      {toast && (
        <Animated.View key={toast} entering={FadeInDown.springify().damping(14)} exiting={FadeOutUp.duration(200)} style={[styles.toast, { top: insets.top + 8 }]}>
          <View style={styles.toastIcon}>
            <Icon name="check" size={16} color={c.success} />
          </View>
          <Text style={styles.toastText}>{toast}</Text>
        </Animated.View>
      )}

      <BottomSheet visible={limitOpen} title="Monthly spending limit" onClose={() => setLimitOpen(false)}>
        <CountUp to={draftLimit} decimals={0} duration={700} style={styles.bigAmount} />
        <Text style={styles.sheetSub}>Payments stop once you reach this amount each month.</Text>
        <View style={{ height: 18 }} />
        <LimitPicker value={draftLimit} onChange={setDraftLimit} />
        <View style={{ height: 22 }} />
        <PrimaryButton label="Save limit" onPress={saveLimit} />
      </BottomSheet>

      <ConfirmDialog
        visible={dialog === 'freeze'}
        icon="freeze"
        title="Freeze this card?"
        message={`Payments with ${active?.name ?? 'this card'} will be paused right away. You can unfreeze it anytime.`}
        confirmLabel="Freeze card"
        onConfirm={confirmFreeze}
        onCancel={() => setDialog(null)}
      />
      <ConfirmDialog
        visible={dialog === 'remove'}
        tone="danger"
        icon="trash"
        title="Remove this card?"
        message={`${active?.name ?? 'This card'} ending ${active?.last4 ?? ''} will be permanently deactivated. This can't be undone.`}
        confirmLabel="Remove card"
        onConfirm={confirmRemove}
        onCancel={() => setDialog(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.ink },
  flex: { flex: 1 },
  pad: { paddingHorizontal: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, marginBottom: 6 },
  title: { color: c.text, fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  newBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 40, borderRadius: 20, backgroundColor: c.accent },
  newText: { color: c.onAccent, fontSize: 14, fontWeight: '800' },
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 6, marginBottom: 20 },
  dot: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.22)' },
  dotOn: { backgroundColor: c.accent },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  cardName: { color: c.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  cardSub: { color: c.muted, fontSize: 14, marginTop: 3 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, backgroundColor: 'rgba(61,220,151,0.14)' },
  statusFrozen: { backgroundColor: 'rgba(156,196,255,0.14)' },
  statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: c.success },
  statusText: { color: c.success, fontSize: 13, fontWeight: '700' },
  spendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 },
  spendLabel: { color: c.muted, fontSize: 14 },
  spendVal: { color: c.text, fontSize: 16, fontWeight: '800' },
  spendOf: { color: c.muted, fontSize: 14, fontWeight: '500' },
  track: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.09)', overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4, backgroundColor: c.accent },
  actions: { flexDirection: 'row', marginTop: 26, paddingHorizontal: 12 },
  actionCell: { flex: 1, alignItems: 'center', gap: 8 },
  actionBtn: { width: 62, height: 62, borderRadius: 31, backgroundColor: c.card, borderWidth: 1, borderColor: c.stroke, alignItems: 'center', justifyContent: 'center' },
  actionActive: { backgroundColor: '#9CC4FF', borderColor: '#9CC4FF' },
  actionDanger: { backgroundColor: 'rgba(255,92,122,0.1)', borderColor: 'rgba(255,92,122,0.35)' },
  actionLabel: { color: c.text, fontSize: 13, fontWeight: '600' },
  controls: { marginTop: 26 },
  sectionTitle: { color: c.text, fontSize: 18, fontWeight: '800', letterSpacing: -0.3, marginBottom: 12 },
  ctlRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 6 },
  ctlName: { color: c.text, fontSize: 16, fontWeight: '700' },
  ctlSub: { color: c.muted, fontSize: 13, marginTop: 2 },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: c.stroke, marginVertical: 10 },
  empty: { alignItems: 'center', paddingTop: 10 },
  toast: { position: 'absolute', alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 22, backgroundColor: 'rgba(16,24,52,0.97)', borderWidth: 1, borderColor: c.stroke, zIndex: 120, elevation: 120 },
  toastIcon: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(61,220,151,0.18)', alignItems: 'center', justifyContent: 'center' },
  toastText: { color: c.text, fontSize: 14, fontWeight: '700' },
  bigAmount: { color: c.text, fontSize: 48, fontWeight: '800', letterSpacing: -1.5, padding: 0 },
  sheetSub: { color: c.muted, fontSize: 14, marginTop: 4 },
});
