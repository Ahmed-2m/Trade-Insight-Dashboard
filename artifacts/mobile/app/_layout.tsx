import React, { useEffect } from 'react';
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
import { TradesProvider, useTrades } from '@/context/TradesContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabase';
import { setApiTokenGetter } from '@/lib/api';

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient();

function SupabaseBridge() {
  const { onAuthChange } = useTrades();

  useEffect(() => {
    // إعداد التوكن للطلبات
    setApiTokenGetter(async () => {
      const { data } = await supabase.auth.getSession();
      return data.session?.access_token ?? null;
    });

    // استماع للتغيرات في حالة تسجيل الدخول
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      onAuthChange(!!session);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [onAuthChange]);

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
    <SafeAreaProvider>
      <LanguageProvider>
        <ErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <TradesProvider>
              <GestureHandlerRootView style={{ flex: 1 }}>
                <KeyboardProvider>
                  <SupabaseBridge />
                  <RootLayoutNav />
                </KeyboardProvider>
              </GestureHandlerRootView>
            </TradesProvider>
          </QueryClientProvider>
        </ErrorBoundary>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

