import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AuthScreen } from '../screens/AuthScreen';

export default function AuthRoute() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" />
      <AuthScreen
        onSuccess={() => router.replace('/home')}
        onBack={() => router.back()}
      />
    </SafeAreaProvider>
  );
}
