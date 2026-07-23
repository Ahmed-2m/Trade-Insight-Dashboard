import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/context/LanguageContext';

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isRTL } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // استخراج الاسم قبل علامة @ لاستخدامه في الترحيب
  const getUserName = (emailStr: string) => {
    if (!emailStr) return '';
    const namePart = emailStr.split('@')[0];
    return namePart.charAt(0).toUpperCase() + namePart.slice(1);
  };

  const onSignInPress = async () => {
    if (!email || !password) {
      Alert.alert(
        isRTL ? 'تنبيه' : 'Warning',
        isRTL ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور' : 'Please enter email and password'
      );
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      const isUnconfirmed = error.message.toLowerCase().includes('email not confirmed');
      Alert.alert(
        isRTL ? 'فشل تسجيل الدخول' : 'Sign In Failed',
        isUnconfirmed
          ? (isRTL ? 'لم يتم تأكيد البريد الإلكتروني بعد. يرجى مراجعة صندوق البريد الخاص بك لتفعيل الحساب.' : 'Email not confirmed yet. Please check your inbox.')
          : error.message
      );
    } else if (data.user) {
      const userName = getUserName(data.user.email || email);
      
      // تنبيه ترحيبي أنيق بعد تسجيل الدخول الناجح
      Alert.alert(
        isRTL ? `مرحباً بك 👋 ${userName}` : `Welcome back 👋 ${userName}`,
        isRTL ? 'تم تسجيل دخولك بنجاح. تداول موفق! 📈' : 'You have signed in successfully. Happy trading! 📈',
        [
          {
            text: isRTL ? 'الانتقال للرئيسية' : 'Go to Dashboard',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }
        ]}
      >
        <Text style={styles.title}>
          {isRTL ? 'مرحباً بك مجدداً' : 'Welcome Back'}
        </Text>
        <Text style={styles.subtitle}>
          {isRTL ? 'سجل دخولك لمتابعة صفقاتك وحساباتك' : 'Sign in to monitor your trades and accounts'}
        </Text>

        {/* البريد الإلكتروني */}
        <View style={[styles.inputContainer, isRTL && styles.rowReverse]}>
          <Feather name="mail" size={20} color="#94A3B8" style={styles.icon} />
          <TextInput
            style={[styles.input, isRTL && styles.rtlText]}
            placeholder={isRTL ? 'البريد الإلكتروني' : 'Email Address'}
            placeholderTextColor="#64748B"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        {/* كلمة المرور مع ميزة إظهار/إخفاء */}
        <View style={[styles.inputContainer, isRTL && styles.rowReverse]}>
          <Feather name="lock" size={20} color="#94A3B8" style={styles.icon} />
          <TextInput
            style={[styles.input, isRTL && styles.rtlText]}
            placeholder={isRTL ? 'كلمة المرور' : 'Password'}
            placeholderTextColor="#64748B"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeBtn}
            activeOpacity={0.7}
          >
            <Feather
              name={showPassword ? 'eye-off' : 'eye'}
              size={18}
              color="#94A3B8"
            />
          </TouchableOpacity>
        </View>

        {/* زر تسجيل الدخول */}
        <TouchableOpacity style={styles.button} onPress={onSignInPress} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>
              {isRTL ? 'تسجيل الدخول' : 'Sign In'}
            </Text>
          )}
        </TouchableOpacity>

        <View style={[styles.footer, isRTL ? styles.rowReverse : styles.row]}>
          <Text style={styles.footerText}>
            {isRTL ? 'ليس لديك حساب؟ ' : "Don't have an account? "}
          </Text>
          <Link href="/(auth)/sign-up" asChild>
            <TouchableOpacity>
              <Text style={styles.linkText}>
                {isRTL ? 'إنشاء حساب جديد' : 'Create new account'}
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 24, justifyContent: 'center', backgroundColor: '#0F172A' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#F8FAFC', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#94A3B8', textAlign: 'center', marginBottom: 32 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', borderRadius: 12, paddingHorizontal: 16, marginBottom: 16, height: 56 },
  icon: { marginHorizontal: 4 },
  input: { flex: 1, color: '#F8FAFC', fontSize: 16, paddingHorizontal: 8 },
  rtlText: { textAlign: 'right' },
  eyeBtn: { padding: 6 },
  button: { backgroundColor: '#6366F1', height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 12 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  footer: { justifyContent: 'center', marginTop: 24 },
  row: { flexDirection: 'row' },
  rowReverse: { flexDirection: 'row-reverse' },
  footerText: { color: '#94A3B8', fontSize: 14 },
  linkText: { color: '#818CF8', fontSize: 14, fontWeight: '600' },
});
