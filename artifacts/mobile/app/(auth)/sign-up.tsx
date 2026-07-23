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

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isRTL } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSignUpPress = async () => {
    if (!email || !password) {
      Alert.alert(
        isRTL ? 'تنبيه' : 'Warning',
        isRTL ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور' : 'Please enter email and password'
      );
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      Alert.alert(isRTL ? 'فشل إنشاء الحساب' : 'Sign Up Failed', error.message);
    } else if (data.user && data.session === null) {
      // رسالة طلب تأكيد البريد الأنيقة
      Alert.alert(
        isRTL ? '✉️ تم إرسال رابط التأكيد' : '✉️ Confirmation Email Sent',
        isRTL
          ? `تم إرسال رابط تفعيل الحساب إلى ${email}.\nيرجى فتح بريدك الإلكتروني وتأكيد الحساب لتتمكن من تسجيل الدخول.`
          : `A confirmation link has been sent to ${email}.\nPlease check your email to activate your account before signing in.`,
        [
          {
            text: isRTL ? 'تسجيل الدخول' : 'Sign In Now',
            onPress: () => router.replace('/(auth)/sign-in'),
          },
        ]
      );
    } else {
      Alert.alert(
        isRTL ? 'نجاح' : 'Success',
        isRTL ? 'تم إنشاء الحساب بنجاح!' : 'Account created successfully!'
      );
      router.replace('/(tabs)');
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
          {isRTL ? 'إنشاء حساب جديد' : 'Create Account'}
        </Text>
        <Text style={styles.subtitle}>
          {isRTL ? 'سجل الآن للحفاظ على بيانات صفقاتك سحابياً' : 'Sign up to back up your trades to the cloud'}
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

        {/* زر إنشاء الحساب */}
        <TouchableOpacity style={styles.button} onPress={onSignUpPress} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>
              {isRTL ? 'إنشاء حساب' : 'Sign Up'}
            </Text>
          )}
        </TouchableOpacity>

        <View style={[styles.footer, isRTL ? styles.rowReverse : styles.row]}>
          <Text style={styles.footerText}>
            {isRTL ? 'لديك حساب بالفعل؟ ' : 'Already have an account? '}
          </Text>
          <Link href="/(auth)/sign-in" asChild>
            <TouchableOpacity>
              <Text style={styles.linkText}>
                {isRTL ? 'تسجيل الدخول' : 'Sign In'}
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
