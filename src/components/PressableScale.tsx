import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

type Props = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>; // the visual (scaled) view
  containerStyle?: StyleProp<ViewStyle>; // the touch target, e.g. { flex: 1 }
  scaleTo?: number;
  haptic?: boolean;
};

// The one press feel used across the app: springs down on touch, overshoots back on release.
export function PressableScale({ children, style, containerStyle, scaleTo = 0.96, haptic, onPressIn, onPressOut, ...rest }: Props) {
  const s = useSharedValue(1);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));

  return (
    <Pressable
      accessibilityRole="button"
      {...rest}
      style={containerStyle}
      onPressIn={(e) => {
        s.set(withSpring(scaleTo, { damping: 15, stiffness: 320 }));
        if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        s.set(withSpring(1, { damping: 9, stiffness: 220 }));
        onPressOut?.(e);
      }}
    >
      <Animated.View style={[style, a]}>{children as React.ReactNode}</Animated.View>
    </Pressable>
  );
}
