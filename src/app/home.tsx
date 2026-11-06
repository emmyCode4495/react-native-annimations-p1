import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { brand } from '../brand';
import { TabBar } from '../components/TabBar';
import { CardsTab } from '../screens/CardsTab';
import { HomeTab } from '../screens/HomeTab';
import { MeTab } from '../screens/MeTab';
import { PayTab } from '../screens/PayTab';

// Tab shell. Tabs stay mounted once opened, so switching back is instant and keeps scroll and state.
export default function Home() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState(0);
  const [visited, setVisited] = useState<number[]>([0]);

  const go = (i: number) => {
    setTab(i);
    setVisited((v) => (v.includes(i) ? v : [...v, i]));
  };
  const pane = (i: number) => [styles.pane, tab !== i && styles.hidden];

  return (
    <View style={styles.screen}>
      <View style={pane(0)}>
        <HomeTab onPay={() => go(2)} />
      </View>
      {visited.includes(1) && (
        <Animated.View entering={FadeIn.duration(250)} style={pane(1)}>
          <CardsTab />
        </Animated.View>
      )}
      {visited.includes(2) && (
        <Animated.View entering={FadeIn.duration(250)} style={pane(2)}>
          <PayTab />
        </Animated.View>
      )}
      {visited.includes(3) && (
        <Animated.View entering={FadeIn.duration(250)} style={pane(3)}>
          <MeTab />
        </Animated.View>
      )}
      <TabBar active={tab} onChange={go} bottom={insets.bottom + 12} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: brand.colors.ink },
  pane: { ...StyleSheet.absoluteFill },
  hidden: { display: 'none' },
});
