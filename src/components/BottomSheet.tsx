import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { brand } from '../brand';

const c = brand.colors;

type Props = { visible: boolean; title: string; onClose: () => void; children: React.ReactNode };

export function BottomSheet({ visible, title, onClose, children }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <>
      {visible && (
        <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(200)} style={styles.layer}>
          <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close" />
          <Animated.View
            entering={SlideInDown.springify().damping(18).stiffness(160)}
            style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}
          >
            <View style={styles.handle} />
            <Text style={styles.title}>{title}</Text>
            {children}
          </Animated.View>
        </Animated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  layer: { ...StyleSheet.absoluteFill, justifyContent: 'flex-end', zIndex: 90, elevation: 90 },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(3,6,18,0.7)' },
  sheet: {
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: '#111A3B',
    borderWidth: 1,
    borderColor: c.stroke,
  },
  handle: { alignSelf: 'center', width: 42, height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 18 },
  title: { color: c.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.5, marginBottom: 16 },
});
