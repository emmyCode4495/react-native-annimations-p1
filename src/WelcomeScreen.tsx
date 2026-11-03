import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { assets, brand } from './brand';
import { FlowBackground } from './FlowBackground';
import { FloatingCards } from './components/FloatingCards';
import { LogoMark } from './components/LogoMark';
import { HeroVideo } from './HeroVideo';
import { MagneticButton } from './MagneticButton';

const c = brand.colors;

const LOGO_W = 128;
const LOGO_H = 44;
const SPLASH_HOLD = 1900; // ms the logo sits centered before it travels up
const MOVE_MS = 900;

type Props = { onStart?: () => void };

export function WelcomeScreen({ onStart }: Props) {
  const { width: W, height: H } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const intro = useSharedValue(0); // logo entrance
  const phase = useSharedValue(0); // 0 = splash, 1 = welcome
  const intensity = useSharedValue(0); // background glow
  const [welcome, setWelcome] = useState(false);

  useEffect(() => {
    intro.value = withDelay(300, withSpring(1, { damping: 12, stiffness: 120 }));
    intensity.value = withDelay(200, withTiming(0.35, { duration: 1400 }));

    phase.value = withDelay(
      SPLASH_HOLD,
      withTiming(1, { duration: MOVE_MS, easing: Easing.inOut(Easing.cubic) }),
    );
    intensity.value = withDelay(SPLASH_HOLD, withTiming(1, { duration: 1600 }));

    // The welcome content mounts as the logo starts moving, so its entering animations play on cue.
    const id = setTimeout(() => setWelcome(true), SPLASH_HOLD + 250);
    return () => clearTimeout(id);
  }, [intro, phase, intensity]);

  // The logo travels from screen center to the top-left corner and shrinks to its resting size.
  const logoStyle = useAnimatedStyle(() => {
    const startX = W / 2 - LOGO_W / 2;
    const startY = H * 0.4 - LOGO_H / 2;
    const endX = 28;
    const endY = insets.top + 20;
    return {
      opacity: intro.value,
      transform: [
        { translateX: interpolate(phase.value, [0, 1], [startX, endX]) },
        { translateY: interpolate(phase.value, [0, 1], [startY, endY]) },
        { scale: interpolate(phase.value, [0, 1], [1.5, 1]) * (0.6 + intro.value * 0.4) },
      ],
    };
  });

  return (
    <View style={styles.screen}>
      {assets.heroVideo != null && <HeroVideo source={assets.heroVideo} />}
      <FlowBackground intensity={intensity} transparent={assets.heroVideo != null} />
      <LinearGradient
        colors={['transparent', c.ink]}
        locations={[0.35, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <Animated.View style={[styles.logo, logoStyle]} pointerEvents="none">
        {/* Rendered at 1.5x and scaled down so the mark stays crisp while it is enlarged on the splash */}
        <View style={styles.logoMark}>
          <View style={styles.logoMarkInner}>
            <LogoMark size={66} delay={450} />
          </View>
        </View>
        <Text style={styles.logoName}>{brand.name}</Text>
        <LottieView source={assets.lottieSparkle} autoPlay loop style={styles.sparkle} />
      </Animated.View>

      {welcome && <FloatingCards top={insets.top + 92} />}

      {welcome && (
        <View style={[styles.content, { paddingTop: insets.top + 90, paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.copy}>
            {brand.headline.map((line, i) => (
              <Animated.Text
                key={line}
                entering={FadeInDown.delay(i * 140).springify().damping(18)}
                style={styles.headline}
              >
                {line}
              </Animated.Text>
            ))}
            <Animated.Text entering={FadeInDown.delay(420).springify().damping(18)} style={styles.sub}>
              {brand.subline}
            </Animated.Text>
          </View>

          <Animated.View entering={FadeIn.delay(650).duration(500)} style={styles.cta}>
            <Animated.View entering={FadeInDown.delay(650).springify().damping(13)}>
              <MagneticButton
                label={brand.cta}
                color={c.accent}
                textColor={c.onAccent}
                onPress={onStart}
              />
            </Animated.View>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.ink },
  logo: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: LOGO_W,
    height: LOGO_H,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoMark: { width: 44, height: 44 },
  logoMarkInner: { position: 'absolute', left: -11, top: -11, width: 66, height: 66, transform: [{ scale: 2 / 3 }] },
  logoName: { fontSize: 22, fontWeight: '800', color: c.text, letterSpacing: -0.3 },
  sparkle: { position: 'absolute', left: 20, top: -30, width: 44, height: 44 },
  content: { ...StyleSheet.absoluteFill, paddingHorizontal: 28, justifyContent: 'space-between' },
  copy: { flex: 1, justifyContent: 'flex-end', paddingBottom: 12 },
  headline: {
    fontSize: 46,
    lineHeight: 50,
    fontWeight: '800',
    color: c.text,
    letterSpacing: -1.5,
  },
  sub: { fontSize: 17, lineHeight: 24, color: c.muted, maxWidth: 300, marginTop: 16 },
  cta: { alignItems: 'center' },
});