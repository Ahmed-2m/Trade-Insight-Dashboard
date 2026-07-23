import React from 'react';
import { Platform, StyleSheet, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // 👈 استيراد حواف الأمان
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Tabs } from 'expo-router';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { SymbolView } from 'expo-symbols';
import { useLanguage } from '@/context/LanguageContext';

function NativeTabLayout() {
  const { t, isRTL } = useLanguage();

  const triggers = [
    <NativeTabs.Trigger key="index" name="index">
      <Icon sf={{ default: 'chart.bar', selected: 'chart.bar.fill' }} />
      <Label>{t.tabs.dashboard}</Label>
    </NativeTabs.Trigger>,
    <NativeTabs.Trigger key="journal" name="journal">
      <Icon sf={{ default: 'book', selected: 'book.fill' }} />
      <Label>{t.tabs.journal}</Label>
    </NativeTabs.Trigger>,
    <NativeTabs.Trigger key="stats" name="stats">
      <Icon sf={{ default: 'chart.line.uptrend.xyaxis', selected: 'chart.line.uptrend.xyaxis' }} />
      <Label>{t.tabs.statistics}</Label>
    </NativeTabs.Trigger>,
    <NativeTabs.Trigger key="insights" name="insights">
      <Icon sf={{ default: 'lightbulb', selected: 'lightbulb.fill' }} />
      <Label>{t.tabs.insights}</Label>
    </NativeTabs.Trigger>,
    <NativeTabs.Trigger key="profile" name="profile">
      <Icon sf={{ default: 'person.circle', selected: 'person.circle.fill' }} />
      <Label>{t.tabs.profile}</Label>
    </NativeTabs.Trigger>,
  ];

  return <NativeTabs>{isRTL ? triggers.reverse() : triggers}</NativeTabs>;
}

function ClassicTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets(); // 👈 جلب قيمة المساحة الآمنة السفلية للجهاز
  const { t } = useLanguage();
  
  const isDark = colorScheme === 'dark';
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';

  // 📐 حساب الارتفاع والحشو السفلي ديناميكياً لعدم التداخل مع شريط نظام الموبايل
  const basePaddingBottom = isWeb ? 34 : Math.max(insets.bottom, 12);
  const calculatedHeight = isWeb ? 84 : 56 + basePaddingBottom;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isIOS ? 'transparent' : colors.tabBg,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          height: calculatedHeight, // 👈 ارتفاع ديناميكي يشمل مسافة أمان الموبايل
          paddingBottom: basePaddingBottom, // 👈 رفع الأيقونات والنصوص فوق شريط النظام السفلي
          paddingTop: 8,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={80}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          ) : null,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.tabs.dashboard,
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView name={focused ? 'chart.bar.fill' : 'chart.bar'} tintColor={color} size={22} />
            ) : (
              <Feather name="bar-chart-2" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: t.tabs.journal,
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView name={focused ? 'book.fill' : 'book'} tintColor={color} size={22} />
            ) : (
              <Feather name="book-open" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: t.tabs.statistics,
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView name="chart.line.uptrend.xyaxis" tintColor={color} size={22} />
            ) : (
              <Feather name="trending-up" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: t.tabs.insights,
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView name={focused ? 'lightbulb.fill' : 'lightbulb'} tintColor={color} size={22} />
            ) : (
              <Feather name="zap" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t.tabs.profile,
          tabBarIcon: ({ color, focused }) =>
            isIOS ? (
              <SymbolView name={focused ? 'person.circle.fill' : 'person.circle'} tintColor={color} size={22} />
            ) : (
              <Feather name="user" size={22} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}

