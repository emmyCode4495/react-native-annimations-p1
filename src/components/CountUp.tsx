import React, { useEffect } from 'react';
import { StyleProp, TextInput, TextStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

const AnimatedInput = Animated.createAnimatedComponent(TextInput);

function money(n: number, d: number) {
  'worklet';
  const [whole, cents] = n.toFixed(d).split('.');
  return '$' + whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (d > 0 ? '.' + cents : '');
}

type Props = { to: number; delay?: number; duration?: number; decimals?: number; style?: StyleProp<TextStyle> };

// Counts up on the UI thread. A read-only TextInput is the usual trick because
// its text can be driven by animated props without re-rendering React.
export function CountUp({ to, delay = 0, duration = 1800, decimals = 2, style }: Props) {
  const v = useSharedValue(0);

  useEffect(() => {
    v.value = withDelay(delay, withTiming(to, { duration, easing: Easing.out(Easing.exp) }));
  }, [to, delay, duration, v]);

  const animatedProps = useAnimatedProps(() => {
    const s = money(v.value, decimals);
    return { text: s, defaultValue: s } as any;
  });

  return (
    <AnimatedInput
      editable={false}
      pointerEvents="none"
      underlineColorAndroid="transparent"
      animatedProps={animatedProps}
      defaultValue={money(0, decimals)}
      style={style}
    />
  );
}
