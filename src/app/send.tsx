import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';
import React, { useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInLeft,
  FadeInRight,
  FadeOut,
  SlideInDown,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { assets, brand } from '../brand';
import { AmountPad } from '../components/AmountPad';
import { Avatar } from '../components/Avatar';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { Confetti } from '../components/Confetti';
import { GlowInput } from '../components/GlowInput';
import { Icon } from '../components/Icon';
import { PinPad } from '../components/PinPad';
import { PressableScale } from '../components/PressableScale';
import { PrimaryButton } from '../components/PrimaryButton';
import { formatTyped, newReference, usd } from '../format';
import { FlowBackground } from '../FlowBackground';
import { useWallet } from '../wallet-store';

const c = brand.colors;
const QUICK = [10, 50, 100, 250];
type Stage = 'form' | 'pin' | 'processing' | 'success';

function TransferTrack({ youName, to, trackKey }: { youName: string; to: { name: string; color: string }; trackKey: string }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withTiming(1, { duration: 1900, easing: Easing.inOut(Easing.cubic) });
  }, [p, trackKey]);
  const fill = useAnimatedStyle(() => ({ width: `${p.value * 100}%` }));
  const dot = useAnimatedStyle(() => ({ left: `${p.value * 100}%` }));
  const arrive = useAnimatedStyle(() => ({ transform: [{ scale: 1 + Math.max(0, (p.value - 0.85) / 0.15) * 0.18 }] }));
  return (
    <View style={styles.trackRow}>
      <Avatar name={youName} color={c.accent} size={64} solid />
      <View style={styles.track}>
        <Animated.View style={[styles.trackFill, fill]} />
        <Animated.View style={[styles.trackDot, dot]} />
      </View>
      <Animated.View style={arrive}>
        <Avatar name={to.name} color={to.color} size={64} />
      </Animated.View>
    </View>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.line}>
      <Text style={styles.lineLabel}>{label}</Text>
      <Text style={styles.lineVal}>{value}</Text>
    </View>
  );
}

export default function Send() {
  const params = useLocalSearchParams<{ to?: string; mode?: string }>();
  const insets = useSafeAreaInsets();
  const { width: W, height: H } = useWindowDimensions();
  const { contacts, balance, profile, settings, send, request } = useWallet();

  const contact = contacts.find((x) => x.id === params.to) ?? contacts[0];
  const isSend = params.mode !== 'request';
  const first = contact.name.split(' ')[0];
  const max = isSend ? balance : 10000;
  const compact = H < 740;

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [stage, setStage] = useState<Stage>('form');
  const [dialog, setDialog] = useState<null | 'confirm' | 'discard'>(null);
  const [overLimit, setOverLimit] = useState(false);
  const [msgIndex, setMsgIndex] = useState(0);
  const [receipt, setReceipt] = useState({ ref: '', when: '' });
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const intensity = useSharedValue(0.55);
  const progress = useSharedValue(0.5);
  const pop = useSharedValue(0);
  const shake = useSharedValue(0);

  const value = amount === '' || amount === '.' ? 0 : parseFloat(amount);
  const valid = value > 0 && value <= max;
  const msgs = isSend ? ['Checking your balance', 'Sending securely', 'Almost there'] : ['Preparing your request', `Notifying ${first}`];
  const youName = profile.name || 'You';

  useEffect(() => {
    const list = timers.current;
    return () => list.forEach(clearTimeout);
  }, []);
  useEffect(() => {
    progress.value = withSpring((step + 1) / 2, { damping: 18, stiffness: 120 });
  }, [step, progress]);

  const later = (fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  };

  const reject = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    shake.set(withSequence(withTiming(-10, { duration: 50 }), withRepeat(withTiming(10, { duration: 80 }), 5, true), withTiming(0, { duration: 50 })));
    setOverLimit(true);
    later(() => setOverLimit(false), 1700);
  };

  const onKey = (k: string) => {
    let next: string;
    if (k === '.') {
      if (amount.includes('.')) return;
      next = amount === '' ? '0.' : `${amount}.`;
    } else {
      if (amount === '0' && k === '0') return;
      const dec = amount.split('.')[1];
      if (dec !== undefined && dec.length >= 2) return;
      if (amount.replace('.', '').length >= 9) return;
      next = amount === '0' ? k : amount + k;
    }
    if (parseFloat(next) > max) return reject();
    setAmount(next);
    pop.set(withSequence(withTiming(1, { duration: 70 }), withSpring(0, { damping: 10, stiffness: 300 })));
  };

  const onBack = () => {
    if (amount === '') return;
    setAmount((a) => a.slice(0, -1));
    Haptics.selectionAsync();
  };

  const setQuick = (v: number) => {
    if (v > max) return reject();
    setAmount(String(v));
    Haptics.selectionAsync();
    pop.set(withSequence(withTiming(1, { duration: 70 }), withSpring(0, { damping: 10, stiffness: 300 })));
  };

  const dirty = amount !== '' || note !== '';
  const close = () => {
    if (stage !== 'form') return;
    if (dirty) setDialog('discard');
    else router.back();
  };
  const goBack = () => {
    if (step === 0) return close();
    setDir(-1);
    setStep(0);
  };

  const finish = () => {
    if (isSend) send(contact, value);
    else request(contact, value);
    router.back();
  };

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
      if (stage === 'success') {
        if (isSend) send(contact, value);
        else request(contact, value);
        return false;
      }
      if (stage !== 'form') return true;
      if (step > 0) {
        setDir(-1);
        setStep(0);
        return true;
      }
      if (dirty) {
        setDialog('discard');
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [dialog, stage, step, dirty, isSend, send, request, contact, value]);

  const startProcessing = () => {
    setReceipt({
      ref: newReference(),
      when: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
    });
    setMsgIndex(0);
    setStage('processing');
    msgs.forEach((_, i) => i > 0 && later(() => setMsgIndex(i), i * 650));
    later(() => {
      setStage('success');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, msgs.length * 650 + 250);
  };

  const onConfirm = () => {
    setDialog(null);
    if (isSend) setStage('pin');
    else startProcessing();
  };

  const onPrimary = () => {
    if (step === 0) {
      setDir(1);
      setStep(1);
    } else setDialog('confirm');
  };

  const shareReceipt = () => {
    Share.share({
      message: isSend
        ? `Tallyo receipt\nSent ${usd(value)} to ${contact.name}\nRef ${receipt.ref}\n${receipt.when}`
        : `Tallyo request\nRequested ${usd(value)} from ${contact.name}\nRef ${receipt.ref}\n${receipt.when}`,
    }).catch(() => {});
  };

  const barStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));
  const amtStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shake.value }, { scale: 1 + pop.value * 0.06 }],
  }));
  const enter = dir >= 0 ? FadeInRight.duration(300) : FadeInLeft.duration(300);

  const hint = overLimit
    ? isSend
      ? "That's more than your balance."
      : 'Requests are limited to $10,000.'
    : isSend
      ? `Available ${settings.hideBalance ? '••••••' : usd(balance)}`
      : 'You can request up to $10,000';
  const ctaLabel = step === 0 ? 'Review' : isSend ? `Send ${usd(value)}` : `Request ${usd(value)}`;

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <PressableScale scaleTo={0.9} onPress={goBack} style={styles.roundBtn} accessibilityLabel={step === 0 ? 'Close' : 'Back'}>
            <Icon name={step === 0 ? 'close' : 'back'} size={20} color={c.text} />
          </PressableScale>
          <View style={styles.flex}>
            <Text style={styles.headerTitle}>{isSend ? 'Send money' : 'Request money'}</Text>
            <Text style={styles.headerSub}>Step {step + 1} of 2: {step === 0 ? 'Amount' : 'Review'}</Text>
          </View>
        </View>
        <View style={styles.bar}>
          <Animated.View style={[styles.barFill, barStyle]} />
        </View>

        <View style={styles.stepArea}>
          <Animated.View key={step} entering={enter} exiting={FadeOut.duration(110)} style={StyleSheet.absoluteFill}>
            {step === 0 ? (
              <View style={styles.amountStep}>
                <View style={styles.who}>
                  <Avatar name={contact.name} color={contact.color} size={44} />
                  <View>
                    <Text style={styles.whoLabel}>{isSend ? 'To' : 'From'}</Text>
                    <Text style={styles.whoName}>
                      {contact.name} <Text style={styles.whoHandle}>{contact.handle}</Text>
                    </Text>
                  </View>
                </View>

                <Animated.View style={[styles.amountBox, amtStyle]}>
                  <Text style={[styles.amountText, amount === '' && { color: 'rgba(255,255,255,0.22)' }, overLimit && { color: c.danger }]} numberOfLines={1} adjustsFontSizeToFit>
                    ${amount === '' ? '0' : formatTyped(amount)}
                  </Text>
                </Animated.View>
                <Text style={[styles.hint, overLimit && { color: c.danger }]}>{hint}</Text>

                {!compact && (
                  <View style={styles.chips}>
                    {QUICK.map((q) => (
                      <PressableScale key={q} scaleTo={0.93} onPress={() => setQuick(q)} style={[styles.chip, value === q && styles.chipOn]} accessibilityLabel={`${q} dollars`}>
                        <Text style={[styles.chipText, value === q && { color: c.onAccent }]}>${q}</Text>
                      </PressableScale>
                    ))}
                  </View>
                )}

                <View style={styles.padWrap}>
                  <AmountPad onKey={onKey} onBack={onBack} size={compact ? 58 : 66} />
                </View>
              </View>
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.reviewContent}>
                <View style={styles.bigWho}>
                  <Avatar name={contact.name} color={contact.color} size={72} />
                  <Text style={styles.reviewAmount}>{usd(value)}</Text>
                  <Text style={styles.reviewSub}>
                    {isSend ? 'to' : 'from'} {contact.name}
                  </Text>
                </View>
                <View style={styles.card}>
                  <Line label={isSend ? 'To' : 'From'} value={contact.handle} />
                  <Line label="Amount" value={usd(value)} />
                  <Line label="Fee" value="Free" />
                  <Line label={isSend ? 'Pay from' : 'Paid into'} value="Tallyo balance" />
                  <Line label={isSend ? 'Arrives' : 'Notifies'} value={isSend ? 'Instantly' : 'Right away'} />
                </View>
                <View style={{ height: 14 }} />
                <GlowInput label="Add a note (optional)" value={note} onChangeText={setNote} maxLength={60} returnKeyType="done" />
              </ScrollView>
            )}
          </Animated.View>
        </View>

        <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
          <PrimaryButton label={ctaLabel} disabled={!valid} onPress={onPrimary} />
        </View>
      </KeyboardAvoidingView>

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
            <Text style={styles.pinSub}>
              Enter your PIN to send {usd(value)} to {first}.
            </Text>
            <View style={{ height: 22 }} />
            <PinPad validate={(pin) => pin !== '0000'} onSuccess={startProcessing} />
          </View>
        </Animated.View>
      )}

      {stage === 'processing' && (
        <Animated.View entering={FadeIn.duration(260)} exiting={FadeOut.duration(200)} style={[styles.overlay, styles.center]}>
          <FlowBackground intensity={intensity} />
          <Animated.View entering={ZoomIn.springify().damping(14)} style={{ width: W - 80 }}>
            <TransferTrack youName={youName} to={contact} trackKey={receipt.ref} />
          </Animated.View>
          <Text style={styles.procAmount}>{usd(value)}</Text>
          <Animated.Text key={msgIndex} entering={FadeInDown.duration(260)} style={styles.procMsg}>
            {msgs[msgIndex]}...
          </Animated.Text>
        </Animated.View>
      )}

      {stage === 'success' && (
        <Animated.View entering={FadeIn.duration(260)} style={styles.overlay}>
          <FlowBackground intensity={intensity} />
          <ScrollView contentContainerStyle={[styles.successScroll, { paddingTop: insets.top + 30, paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
            <View style={styles.badgeWrap}>
              <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.badge} />
              <LottieView source={assets.lottieSuccess} autoPlay loop={false} style={styles.burst} />
              {isSend && (
                <View style={styles.confettiOrigin}>
                  <Confetti />
                </View>
              )}
            </View>
            <Animated.Text entering={FadeInDown.delay(350).springify().damping(16)} style={styles.successTitle}>
              {isSend ? 'Money sent' : 'Request sent'}
            </Animated.Text>
            <Animated.Text entering={FadeInDown.delay(450).springify().damping(16)} style={styles.successSub}>
              {isSend ? `${usd(value)} is now with ${first}.` : `${first} will be notified about your ${usd(value)} request.`}
            </Animated.Text>

            <Animated.View entering={SlideInDown.delay(600).springify().damping(16)} style={styles.receipt}>
              <Text style={styles.receiptTitle}>{isSend ? 'Receipt' : 'Request details'}</Text>
              <View style={styles.dashClip}>
                <View style={styles.dash} />
              </View>
              <Line label={isSend ? 'To' : 'From'} value={contact.name} />
              <Line label="Amount" value={usd(value)} />
              <Line label="Fee" value="Free" />
              {note.trim() ? <Line label="Note" value={note.trim()} /> : null}
              <Line label="Reference" value={receipt.ref} />
              <Line label="Date" value={receipt.when} />
            </Animated.View>

            <Animated.View entering={FadeIn.delay(900)} style={styles.successBtns}>
              <PrimaryButton label="Done" onPress={finish} />
              <PrimaryButton label="Share receipt" tone="ghost" height={52} onPress={shareReceipt} />
            </Animated.View>
          </ScrollView>
        </Animated.View>
      )}

      <ConfirmDialog
        visible={dialog === 'confirm'}
        icon={isSend ? 'send' : 'request'}
        title={isSend ? `Send ${usd(value)} to ${first}?` : `Request ${usd(value)} from ${first}?`}
        message={isSend ? "The money leaves your balance right away and can't be recalled." : `${first} will get a notification asking them to pay you.`}
        confirmLabel={isSend ? 'Send money' : 'Send request'}
        onConfirm={onConfirm}
        onCancel={() => setDialog(null)}
      />
      <ConfirmDialog
        visible={dialog === 'discard'}
        tone="danger"
        icon="warning"
        title="Discard this payment?"
        message="Nothing has been sent. Your details will be cleared."
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
  stepArea: { flex: 1, overflow: 'hidden' },
  footer: { paddingHorizontal: 24, paddingTop: 10 },
  amountStep: { flex: 1, paddingHorizontal: 24, paddingTop: 18 },
  who: { flexDirection: 'row', alignItems: 'center', gap: 12, alignSelf: 'center', paddingVertical: 8, paddingLeft: 8, paddingRight: 18, borderRadius: 30, backgroundColor: c.card, borderWidth: 1, borderColor: c.stroke },
  whoLabel: { color: c.muted, fontSize: 12, fontWeight: '600' },
  whoName: { color: c.text, fontSize: 15, fontWeight: '800' },
  whoHandle: { color: c.muted, fontSize: 13, fontWeight: '500' },
  amountBox: { alignItems: 'stretch', marginTop: 22 },
  amountText: { color: c.text, fontSize: 64, fontWeight: '800', letterSpacing: -2, textAlign: 'center', alignSelf: 'stretch' },
  hint: { color: c.muted, fontSize: 14, textAlign: 'center', marginTop: 4, height: 20 },
  chips: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 16 },
  chip: { paddingHorizontal: 18, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: c.stroke, alignItems: 'center', justifyContent: 'center' },
  chipOn: { backgroundColor: c.accent, borderColor: c.accent },
  chipText: { color: c.text, fontSize: 15, fontWeight: '800' },
  padWrap: { flex: 1, justifyContent: 'flex-end', paddingBottom: 6 },
  reviewContent: { paddingHorizontal: 24, paddingTop: 18, paddingBottom: 24 },
  bigWho: { alignItems: 'center', marginBottom: 20 },
  reviewAmount: { color: c.text, fontSize: 44, fontWeight: '800', letterSpacing: -1.5, marginTop: 12 },
  reviewSub: { color: c.muted, fontSize: 15, marginTop: 2 },
  card: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 24, backgroundColor: c.card, borderWidth: 1, borderColor: c.stroke },
  line: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 11, gap: 16 },
  lineLabel: { color: c.muted, fontSize: 14 },
  lineVal: { color: c.text, fontSize: 15, fontWeight: '700', flexShrink: 1, textAlign: 'right' },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: c.ink, zIndex: 50, elevation: 50 },
  overlayHead: { paddingHorizontal: 24 },
  pinBody: { flex: 1, alignItems: 'center', paddingTop: 20 },
  lockBadge: { width: 68, height: 68, borderRadius: 34, backgroundColor: 'rgba(255,200,87,0.12)', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  pinTitle: { color: c.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.6 },
  pinSub: { color: c.muted, fontSize: 15, marginTop: 6, textAlign: 'center', paddingHorizontal: 40 },
  trackRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  track: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center' },
  trackFill: { height: 4, borderRadius: 2, backgroundColor: c.accent },
  trackDot: { position: 'absolute', width: 14, height: 14, borderRadius: 7, marginLeft: -7, backgroundColor: c.accent, shadowColor: c.accent, shadowOpacity: 0.9, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } },
  procAmount: { color: c.text, fontSize: 36, fontWeight: '800', letterSpacing: -1, marginTop: 34 },
  procMsg: { color: c.muted, fontSize: 16, fontWeight: '600', marginTop: 10 },
  successScroll: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 24 },
  badgeWrap: { width: 76, height: 76, marginBottom: 22 },
  badge: { width: 76, height: 76, borderRadius: 38, backgroundColor: c.accent },
  burst: { position: 'absolute', left: (76 - 220) / 2, top: (76 - 220) / 2, width: 220, height: 220, pointerEvents: 'none' },
  confettiOrigin: { position: 'absolute', left: 38, top: 38 },
  successTitle: { color: c.text, fontSize: 30, fontWeight: '800', letterSpacing: -0.8 },
  successSub: { color: c.muted, fontSize: 15, marginTop: 8, textAlign: 'center', paddingHorizontal: 20 },
  receipt: { alignSelf: 'stretch', marginTop: 28, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 10, borderRadius: 26, backgroundColor: '#111A3B', borderWidth: 1, borderColor: c.stroke },
  receiptTitle: { color: c.text, fontSize: 17, fontWeight: '800' },
  dashClip: { height: 1, overflow: 'hidden', marginVertical: 12 },
  dash: { height: 2, borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.22)' },
  successBtns: { alignSelf: 'stretch', gap: 12, marginTop: 24 },
});
