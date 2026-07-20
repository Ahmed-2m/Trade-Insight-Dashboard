import React, { useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { ClerkProvider, ClerkLoaded, useAuth } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { TradesProvider, useTrades } from '@/context/TradesContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { setApiTokenGetter } from '@/lib/api';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

// وضع مفتاح تجريبي آمن في حال عدم وجود المفتاح لمنع انهيار التطبيق
const publishableKey =
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  'pk_test_cGxlYXNlLXByb3ZpZGUtY2xlcmstcGstdG8tZW5hYmxlLWF1dGgm';

/**
 * Bridges Clerk auth state into TradesContext (cloud sync).
 */
function ClerkBridge() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const { onAuthChange } = useTrades();
  const prevSignedIn = useRef<boolean | undefined>(undefined);

  useEffect(() => {
    setApiTokenGetter(() => getToken());
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;
    if (prevSignedIn.current !== isSignedIn) {
      prevSignedIn.current = isSignedIn;
      onAuthChange(isSignedIn ?? false);
    }
  }, [isSignedIn, isLoaded, onAuthChange]);

  return null;
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="trade/new" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="trade/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <LanguageProvider>
      <SafeAreaProvider>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
              <ClerkLoaded>
                <TradesProvider>
                  <GestureHandlerRootView style={{ flex: 1 }}>
                    <KeyboardProvider>
                      <ClerkBridge />
                      <RootLayoutNav />
                    </KeyboardProvider>
                  </GestureHandlerRootView>
                </TradesProvider>
              </ClerkLoaded>
            </ClerkProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </LanguageProvider>
  );
}
