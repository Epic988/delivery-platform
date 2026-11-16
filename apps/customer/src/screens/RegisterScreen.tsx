import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '@delivery/shared';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import type { RootStackParamList } from '../types';

const COPY = {
  en: {
    title: 'Create account',
    subtitle: 'Sign up with your phone number',
    fullNameLabel: 'Full name',
    phoneLabel: 'Phone (+249...)',
    phonePlaceholder: '+249912345678',
    passwordLabel: 'Password (6+ chars)',
    submit: 'Create account',
    login: 'Have account? Login',
    errNameEmpty: 'Enter your full name',
    errPhoneEmpty: 'Enter your phone number',
    errPasswordEmpty: 'Enter a password',
    errPasswordShort: 'Password must be at least 6 characters',
    errGeneric: 'Registration failed. Please try again.',
  },
  ar: {
    title: 'حساب جديد',
    subtitle: 'أنشئ حسابك برقم هاتفك',
    fullNameLabel: 'الاسم الكامل',
    phoneLabel: 'رقم الهاتف (+249...)',
    phonePlaceholder: '+249912345678',
    passwordLabel: 'كلمة المرور (6+ أحرف)',
    submit: 'إنشاء الحساب',
    login: 'لديك حساب؟ دخول',
    errNameEmpty: 'أدخل اسمك الكامل',
    errPhoneEmpty: 'أدخل رقم الهاتف',
    errPasswordEmpty: 'أدخل كلمة المرور',
    errPasswordShort: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
    errGeneric: 'فشل إنشاء الحساب. حاول مرة أخرى.',
  },
} as const;

export function RegisterScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { register, lang } = useAuth();
  const t = COPY[lang === 'ar' ? 'ar' : 'en'];

  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (loading) return;
    setErr(null);
    const name = fullName.trim();
    const ph = phone.trim();
    if (!name) return setErr(t.errNameEmpty);
    if (!ph) return setErr(t.errPhoneEmpty);
    if (!password) return setErr(t.errPasswordEmpty);
    if (password.length < 6) return setErr(t.errPasswordShort);

    setLoading(true);
    try {
      await register(ph, name, password);
    } catch (e: any) {
      setErr(e?.message ?? t.errGeneric);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md }]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => nav.goBack()} style={styles.backBtn} hitSlop={12}>
          <Ionicons
            name={lang === 'ar' ? 'chevron-forward' : 'chevron-back'}
            size={26}
            color={colors.text}
          />
        </Pressable>

        <View style={styles.hero}>
          <Text style={styles.title}>{t.title}</Text>
          <Text style={styles.subtitle}>{t.subtitle}</Text>
        </View>

        <View style={styles.card}>
          <Input
            label={t.fullNameLabel}
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            autoCorrect={false}
          />
          <View style={{ height: spacing.md }} />
          <Input
            label={t.phoneLabel}
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder={t.phonePlaceholder}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={{ height: spacing.md }} />
          <Input
            label={t.passwordLabel}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />

          {err ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{err}</Text>
            </View>
          ) : null}

          <View style={{ height: spacing.lg }} />
          <Button title={t.submit} onPress={submit} loading={loading} />
          <Button
            title={t.login}
            onPress={() => nav.goBack()}
            variant="secondary"
            style={{ marginTop: spacing.sm }}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  backBtn: { alignSelf: 'flex-start', padding: spacing.sm, marginBottom: spacing.sm },
  hero: { alignItems: 'center', marginBottom: spacing.xl },
  title: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.primary, textAlign: 'center' },
  subtitle: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs, textAlign: 'center' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  errorBanner: {
    marginTop: spacing.md,
    backgroundColor: colors.dangerBg,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  errorText: { color: colors.danger, fontSize: fontSize.sm, textAlign: 'center' },
});