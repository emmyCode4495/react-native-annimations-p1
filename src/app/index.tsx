import React, { useState } from 'react';
import { Pressable, StatusBar, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { WelcomeScreen } from '../WelcomeScreen';

// Recording tip: tap the invisible square in the top-right corner to replay the
// splash and welcome sequence from the start for a fresh take.
export default function App() {
  const [take, setTake] = useState(0);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" />
        <View style={styles.root}>
          <WelcomeScreen key={take} onStart={() => console.log('Get started')} />
          <Pressable style={styles.replay} onPress={() => setTake((n) => n + 1)} />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  replay: { position: 'absolute', top: 0, right: 0, width: 80, height: 80, zIndex: 10 },
});