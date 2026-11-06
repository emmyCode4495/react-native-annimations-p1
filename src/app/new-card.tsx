import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  FadeOut,
  ZoomIn,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { assets, brand } from '../brand';
import { THEMES, THEME_KEYS, ThemeKey } from '../cardThemes';
import { CardKind, CardModel, useCards } from '../cards-store';
import { CARD_RATIO, CardFace } from '../components/CardFace';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Confetti } from '../components/Confetti';
import { CountUp } from '../components/CountUp';
import { GlowInput } from '../components/GlowInput';
import { Icon, IconName } from '../components/Icon';
import { LimitPicker } from '../components/LimitPicker';
import { PinPad } from '../components/PinPad';
import { PressableScale } from '../components/PressableScale';
import { PrimaryButton } from '../components/PrimaryButton';
import { Toggle } from '../components/Toggle';
import { FlowBackground } from '../FlowBackground';

const c = brand.colors;
const STEPS = ['Card type', 'Make it yours', 'Limit & controls', 'Review'];
const CREATING_MSGS = ['Verifying your details', 'Issuing your card', 'Securing card details'];

type Stage = 'form' | 'pin' | 'creating' | 'success';

// ---------- small building blocks ----------

function OptionCard({ icon, title, desc, tag, selected, onPress }: { icon: IconName; title: string; desc: string; tag: string; selected: boolean; onPress: () => void }) {
  const p = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    p.value = withSpring(selected ? 1 : 0, { damping: 14, stiffness: 220 });
  }, [selected, p]);
  const box = useAnimatedStyle(() => ({
    borderColor: interpolateColor(p.value, [0, 1], [c.stroke, c.accent]),
    backgroundColor: interpolateColor(p.value, [0, 1], ['rgba(255,255,255,0.05)', 'rgba(255,200,87,0.09)']),
  }));
  const tick = useAnimatedStyle(() => ({ transform: [{ scale: p.value }], opacity: p.value }));
  return (
    <PressableScale haptic scaleTo={0.97} onPress={onPress} accessibilityLabel={title}>
      <Animated.View style={[styles.option, box]}>
        <View style={styles.optionIcon}>
          <Icon name={icon} size={26} color={c.accent} />
        </View>
        <View style={styles.flex}>
          <Text style={styles.optionTitle}>{title}</Text>
          <Text style={styles.optionDesc}>{desc}</Text>
          <Text style={styles.optionTag}>{tag}</Text>
        </View>
        <Animated.View style={[styles.tick, tick]}>
          <Icon name="check" size={16} color={c.onAccent} />
        </Animated.View>
      </Animated.View>
    </PressableScale>
  );
}

function Swatch({ theme, selected, onPress }: { theme: ThemeKey; selected: boolean; onPress: () => void }) {
  const p = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    p.value = withSpring(selected ? 1 : 0, { damping: 13, stiffness: 240 });
  }, [selected, p]);
  const ring = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ scale: 0.8 + p.value * 0.2 }] }));
  const tick = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ scale: p.value }] }));
  return (
    <PressableScale haptic scaleTo={0.9} onPress={onPress} accessibilityLabel={`${THEMES[theme].label} color`} containerStyle={styles.swatchCell}>
      <View style={styles.swatchBox}>
        <Animated.View style={[styles.swatchRing, ring]} />
        <LinearGradient colors={THEMES[theme].colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.swatch}>
          <Animated.View style={tick}>
            <Icon name="check" size={20} color="white" />
          </Animated.View>
        </LinearGradient>
      </View>
      <Text style={[styles.swatchLabel, selected && { color: c.text }]}>{THEMES[theme].label}</Text>
    </PressableScale>
  );
}

function SummaryRow({ label, value, dot }: { label: string; value: string; dot?: ThemeKey }) {
  return (
    <View style={styles.sumRow}>
      <Text style={styles.sumLabel}>{label}</Text>
      <View style={styles.sumValWrap}>
        {dot && <LinearGradient colors={THEMES[dot].colors} style={styles.sumDot} />}
        <Text style={styles.sumVal}>{value}</Text>
      </View>
    </View>
  );
}

function ControlRow({ title, sub, value, onChange }: { title: string; sub: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.ctlRow}>
      <View style={styles.flex}>
        <Text style={styles.ctlName}>{title}</Text>
        <Text style={styles.ctlSub}>{sub}</Text>
      </View>
      <Toggle value={value} onChange={onChange} />
    </View>
  );
}

// ---------- screen ----------

export default function NewCard() {
  const insets = useSafeAreaInsets();
  const { width: W } = useWindowDimensions();
  const { buildCard, addCard } = useCards();

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [kind, setKind] = useState<CardKind>('virtual');
  const [name, setName] = useState('');
  const [theme, setTheme] = useState<ThemeKey>('brand');
  const [limit, setLimit] = useState(1000);
  const [online, setOnline] = useState(true);
  const [intl, setIntl] = useState(false);
  const [stage, setStage] = useState<Stage>('form');
  const [dialog, setDialog] = useState<null | 'confirm' | 'discard'>(null);
  const [created, setCreated] = useState<CardModel | null>(null);
  const [msgIndex, setMsgIndex] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const intensity = useSharedValue(0.55);
  const progress = useSharedValue(1 / STEPS.length);
  const bob = useSharedValue(0);
  const shimmer = useSharedValue(0);

  const previewW = Math.min(280, W - 100);
  const cleanName = name.trim();
  const dirty = step > 0 || cleanName.length > 0;

  useEffect(() => {
    const list = timers.current;
    return () => list.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    bob.value = withRepeat(withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.sin) }), -1, true);
    shimmer.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) }), -1, false);
  }, [bob, shimmer]);

  useEffect(() => {
    progress.value = withSpring((step + 1) / STEPS.length, { damping: 18, stiffness: 120 });
  }, [step, progress]);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };

  const goNext = () => {
    setDir(1);
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };
  const goBack = () => {
    if (step === 0) return close();
    setDir(-1);
    setStep((s) => s - 1);
  };
  const close = () => {
    if (stage !== 'form') return;
    if (dirty) setDialog('discard');
    else router.back();
  };

  // Android hardware back follows the same rules as the on-screen buttons.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (dialog) {
        setDialog(null);
        return true;
      }
      if (stage === 'pin') {
        setStage('form');
        return true;
      }
      if (stage !== 'form') return true;
      if (step > 0) {
        setDir(-1);
        setStep((s) => s - 1);
        return true;
      }
      if (dirty) {
        setDialog('discard');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [dialog, stage, step, dirty]);

  const onPrimary = () => {
    if (step < STEPS.length - 1) return goNext();
    setDialog('confirm');
  };

  const startPin = () => {
    setDialog(null);
    setStage('pin');
  };

  // Demo rule: any PIN works, except 0000 which shows the error state.
  const validatePin = (pin: string) => pin !== '0000';

  const startCreating = () => {
    const card = buildCard({ name: cleanName, kind, theme, limit, online, intl });
    setCreated(card);
    setMsgIndex(0);
    setStage('creating');
    CREATING_MSGS.forEach((_, i) => i > 0 && later(() => setMsgIndex(i), i * 650));
    later(() => {
      setStage('success');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, CREATING_MSGS.length * 650 + 250);
  };

  const finish = () => {
    if (created) addCard(created);
    router.back();
  };

  const floatStyle = useAnimatedStyle(() => ({ transform: [{ translateY: (bob.value - 0.5) * 8 }] }));
  const barStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));
  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -previewW + shimmer.value * previewW * 2.2 }, { rotate: '12deg' }],
  }));

  const previewCard = {
    name: cleanName || 'Your card',
    kind,
    theme,
    number: '',
    last4: '',
    expiry: '••/••',
    frozen: false,
  };

  const ctaLabel = step === STEPS.length - 1 ? 'Create card' : step === 2 ? 'Review' : 'Continue';
  const ctaDisabled = step === 1 && cleanName.length < 2;
  const enter = dir >= 0 ? FadeInRight.duration(320) : FadeInLeft.duration(320);

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <PressableScale scaleTo={0.9} onPress={goBack} style={styles.roundBtn} accessibilityLabel={step === 0 ? 'Close' : 'Back'}>
            <Icon name={step === 0 ? 'close' : 'back'} size={20} color={c.text} />
          </PressableScale>
          <View style={styles.flex}>
            <Text style={styles.headerTitle}>New card</Text>
            <Text style={styles.headerSub}>
              Step {step + 1} of {STEPS.length}: {STEPS[step]}
            </Text>
          </View>
        </View>
        <View style={styles.bar}>
          <Animated.View style={[styles.barFill, barStyle]} />
        </View>

        {/* live preview */}
        <Animated.View entering={FadeInDown.springify().damping(16)} style={[styles.preview, floatStyle]}>
          <CardFace card={previewCard} width={previewW} />
        </Animated.View>

        {/* step content */}
        <View style={styles.stepArea}>
          <Animated.View key={step} entering={enter} exiting={FadeOut.duration(110)} style={StyleSheet.absoluteFill}>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.stepContent}
            >
              {step === 0 && (
                <>
                  <Text style={styles.h}>Choose a card type</Text>
                  <Text style={styles.p}>You can add more cards later.</Text>
                  <View style={{ gap: 12, marginTop: 16 }}>
                    <OptionCard icon="bolt" title="Virtual card" desc="Ready in seconds. Use it online and in your phone wallet." tag="Instant, free" selected={kind === 'virtual'} onPress={() => setKind('virtual')} />
                    <OptionCard icon="truck" title="Physical card" desc="A card in your hand for shops and ATMs." tag="3 to 5 days, $5 delivery" selected={kind === 'physical'} onPress={() => setKind('physical')} />
                  </View>
                </>
              )}
              {step === 1 && (
                <>
                  <Text style={styles.h}>Make it yours</Text>
                  <Text style={styles.p}>Name it for what you use it for, then pick a color.</Text>
                  <View style={{ height: 16 }} />
                  <GlowInput label="Card name" value={name} onChangeText={setName} maxLength={20} autoCapitalize="words" returnKeyType="done" />
                  <Text style={styles.fieldLabel}>Color</Text>
                  <View style={styles.swatchRow}>
                    {THEME_KEYS.map((k) => (
                      <Swatch key={k} theme={k} selected={theme === k} onPress={() => setTheme(k)} />
                    ))}
                  </View>
                </>
              )}
              {step === 2 && (
                <>
                  <Text style={styles.h}>Set a monthly limit</Text>
                  <CountUp to={limit} decimals={0} duration={600} style={styles.big} />
                  <Text style={styles.p}>Payments pause once you reach this amount each month.</Text>
                  <View style={{ height: 16 }} />
                  <LimitPicker value={limit} onChange={setLimit} />
                  <View style={styles.ctlCard}>
                    <ControlRow title="Online payments" sub="Shop on websites and in apps" value={online} onChange={setOnline} />
                    <View style={styles.sep} />
                    <ControlRow title="International use" sub="Pay in other countries" value={intl} onChange={setIntl} />
                  </View>
                </>
              )}
              {step === 3 && (
                <>
                  <Text style={styles.h}>Review your card</Text>
                  <Text style={styles.p}>Check the details before you create it.</Text>
                  <View style={styles.sumCard}>
                    <SummaryRow label="Type" value={kind === 'virtual' ? 'Virtual' : 'Physical'} />
                    <SummaryRow label="Name" value={cleanName} />
                    <SummaryRow label="Color" value={THEMES[theme].label} dot={theme} />
                    <SummaryRow label="Monthly limit" value={`$${limit.toLocaleString('en-US')}`} />
                    <SummaryRow label="Online / International" value={`${online ? 'On' : 'Off'} / ${intl ? 'On' : 'Off'}`} />
                    <SummaryRow label={kind === 'virtual' ? 'Availability' : 'Delivery'} value={kind === 'virtual' ? 'Instant' : '3 to 5 days, $5.00'} />
                  </View>
                  <View style={styles.note}>
                    <Icon name="shield" size={22} color={c.success} />
                    <Text style={styles.noteText}>You will confirm with your PIN. You can freeze or remove this card anytime.</Text>
                  </View>
                </>
              )}
            </ScrollView>
          </Animated.View>
        </View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <PrimaryButton label={ctaLabel} disabled={ctaDisabled} onPress={onPrimary} />
        </View>
      </KeyboardAvoidingView>

      {/* PIN */}
      {stage === 'pin' && (
        <Animated.View entering={FadeIn.duration(260)} exiting={FadeOut.duration(200)} style={styles.overlay}>
          <FlowBackground intensity={intensity} />
          <View style={[styles.overlayHead, { paddingTop: insets.top + 8 }]}>
            <PressableScale scaleTo={0.9} onPress={() => setStage('form')} style={styles.roundBtn} accessibilityLabel="Back">
              <Icon name="back" size={20} color={c.text} />
            </PressableScale>
          </View>
          <View style={styles.pinBody}>
            <Animated.View entering={ZoomIn.springify().damping(14)} style={styles.lockBadge}>
              <Icon name="lock" size={28} color={c.accent} />
            </Animated.View>
            <Text style={styles.pinTitle}>Confirm with your PIN</Text>
            <Text style={styles.pinSub}>Enter your 4-digit PIN to create {cleanName}.</Text>
            <View style={{ height: 22 }} />
            <PinPad validate={validatePin} onSuccess={startCreating} />
          </View>
        </Animated.View>
      )}

      {/* issuing */}
      {stage === 'creating' && created && (
        <Animated.View entering={FadeIn.duration(260)} exiting={FadeOut.duration(200)} style={[styles.overlay, styles.center]}>
          <FlowBackground intensity={intensity} />
          <Animated.View entering={ZoomIn.springify().damping(14)} style={floatStyle}>
            <View style={{ width: previewW, height: previewW * CARD_RATIO, borderRadius: 22 * (previewW / 300), overflow: 'hidden' }}>
              <CardFace card={previewCard} width={previewW} />
              <Animated.View style={[styles.shimmer, shimmerStyle]}>
                <LinearGradient colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.35)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
              </Animated.View>
            </View>
          </Animated.View>
          <View style={{ height: 36 }} />
          <ActivityIndicator color={c.accent} />
          <Animated.Text key={msgIndex} entering={FadeInDown.duration(260)} style={styles.creating}>
            {CREATING_MSGS[msgIndex]}...
          </Animated.Text>
        </Animated.View>
      )}

      {/* success */}
      {stage === 'success' && created && (
        <Animated.View entering={FadeIn.duration(260)} style={[styles.overlay, styles.center]}>
          <FlowBackground intensity={intensity} />
          <View style={styles.badgeWrap}>
            <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.badge} />
            <LottieView source={assets.lottieSuccess} autoPlay loop={false} style={styles.burst} />
            <View style={styles.confettiOrigin}>
              <Confetti />
            </View>
          </View>
          <Animated.Text entering={FadeInDown.delay(350).springify().damping(16)} style={styles.successTitle}>
            Your card is ready
          </Animated.Text>
          <Animated.Text entering={FadeInDown.delay(450).springify().damping(16)} style={styles.successSub}>
            {created.name} ending {created.last4} is now in your wallet.
          </Animated.Text>
          <Animated.View entering={FadeInDown.delay(600).springify().damping(15)} style={[styles.successCard, floatStyle]}>
            <CardFace card={created} width={previewW} />
          </Animated.View>
          <Animated.View entering={FadeIn.delay(900)} style={[styles.successCta, { paddingBottom: insets.bottom + 16 }]}>
            <PrimaryButton label="View in wallet" onPress={finish} />
          </Animated.View>
        </Animated.View>
      )}

      <ConfirmDialog
        visible={dialog === 'confirm'}
        icon="card"
        title={`Create ${cleanName}?`}
        message={`A ${kind} card with a $${limit.toLocaleString('en-US')} monthly limit will be added to your wallet.`}
        confirmLabel="Create card"
        onConfirm={startPin}
        onCancel={() => setDialog(null)}
      />
      <ConfirmDialog
        visible={dialog === 'discard'}
        tone="danger"
        icon="warning"
        title="Discard this card?"
        message="Your setup will be lost and nothing will be created."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        onConfirm={() => {
          setDialog(null);
          router.back();
        }}
        onCancel={() => setDialog(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.ink },
  flex: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 24, paddingBottom: 14 },
  roundBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: c.card, borderWidth: 1, borderColor: c.stroke, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: c.text, fontSize: 20, fontWeight: '800', letterSpacing: -0.4 },
  headerSub: { color: c.muted, fontSize: 13, marginTop: 1 },
  bar: { height: 4, marginHorizontal: 24, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  barFill: { height: 4, borderRadius: 2, backgroundColor: c.accent },
  preview: { alignItems: 'center', marginTop: 20, marginBottom: 6 },
  stepArea: { flex: 1, overflow: 'hidden' },
  stepContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 },
  h: { color: c.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.6 },
  p: { color: c.muted, fontSize: 15, lineHeight: 21, marginTop: 6 },
  big: { color: c.text, fontSize: 44, fontWeight: '800', letterSpacing: -1.5, padding: 0, marginTop: 6 },
  footer: { paddingHorizontal: 24, paddingTop: 10 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 24, borderWidth: 1.5 },
  optionIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,200,87,0.12)', alignItems: 'center', justifyContent: 'center' },
  optionTitle: { color: c.text, fontSize: 17, fontWeight: '800' },
  optionDesc: { color: c.muted, fontSize: 13, lineHeight: 18, marginTop: 3 },
  optionTag: { color: c.accent, fontSize: 12, fontWeight: '800', marginTop: 6 },
  tick: { width: 26, height: 26, borderRadius: 13, backgroundColor: c.accent, alignItems: 'center', justifyContent: 'center' },
  fieldLabel: { color: c.muted, fontSize: 13, fontWeight: '700', letterSpacing: 0.4, marginTop: 8, marginBottom: 12 },
  swatchRow: { flexDirection: 'row', gap: 8 },
  swatchCell: { flex: 1 },
  swatchBox: { alignItems: 'center', justifyContent: 'center', height: 64 },
  swatchRing: { position: 'absolute', width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: c.accent },
  swatch: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  swatchLabel: { color: c.muted, fontSize: 12, fontWeight: '700', textAlign: 'center', marginTop: 6 },
  ctlCard: { marginTop: 22, padding: 18, borderRadius: 24, backgroundColor: c.card, borderWidth: 1, borderColor: c.stroke },
  ctlRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  ctlName: { color: c.text, fontSize: 16, fontWeight: '700' },
  ctlSub: { color: c.muted, fontSize: 13, marginTop: 2 },
  sep: { height: StyleSheet.hairlineWidth, backgroundColor: c.stroke, marginVertical: 14 },
  sumCard: { marginTop: 18, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 24, backgroundColor: c.card, borderWidth: 1, borderColor: c.stroke },
  sumRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13 },
  sumLabel: { color: c.muted, fontSize: 14 },
  sumValWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sumDot: { width: 14, height: 14, borderRadius: 7 },
  sumVal: { color: c.text, fontSize: 15, fontWeight: '700' },
  note: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16, padding: 14, borderRadius: 18, backgroundColor: 'rgba(61,220,151,0.08)' },
  noteText: { flex: 1, color: c.muted, fontSize: 13, lineHeight: 19 },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: c.ink, zIndex: 50, elevation: 50 },
  overlayHead: { paddingHorizontal: 24 },
  pinBody: { flex: 1, alignItems: 'center', paddingTop: 20 },
  lockBadge: { width: 68, height: 68, borderRadius: 34, backgroundColor: 'rgba(255,200,87,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  pinTitle: { color: c.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.6 },
  pinSub: { color: c.muted, fontSize: 15, marginTop: 6, textAlign: 'center', paddingHorizontal: 40 },
  shimmer: { position: 'absolute', top: -40, bottom: -40, width: 90 },
  creating: { color: c.text, fontSize: 16, fontWeight: '700', marginTop: 14 },
  badgeWrap: { width: 76, height: 76, marginBottom: 22 },
  badge: { width: 76, height: 76, borderRadius: 38, backgroundColor: c.accent },
  burst: { position: 'absolute', left: (76 - 220) / 2, top: (76 - 220) / 2, width: 220, height: 220, pointerEvents: 'none' },
  confettiOrigin: { position: 'absolute', left: 38, top: 38 },
  successTitle: { color: c.text, fontSize: 30, fontWeight: '800', letterSpacing: -0.8 },
  successSub: { color: c.muted, fontSize: 15, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
  successCard: { marginTop: 32 },
  successCta: { position: 'absolute', left: 24, right: 24, bottom: 0 },
});
