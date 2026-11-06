import React from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, StyleSheet, Text, View } from 'react-native';
import Animated, {
  SharedValue,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { brand } from '../brand';
import { CardModel } from '../cards-store';
import { CARD_RATIO, FlipCard } from './CardFace';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

const c = brand.colors;
const GAP = 14;

export function carouselMetrics(screenW: number) {
  const cardW = Math.min(300, screenW - 72);
  return { cardW, item: cardW + GAP, side: (screenW - cardW) / 2 };
}

type ItemProps = { index: number; item: number; scrollX: SharedValue<number>; children: React.ReactNode };

function Item({ index, item, scrollX, children }: ItemProps) {
  const style = useAnimatedStyle(() => {
    const d = (scrollX.value - index * item) / item;
    return {
      opacity: interpolate(d, [-1, 0, 1], [0.5, 1, 0.5], 'clamp'),
      transform: [
        { scale: interpolate(d, [-1, 0, 1], [0.88, 1, 0.88], 'clamp') },
        { rotate: `${interpolate(d, [-1, 0, 1], [-4, 0, 4], 'clamp')}deg` },
      ],
    };
  });
  return <Animated.View style={[{ marginRight: GAP }, style]}>{children}</Animated.View>;
}

type Props = {
  cards: CardModel[];
  width: number;
  flippedId: string | null;
  scrollRef: React.RefObject<Animated.ScrollView | null>;
  onTapCard: (id: string) => void;
  onAdd: () => void;
  onIndexChange: (i: number) => void;
};

export function CardCarousel({ cards, width, flippedId, scrollRef, onTapCard, onAdd, onIndexChange }: Props) {
  const { cardW, item, side } = carouselMetrics(width);
  const scrollX = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollX.value = e.contentOffset.x;
  });

  return (
    <Animated.ScrollView
      ref={scrollRef}
      horizontal
      snapToInterval={item}
      decelerationRate="fast"
      showsHorizontalScrollIndicator={false}
      scrollEventThrottle={16}
      onScroll={onScroll}
      onMomentumScrollEnd={(e: NativeSyntheticEvent<NativeScrollEvent>) =>
        onIndexChange(Math.round(e.nativeEvent.contentOffset.x / item))
      }
      contentContainerStyle={{ paddingHorizontal: side, paddingVertical: 12 }}
    >
      {cards.map((card, i) => (
        <Item key={card.id} index={i} item={item} scrollX={scrollX}>
          <FlipCard card={card} width={cardW} flipped={flippedId === card.id} onPress={() => onTapCard(card.id)} />
        </Item>
      ))}
      <Item index={cards.length} item={item} scrollX={scrollX}>
        <PressableScale onPress={onAdd} haptic style={[styles.add, { width: cardW, height: cardW * CARD_RATIO }]} accessibilityLabel="Create a new card">
          <View style={styles.addIcon}>
            <Icon name="plus" size={26} color={c.accent} />
          </View>
          <Text style={styles.addText}>New card</Text>
          <Text style={styles.addSub}>Virtual in seconds</Text>
        </PressableScale>
      </Item>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  add: {
    borderRadius: 22,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.28)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addIcon: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,200,87,0.14)', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  addText: { color: c.text, fontSize: 16, fontWeight: '800' },
  addSub: { color: c.muted, fontSize: 13 },
});
