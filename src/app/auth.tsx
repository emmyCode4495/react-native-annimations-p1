import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOutUp,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlowBackground } from '../FlowBackground';
import { brand } from '../brand';
import { GlowInput } from '../components/GlowInput';
import { LogoMark } from '../components/LogoMark';
import { SubmitButton, SubmitStatus } from '../components/SubmitButton';
import { useWallet } from '../wallet-store';

const c = brand.colors;
type Mode = 'login' | 'signup';
type Errors = { name?: string; email?: string; password?: string };

const COPY = {
  signup: { title: 'Create your account', sub: 'Open an account in under two minutes.', cta: 'Create account' },
  login: { title: 'Welcome back', sub: 'Log in to see where your money is today.', cta: 'Log in' },
};

const layout = LinearTransition.springify().damping(20).stiffness(180);

function Segmented({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const [w, setW] = useState(0);
  const x = useSharedValue(1);

  useEffect(() => {
    x.value = withSpring(mode === 'login' ? 0 : 1, { damping: 16, stiffness: 220 });
  }, [mode, x]);

  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.value * (w / 2) }] }));

  return (
    <View style={styles.seg} onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width - 8)}>
      <Animated.View style={[styles.segPill, { width: w / 2 }, pill]} />
      {(['login', 'signup'] as Mode[]).map((m) => (
        <Pressable
          key={m}
          style={styles.segTab}
          onPress={() => {
            if (m !== mode) Haptics.selectionAsync();
            onChange(m);
          }}
        >
          <Text style={[styles.segText, mode === m && styles.segTextOn]}>{m === 'login' ? 'Log in' : 'Sign up'}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function Auth() {
  const insets = useSafeAreaInsets();
  const { setProfile } = useWallet();
  const [mode, setMode] = useState<Mode>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const intensity = useSharedValue(0.7);
  const shake = useSharedValue(0);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const formStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  const runShake = () => {
    shake.set(
      withSequence(
        withTiming(-12, { duration: 50 }),
        withRepeat(withTiming(12, { duration: 90 }), 5, true),
        withTiming(0, { duration: 50 }),
      ),
    );
  };

  const validate = (): Errors => {
    const e: Errors = {};
    if (mode === 'signup' && name.trim().length < 2) e.name = 'Enter your full name.';
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = 'Enter a valid email, like you@example.com.';
    if (password.length < 8) e.password = 'Use at least 8 characters.';
    return e;
  };

  const submit = () => {
    if (status !== 'idle') return;
    Keyboard.dismiss();
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) {
      runShake();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setStatus('loading');
    const raw = name.trim() || email.trim().split('@')[0];
    const display = raw.charAt(0).toUpperCase() + raw.slice(1);
    timers.current.push(
      setTimeout(() => {
        setStatus('success');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        timers.current.push(
          setTimeout(() => {
            setProfile({ name: display, email: email.trim() });
            router.replace('/home');
          }, 1500),
        );
      }, 1500),
    );
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setErrors({});
  };

  const copy = COPY[mode];

  return (
    <View style={styles.screen}>
      <FlowBackground intensity={intensity} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeIn.duration(500)} style={styles.topRow}>
            <Pressable onPress={() => router.back()} hitSlop={14} style={styles.back}>
              <Text style={styles.backText}>‹</Text>
            </Pressable>
            <LogoMark size={44} delay={200} />
          </Animated.View>

          <Animated.View key={mode} entering={FadeInDown.springify().damping(18)} style={styles.head}>
            <Text style={styles.title}>{copy.title}</Text>
            <Text style={styles.sub}>{copy.sub}</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(120).springify().damping(18)}>
            <Segmented mode={mode} onChange={switchMode} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(220).springify().damping(18)} style={[styles.card, formStyle]}>
            {mode === 'signup' && (
              <Animated.View key="name" entering={FadeInDown.springify().damping(16)} exiting={FadeOutUp.duration(150)} layout={layout}>
                <GlowInput
                  label="Full name"
                  value={name}
                  onChangeText={(t) => {
                    setName(t);
                    if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
                  }}
                  error={errors.name}
                  autoCapitalize="words"
                  autoComplete="name"
                />
              </Animated.View>
            )}
            <Animated.View layout={layout}>
              <GlowInput
                label="Email"
                value={email}
                onChangeText={(t) => {
                  setEmail(t);
                  if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
                }}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </Animated.View>
            <Animated.View layout={layout}>
              <GlowInput
                label="Password"
                value={password}
                onChangeText={(t) => {
                  setPassword(t);
                  if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
                }}
                error={errors.password}
                password
                autoCapitalize="none"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </Animated.View>
            {mode === 'login' && (
              <Animated.View entering={FadeIn.duration(250)} exiting={FadeOutUp.duration(120)} layout={layout}>
                <Text style={styles.forgot}>Forgot password?</Text>
              </Animated.View>
            )}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(320).springify().damping(18)} layout={layout} style={styles.cta}>
            <SubmitButton label={copy.cta} status={status} onPress={submit} />
          </Animated.View>

          <Animated.View entering={FadeIn.delay(520).duration(500)} layout={layout}>
            <View style={styles.dividerRow}>
              <View style={styles.line} />
              <Text style={styles.or}>or continue with</Text>
              <View style={styles.line} />
            </View>
            <View style={styles.socialRow}>
              {['Apple', 'Google'].map((p) => (
                <Pressable
                  key={p}
                  style={({ pressed }) => [styles.social, pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] }]}
                  onPress={() => Haptics.selectionAsync()}
                >
                  <Text style={styles.socialText}>{p}</Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.ink },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 24 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 },
  back: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.stroke,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: c.text, fontSize: 26, lineHeight: 28, marginTop: -2 },
  head: { marginBottom: 22 },
  title: { color: c.text, fontSize: 34, fontWeight: '800', letterSpacing: -1 },
  sub: { color: c.muted, fontSize: 16, lineHeight: 22, marginTop: 8 },
  seg: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 18,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.stroke,
    marginBottom: 18,
  },
  segPill: { position: 'absolute', left: 4, top: 4, bottom: 4, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.14)' },
  segTab: { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center' },
  segText: { color: c.muted, fontSize: 15, fontWeight: '700' },
  segTextOn: { color: c.text },
  card: {
    padding: 18,
    paddingBottom: 6,
    borderRadius: 28,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.stroke,
  },
  forgot: { color: c.accent, fontSize: 14, fontWeight: '700', textAlign: 'right', marginBottom: 12, marginTop: -2 },
  cta: { marginTop: 22 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 28, marginBottom: 18 },
  line: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: c.stroke },
  or: { color: c.muted, fontSize: 13 },
  socialRow: { flexDirection: 'row', gap: 12 },
  social: {
    flex: 1,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    borderColor: c.stroke,
    backgroundColor: c.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialText: { color: c.text, fontSize: 15, fontWeight: '700' },
});
