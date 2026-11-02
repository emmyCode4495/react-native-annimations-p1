import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { HomeScreen } from '../screens/HomeScreen';

export default function HomeRoute() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <HomeScreen onLogout={() => router.replace('/')} />
    </SafeAreaProvider>
  );
}
