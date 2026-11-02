import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { brand } from '../brand';
import { AuroraBackground } from '../components/AuroraBackground';
import { MagneticButton } from '../components/MagneticButton';

const c = brand.colors;

type Mode = 'login' | 'signup';

type Props = {
  onSuccess?: () => void;
  onBack?: () => void;
};

export function AuthScreen({ onSuccess, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const intensity = useSharedValue(0.6);
  const tab = useSharedValue(0); // 0 = login, 1 = signup

  useEffect(() => {
    intensity.value = withTiming(0.7, { duration: 800 });
  }, [intensity]);

  const switchMode = (next: Mode) => {
    if (next === mode) return;
    Haptics.selectionAsync();
    setMode(next);
    tab.value = withSpring(next === 'login' ? 0 : 1, { damping: 18, stiffness: 220 });
  };

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(tab.value, [0, 1], [0, 148]) }],
  }));

  const handleSubmit = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSuccess?.();
  };

  return (
    <View style={styles.screen}>
      <AuroraBackground intensity={intensity} />
      <LinearGradient
        colors={['transparent', c.ink]}
        locations={[0.4, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={12}
      >
        <View style={[styles.inner, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 20 }]}>
          {/* Header */}
          <Animated.View entering={FadeInDown.delay(80).springify().damping(16)} style={styles.header}>
            <Pressable onPress={onBack} hitSlop={12} style={styles.backBtn}>
              <Text style={styles.backText}>←</Text>
            </Pressable>
            <View style={styles.logoRow}>
              <View style={styles.logoMark}>
                <Text style={styles.logoGlyph}>T</Text>
              </View>
              <Text style={styles.logoName}>{brand.name}</Text>
            </View>
          </Animated.View>

          {/* Title */}
          <Animated.View entering={FadeInDown.delay(160).springify().damping(16)} style={styles.titleBlock}>
            <Text style={styles.title}>{mode === 'login' ? 'Welcome back' : 'Create account'}</Text>
            <Text style={styles.subtitle}>
              {mode === 'login'
                ? 'Sign in to move money at your speed.'
                : 'Join Tallyo and start moving money instantly.'}
            </Text>
          </Animated.View>

          {/* Segmented control */}
          <Animated.View entering={FadeIn.delay(240).duration(400)} style={styles.segment}>
            <Animated.View style={[styles.segmentIndicator, indicatorStyle]} />
            <Pressable style={styles.segmentBtn} onPress={() => switchMode('login')}>
              <Text style={[styles.segmentLabel, mode === 'login' && styles.segmentLabelActive]}>
                Log in
              </Text>
            </Pressable>
            <Pressable style={styles.segmentBtn} onPress={() => switchMode('signup')}>
              <Text style={[styles.segmentLabel, mode === 'signup' && styles.segmentLabelActive]}>
                Sign up
              </Text>
            </Pressable>
          </Animated.View>

          {/* Form */}
          <View style={styles.form}>
            {mode === 'signup' && (
              <Animated.View entering={FadeInDown.springify().damping(16)} key="name">
                <Field
                  label="Full name"
                  value={name}
                  onChangeText={setName}
                  focused={focused === 'name'}
                  onFocus={() => setFocused('name')}
                  onBlur={() => setFocused(null)}
                  autoCapitalize="words"
                />
              </Animated.View>
            )}

            <Animated.View entering={FadeInDown.delay(mode === 'signup' ? 60 : 0).springify().damping(16)}>
              <Field
                label="Email"
                value={email}
                onChangeText={setEmail}
                focused={focused === 'email'}
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(mode === 'signup' ? 120 : 60).springify().damping(16)}>
              <Field
                label="Password"
                value={password}
                onChangeText={setPassword}
                focused={focused === 'password'}
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
                secureTextEntry={!showPass}
                right={
                  <Pressable onPress={() => setShowPass((v) => !v)} hitSlop={8}>
                    <Text style={styles.showPass}>{showPass ? 'Hide' : 'Show'}</Text>
                  </Pressable>
                }
              />
            </Animated.View>
          </View>

          {mode === 'login' && (
            <Animated.View entering={FadeIn.delay(320)} style={styles.forgotRow}>
              <Pressable>
                <Text style={styles.forgot}>Forgot password?</Text>
              </Pressable>
            </Animated.View>
          )}

          {/* CTA */}
          <Animated.View entering={FadeInUp.delay(380).springify().damping(14)} style={styles.cta}>
            <MagneticButton
              label={mode === 'login' ? 'Log in' : 'Create account'}
              color={c.accent}
              textColor={c.onAccent}
              onPress={handleSubmit}
              width={280}
            />
          </Animated.View>

          {/* Divider + social */}
          <Animated.View entering={FadeIn.delay(460)} style={styles.dividerRow}>
            <View style={styles.line} />
            <Text style={styles.or}>or continue with</Text>
            <View style={styles.line} />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(520).springify().damping(16)} style={styles.socialRow}>
            <SocialBtn label="Apple" onPress={handleSubmit} />
            <SocialBtn label="Google" onPress={handleSubmit} />
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  focused,
  onFocus,
  onBlur,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  right,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  focused: boolean;
  onFocus: () => void;
  onBlur: () => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'words';
  right?: React.ReactNode;
}) {
  return (
    <View style={[styles.field, focused && styles.fieldFocused]}>
      <Text style={[styles.fieldLabel, focused && styles.fieldLabelFocused]}>{label}</Text>
      <View style={styles.fieldRow}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          placeholderTextColor={c.muted}
          selectionColor={c.accent}
        />
        {right}
      </View>
    </View>
  );
}

function SocialBtn({ label, onPress }: { label: string; onPress?: () => void }) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.();
      }}
      style={({ pressed }) => [styles.socialBtn, pressed && { opacity: 0.75, transform: [{ scale: 0.97 }] }]}
    >
      <Text style={styles.socialLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.ink },
  inner: { flex: 1, paddingHorizontal: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 28,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: c.text, fontSize: 20, fontWeight: '600' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoMark: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: c.accent,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-8deg' }],
  },
  logoGlyph: { fontSize: 16, fontWeight: '900', color: c.onAccent },
  logoName: { fontSize: 18, fontWeight: '800', color: c.text },
  titleBlock: { marginBottom: 28 },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: c.text,
    letterSpacing: -0.8,
    marginBottom: 8,
  },
  subtitle: { fontSize: 15, lineHeight: 22, color: c.muted, maxWidth: 300 },
  segment: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 4,
    marginBottom: 24,
    position: 'relative',
  },
  segmentIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 144,
    height: 40,
    borderRadius: 11,
    backgroundColor: c.indigo,
  },
  segmentBtn: {
    flex: 1,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  segmentLabel: { fontSize: 15, fontWeight: '600', color: c.muted },
  segmentLabelActive: { color: c.text },
  form: { gap: 14 },
  field: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
  },
  fieldFocused: {
    borderColor: c.indigo,
    backgroundColor: 'rgba(79,91,255,0.08)',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: c.muted,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  fieldLabelFocused: { color: c.indigo },
  fieldRow: { flexDirection: 'row', alignItems: 'center' },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: c.text,
    paddingVertical: 2,
  },
  showPass: { fontSize: 13, fontWeight: '600', color: c.indigo },
  forgotRow: { alignItems: 'flex-end', marginTop: 12, marginBottom: 8 },
  forgot: { fontSize: 13, fontWeight: '600', color: c.indigo },
  cta: { alignItems: 'center', marginTop: 8 },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  line: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  or: { fontSize: 12, color: c.muted, fontWeight: '500' },
  socialRow: { flexDirection: 'row', gap: 12 },
  socialBtn: {
    flex: 1,
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialLabel: { fontSize: 15, fontWeight: '600', color: c.text },
});
