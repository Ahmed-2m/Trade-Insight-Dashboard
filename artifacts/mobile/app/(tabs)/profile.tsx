import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useLanguage } from '@/context/LanguageContext';
import type { Language } from '@/i18n/translations';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { t, language, setLanguage, isRTL } = useLanguage();
  const [user, setUser] = useState<User | null>(null);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Platform.OS === 'web' ? 34 : 0;

  useEffect(() => {
    // جلب المستخدم الحالي
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    // الاستماع لحالة تسجيل الدخول / الخروج
    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = () => {
    Alert.alert(
      isRTL ? 'تأكيد تسجيل الخروج' : 'Confirm Sign Out',
      isRTL ? 'هل أنت متأكد أنك تريد تسجيل الخروج؟' : 'Are you sure you want to sign out?',
      [
        { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: t.profile.signOut,
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.auth.signOut();
            if (error) {
              Alert.alert('خطأ', error.message);
            }
          },
        },
      ],
    );
  };

  const languages: { code: Language; label: string; nativeLabel: string }[] = [
    { code: 'ar', label: t.profile.languages.ar, nativeLabel: 'العربية' },
    { code: 'en', label: t.profile.languages.en, nativeLabel: 'English' },
  ];

  const userEmail = user?.email ?? '';
  const firstLetter = userEmail ? userEmail[0].toUpperCase() : '?';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingTop: topInset + 8,
        paddingBottom: bottomInset + 100,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, isRTL && styles.headerRTL]}>
        <View style={isRTL ? { alignItems: 'flex-end' } : {}}>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Trading Journal
          </Text>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            {t.profile.title}
          </Text>
        </View>
      </View>

      {/* Account Section */}
      <View style={[styles.section, { marginTop: 20 }]}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }, isRTL && styles.rtl]}>
          {t.profile.account}
        </Text>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {user ? (
            <>
              {/* Avatar */}
              <View style={[styles.userRow, isRTL && styles.rowReverse]}>
                <View style={[styles.avatar, { backgroundColor: colors.primary + '30' }]}>
                  <Text style={[styles.avatarText, { color: colors.primary }]}>
                    {firstLetter}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.userLabel, { color: colors.mutedForeground }, isRTL && styles.rtl]}>
                    {t.profile.signedInAs}
                  </Text>
                  <Text style={[styles.userEmail, { color: colors.foreground }, isRTL && styles.rtl]} numberOfLines={1}>
                    {userEmail}
                  </Text>
                </View>
                <View style={[styles.syncBadge, { backgroundColor: '#0ECB8120', borderColor: '#0ECB8140' }]}>
                  <Feather name="cloud" size={12} color="#0ECB81" />
                  <Text style={styles.syncBadgeText}>
                    {isRTL ? 'مزامنة' : 'Synced'}
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* Cloud sync info */}
              <View style={[styles.infoRow, isRTL && styles.rowReverse]}>
                <View style={[styles.infoIconWrap, { backgroundColor: '#0ECB8115' }]}>
                  <Feather name="cloud" size={16} color="#0ECB81" />
                </View>
                <Text style={[styles.infoText, { color: colors.foreground }, isRTL && styles.rtl]}>
                  {t.profile.dataSynced}
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* Sign out */}
              <TouchableOpacity
                style={[styles.actionRow, isRTL && styles.rowReverse]}
                onPress={handleSignOut}
                activeOpacity={0.7}
              >
                <View style={[styles.infoIconWrap, { backgroundColor: '#F6465D15' }]}>
                  <Feather name="log-out" size={16} color="#F6465D" />
                </View>
                <Text style={[styles.actionText, { color: '#F6465D' }, isRTL && styles.rtl]}>
                  {t.profile.signOut}
                </Text>
                {!isRTL && <Feather name="chevron-right" size={16} color="#F6465D" style={{ marginLeft: 'auto' }} />}
                {isRTL && <Feather name="chevron-left" size={16} color="#F6465D" style={{ marginRight: 'auto' }} />}
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Not signed in */}
              <View style={[styles.userRow, isRTL && styles.rowReverse]}>
                <View style={[styles.avatar, { backgroundColor: colors.muted }]}>
                  <Feather name="user" size={20} color={colors.mutedForeground} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.userLabel, { color: colors.foreground }, isRTL && styles.rtl]}>
                    {t.profile.notSignedIn}
                  </Text>
                  <Text style={[styles.userEmail, { color: colors.mutedForeground }, isRTL && styles.rtl]}>
                    {t.profile.guestMode}
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={[styles.infoRow, isRTL && styles.rowReverse]}>
                <View style={[styles.infoIconWrap, { backgroundColor: colors.primary + '15' }]}>
                  <Feather name="info" size={16} color={colors.primary} />
                </View>
                <Text style={[styles.infoText, { color: colors.mutedForeground }, isRTL && styles.rtl, { flex: 1 }]}>
                  {t.profile.guestModeDesc}
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <TouchableOpacity
                style={[styles.signInBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/(auth)/sign-in')}
                activeOpacity={0.8}
              >
                <Feather name="log-in" size={16} color="#fff" />
                <Text style={styles.signInBtnText}>{t.profile.signInBtn}</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Language Section */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }, isRTL && styles.rtl]}>
          {t.profile.language}
        </Text>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {languages.map((lang, i) => {
            const isActive = language === lang.code;
            return (
              <React.Fragment key={lang.code}>
                {i > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                <TouchableOpacity
                  style={[styles.langRow, isRTL && styles.rowReverse]}
                  onPress={() => setLanguage(lang.code)}
                  activeOpacity={0.7}
                >
                  <View style={styles.langInfo}>
                    <Text style={[styles.langName, { color: colors.foreground }, isRTL && styles.rtl]}>
                      {lang.nativeLabel}
                    </Text>
                    <Text style={[styles.langSub, { color: colors.mutedForeground }, isRTL && styles.rtl]}>
                      {lang.label}
                    </Text>
                  </View>
                  {isActive && (
                    <View style={[styles.checkWrap, { backgroundColor: colors.primary }]}>
                      <Feather name="check" size={14} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              </React.Fragment>
            );
          })}
        </View>
        <Text style={[styles.sectionHint, { color: colors.mutedForeground }, isRTL && styles.rtl]}>
          {isRTL
            ? 'تأثير اللغة يكتمل عند إعادة تشغيل التطبيق'
            : 'Full RTL layout takes effect after restarting the app'}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 4 },
  headerRTL: { flexDirection: 'row-reverse' },
  headerSub: { fontSize: 12, marginBottom: 2 },
  headerTitle: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  section: { paddingHorizontal: 16, marginTop: 20, gap: 8 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', textTransform: 'uppercase',
    letterSpacing: 0.8, marginBottom: 6,
  },
  sectionHint: { fontSize: 12, lineHeight: 17, marginTop: 4 },
  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  divider: { height: 1, marginHorizontal: 16 },
  userRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  rowReverse: { flexDirection: 'row-reverse' },
  avatar: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '800' },
  userLabel: { fontSize: 11, marginBottom: 2 },
  userEmail: { fontSize: 14, fontWeight: '600' },
  syncBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 1,
  },
  syncBadgeText: { color: '#0ECB81', fontSize: 11, fontWeight: '600' },
  infoRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  infoIconWrap: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  infoText: { fontSize: 14, flex: 1 },
  actionRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  actionText: { fontSize: 15, fontWeight: '600' },
  signInBtn: {
    margin: 12, borderRadius: 12, padding: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  signInBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  langRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  langInfo: { flex: 1 },
  langName: { fontSize: 16, fontWeight: '700' },
  langSub: { fontSize: 12, marginTop: 2 },
  checkWrap: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rtl: { textAlign: 'right' },
});

