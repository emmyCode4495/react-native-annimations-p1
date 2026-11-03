import { router } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { WelcomeScreen } from '../WelcomeScreen';

// Recording tip: tap the invisible square in the top-right corner to replay the
// splash and welcome sequence from the start for a fresh take.
export default function Index() {
  const [take, setTake] = useState(0);

  return (
    <View style={styles.root}>
      <WelcomeScreen key={take} onStart={() => router.push('/auth')} />
      <Pressable style={styles.replay} onPress={() => setTake((n) => n + 1)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  replay: { position: 'absolute', top: 0, right: 0, width: 80, height: 80, zIndex: 10 },
});
