import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { brand } from '../brand';
import { usd } from '../format';
import { Txn } from '../wallet-store';
import { Avatar } from './Avatar';

const c = brand.colors;

export function TxnRow({ txn, delay = 0 }: { txn: Txn; delay?: number }) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify().damping(18)} style={styles.row}>
      <Avatar name={txn.name} color={txn.color} />
      <View style={styles.flex}>
        <Text style={styles.name}>{txn.name}</Text>
        <Text style={styles.sub}>
          {txn.cat}, {txn.when}
        </Text>
      </View>
      {txn.pending ? (
        <Text style={styles.pending}>Pending</Text>
      ) : (
        <Text style={[styles.amt, txn.amt > 0 && { color: c.success }]}>{usd(txn.amt, { sign: true })}</Text>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  name: { color: c.text, fontSize: 16, fontWeight: '700' },
  sub: { color: c.muted, fontSize: 13, marginTop: 2 },
  amt: { color: c.text, fontSize: 16, fontWeight: '700' },
  pending: { color: c.accent, fontSize: 14, fontWeight: '700' },
});
