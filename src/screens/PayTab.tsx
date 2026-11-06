import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { brand } from '../brand';
import { Avatar } from '../components/Avatar';
import { CountUp } from '../components/CountUp';
import { GlowInput } from '../components/GlowInput';
import { Icon } from '../components/Icon';
import { PressableScale } from '../components/PressableScale';
import { SegmentedControl } from '../components/SegmentedControl';
import { TxnRow } from '../components/TxnRow';
import { useWallet } from '../wallet-store';

const c = brand.colors;
const layout = LinearTransition.springify().damping(20).stiffness(190);

export function PayTab() {
  const insets = useSafeAreaInsets();
  const { contacts, balance, txns, settings } = useWallet();
  const [mode, setMode] = useState(0); // 0 send, 1 request
  const [q, setQ] = useState('');

  const query = q.trim().toLowerCase();
  const list = contacts.filter((x) => `${x.name} ${x.handle}`.toLowerCase().includes(query));
  const open = (id: string) => router.push({ pathname: '/send', params: { to: id, mode: mode === 0 ? 'send' : 'request' } });

  return (
    <View style={styles.screen}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 120, paddingHorizontal: 24 }}
      >
        <Animated.View entering={FadeIn.duration(400)}>
          <Text style={styles.title}>Pay</Text>
          <Text style={styles.sub}>Move money to anyone, instantly and free.</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(100).springify().damping(16)} style={styles.block}>
          <SegmentedControl options={['Send', 'Request']} index={mode} onChange={setMode} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(180).springify().damping(16)} style={styles.balance}>
          <View style={styles.flex}>
            <Text style={styles.balLabel}>Available balance</Text>
            {settings.hideBalance ? (
              <Text style={styles.balAmt}>$ ••••••</Text>
            ) : (
              <CountUp to={balance} delay={300} duration={900} style={styles.balAmt} />
            )}
          </View>
          <View style={styles.bolt}>
            <Icon name="bolt" size={20} color={c.accent} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(260).springify().damping(16)} style={styles.search}>
          <GlowInput label="Search name or @handle" value={q} onChangeText={setQ} autoCapitalize="none" autoCorrect={false} />
        </Animated.View>

        {query.length === 0 && (
          <Animated.View entering={FadeIn.delay(300)} exiting={FadeOut.duration(120)}>
            <Text style={styles.section}>Recent</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -24 }} contentContainerStyle={styles.recentRow}>
              {contacts.slice(0, 6).map((p, i) => (
                <Animated.View key={p.id} entering={FadeInDown.delay(340 + i * 70).springify().damping(14)}>
                  <PressableScale haptic scaleTo={0.92} onPress={() => open(p.id)} style={styles.recent} accessibilityLabel={`${mode === 0 ? 'Send to' : 'Request from'} ${p.name}`}>
                    <Avatar name={p.name} color={p.color} size={62} />
                    <Text style={styles.recentName} numberOfLines={1}>
                      {p.name.split(' ')[0]}
                    </Text>
                  </PressableScale>
                </Animated.View>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        <Animated.Text layout={layout} style={styles.section}>
          {query.length === 0 ? 'All contacts' : `Results (${list.length})`}
        </Animated.Text>
        {list.map((p, i) => (
          <Animated.View key={p.id} layout={layout} entering={FadeInDown.delay(i < 8 ? 420 + i * 55 : 0).springify().damping(18)} exiting={FadeOut.duration(120)}>
            <PressableScale haptic scaleTo={0.98} onPress={() => open(p.id)} style={styles.contact} accessibilityLabel={p.name}>
              <Avatar name={p.name} color={p.color} />
              <View style={styles.flex}>
                <Text style={styles.cName}>{p.name}</Text>
                <Text style={styles.cHandle}>{p.handle}</Text>
              </View>
              <Icon name="chevron" size={20} color={c.muted} />
            </PressableScale>
          </Animated.View>
        ))}
        {list.length === 0 && (
          <Animated.Text entering={FadeIn} style={styles.none}>
            No one matches &quot;{q.trim()}&quot;.
          </Animated.Text>
        )}

        {query.length === 0 && (
          <Animated.View layout={layout}>
            <Text style={styles.section}>Latest activity</Text>
            {txns.slice(0, 3).map((t, i) => (
              <TxnRow key={t.id} txn={t} delay={t.fresh ? 150 : 700 + i * 80} />
            ))}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.ink },
  flex: { flex: 1 },
  title: { color: c.text, fontSize: 32, fontWeight: '800', letterSpacing: -1 },
  sub: { color: c.muted, fontSize: 15, marginTop: 4 },
  block: { marginTop: 20 },
  balance: { flexDirection: 'row', alignItems: 'center', marginTop: 14, padding: 18, borderRadius: 24, backgroundColor: c.card, borderWidth: 1, borderColor: c.stroke },
  balLabel: { color: c.muted, fontSize: 13, fontWeight: '600' },
  balAmt: { color: c.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.8, padding: 0, marginTop: 2 },
  bolt: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,200,87,0.12)', alignItems: 'center', justifyContent: 'center' },
  search: { marginTop: 18, marginBottom: -4 },
  section: { color: c.text, fontSize: 19, fontWeight: '800', letterSpacing: -0.4, marginTop: 22, marginBottom: 8 },
  recentRow: { paddingHorizontal: 24, gap: 18 },
  recent: { alignItems: 'center', gap: 8, width: 68 },
  recentName: { color: c.text, fontSize: 13, fontWeight: '600' },
  contact: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10 },
  cName: { color: c.text, fontSize: 16, fontWeight: '700' },
  cHandle: { color: c.muted, fontSize: 13, marginTop: 2 },
  none: { color: c.muted, fontSize: 15, textAlign: 'center', marginTop: 24 },
});
