import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { useSignIn, useAuth } from '@clerk/expo';
import { Link, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '@/context/LanguageContext';

const PRIMARY = '#9B8FF7';
const BG = '#0A0B12';
const CARD = '#12131F';
const BORDER = '#1E1F2E';
const MUTED = '#6B7280';
const TEXT = '#FFFFFF';

export default function SignInScreen() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  const loading = fetchStatus === 'fetching';

  const handleSignIn = async () => {
    const { error } = await signIn.password({ emailAddress: email, password });
    if (error) return;
    if (signIn.status === 'complete') {
      await signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) return;
          const url = decorateUrl('/');
          if (url.startsWith('http')) {
            // web fallback
          } else {
            router.replace('/(tabs)');
          }
        },
      });
    }
  };

  const handleVerify = async () => {
    await signIn.mfa.verifyEmailCode({ code: verificationCode });
    if (signIn.status === 'complete') {
      await signIn.finalize({
        navigate: ({ session }) => {
          if (session?.currentTask) return;
          router.replace('/(tabs)');
        },
      });
    }
  };

  if (isSignedIn) return null;

  // MFA verification step
  if (signIn.status === 'needs_client_trust') {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <View style={styles.card}>
          <View style={[styles.iconWrap, { backgroundColor: PRIMARY + '20' }]}>
            <Feather name="shield" size={28} color={PRIMARY} />
          </View>
          <Text style={[styles.title, isRTL && styles.rtl]}>{t.auth.verifyTitle}</Text>
          <Text style={[styles.subtitle, isRTL && styles.rtl]}>{t.auth.verifySubtitle}</Text>

          <Text style={[styles.label, isRTL && styles.rtl]}>{t.auth.verifyCode}</Text>
          <TextInput
            style={[styles.input, isRTL && styles.rtlInput]}
            value={verificationCode}
            onChangeText={setVerificationCode}
            placeholder={t.auth.verifyCodePlaceholder}
            placeholderTextColor={MUTED}
            keyboardType="numeric"
            textAlign={isRTL ? 'right' : 'left'}
          />
          {errors?.fields?.code && (
            <Text style={styles.error}>{errors.fields.code.message}</Text>
          )}
          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleVerify}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{t.auth.verify}</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => signIn.mfa.sendEmailCode()} style={styles.ghostBtn}>
            <Text style={styles.ghostBtnText}>{t.auth.resendCode}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => signIn.reset()} style={styles.ghostBtn}>
            <Text style={styles.ghostBtnText}>{t.auth.startOver}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo / Brand */}
        <LinearGradient colors={['#6B5CE7', '#9B8FF7']} style={styles.logoGradient}>
          <Feather name="trending-up" size={28} color="#fff" />
        </LinearGradient>
        <Text style={[styles.appName, isRTL && styles.rtl]}>Trading Journal</Text>

        <View style={styles.card}>
          <Text style={[styles.title, isRTL && styles.rtl]}>{t.auth.welcomeBack}</Text>
          <Text style={[styles.subtitle, isRTL && styles.rtl]}>{t.auth.welcomeSubtitle}</Text>

          {/* Error display */}
          {errors?.fields?.identifier && (
            <View style={styles.errorBox}>
              <Text style={styles.error}>{errors.fields.identifier.message}</Text>
            </View>
          )}

          <Text style={[styles.label, isRTL && styles.rtl]}>{t.auth.email}</Text>
          <TextInput
            style={[styles.input, isRTL && styles.rtlInput]}
            value={email}
            onChangeText={setEmail}
            placeholder={t.auth.emailPlaceholder}
            placeholderTextColor={MUTED}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            textAlign={isRTL ? 'right' : 'left'}
          />

          <Text style={[styles.label, isRTL && styles.rtl]}>{t.auth.password}</Text>
          <View style={styles.passwordWrap}>
            <TextInput
              style={[styles.input, styles.passwordInput, isRTL && styles.rtlInput]}
              value={password}
              onChangeText={setPassword}
              placeholder={t.auth.passwordPlaceholder}
              placeholderTextColor={MUTED}
              secureTextEntry={!showPassword}
              textAlign={isRTL ? 'right' : 'left'}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setShowPassword((v) => !v)}
            >
              <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color={MUTED} />
            </TouchableOpacity>
          </View>
          {errors?.fields?.password && (
            <Text style={styles.error}>{errors.fields.password.message}</Text>
          )}

          <TouchableOpacity
            style={[styles.btn, (!email || !password || loading) && styles.btnDisabled]}
            onPress={handleSignIn}
            disabled={!email || !password || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>{t.auth.signIn}</Text>
            )}
          </TouchableOpacity>

          <View style={[styles.linkRow, isRTL && styles.rtlRow]}>
            <Text style={styles.linkLabel}>{t.auth.noAccount} </Text>
            <Link href="/(auth)/sign-up" asChild>
              <TouchableOpacity>
                <Text style={styles.link}>{t.auth.signUp}</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>

        {/* Guest option */}
        <TouchableOpacity
          style={styles.guestBtn}
          onPress={() => router.replace('/(tabs)')}
          activeOpacity={0.7}
        >
          <Text style={styles.guestBtnText}>{t.auth.orContinueGuest}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  scroll: { alignItems: 'center', paddingHorizontal: 20 },
  logoGradient: {
    width: 64, height: 64, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  appName: { color: TEXT, fontSize: 22, fontWeight: '800', marginBottom: 28, letterSpacing: -0.5 },
  card: {
    width: '100%', backgroundColor: CARD, borderRadius: 20,
    borderWidth: 1, borderColor: BORDER, padding: 24, gap: 4,
  },
  iconWrap: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  title: { color: TEXT, fontSize: 22, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
  subtitle: { color: MUTED, fontSize: 14, lineHeight: 20, marginBottom: 16 },
  label: { color: MUTED, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 12, marginBottom: 6 },
  input: {
    backgroundColor: BG, borderWidth: 1.5, borderColor: BORDER,
    borderRadius: 12, padding: 14, color: TEXT, fontSize: 16,
  },
  passwordWrap: { position: 'relative' },
  passwordInput: { paddingRight: 46 },
  eyeBtn: { position: 'absolute', right: 14, top: 14 },
  btn: {
    backgroundColor: PRIMARY, borderRadius: 14, padding: 16,
    alignItems: 'center', marginTop: 20,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  ghostBtn: { alignItems: 'center', padding: 12 },
  ghostBtnText: { color: PRIMARY, fontSize: 14, fontWeight: '600' },
  linkRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 16 },
  linkLabel: { color: MUTED, fontSize: 14 },
  link: { color: PRIMARY, fontSize: 14, fontWeight: '700' },
  errorBox: { backgroundColor: '#F6465D20', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#F6465D40' },
  error: { color: '#F6465D', fontSize: 13 },
  guestBtn: { marginTop: 20, padding: 12 },
  guestBtnText: { color: MUTED, fontSize: 14 },
  rtl: { textAlign: 'right' },
  rtlInput: { textAlign: 'right' },
  rtlRow: { flexDirection: 'row-reverse' },
});
