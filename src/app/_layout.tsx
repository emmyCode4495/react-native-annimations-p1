import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { brand } from '../brand';
import { CardsProvider } from '../cards-store';
import { WalletProvider } from '../wallet-store';

// Keep the native splash up until the first frame of our own animated splash is ready,
// so the hand-off is seamless (the native splash color matches brand.colors.ink).
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" />
        <WalletProvider>
        <CardsProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'fade',
              contentStyle: { backgroundColor: brand.colors.ink },
            }}
          >
            <Stack.Screen
              name="new-card"
              options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom', gestureEnabled: false }}
            />
            <Stack.Screen
              name="send"
              options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom', gestureEnabled: false }}
            />
          </Stack>
        </CardsProvider>
        </WalletProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: brand.colors.ink } });
