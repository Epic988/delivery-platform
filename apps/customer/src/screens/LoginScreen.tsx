import React, { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fontSize, radius, spacing } from '@delivery/shared';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import type { RootStackParamList } from '../types';

const COPY = {
  en: {
    brand: 'Delivery',
    title: 'Login',
    subtitle: 'Sign in with your phone number',
    phoneLabel: 'Phone (+249...)',
    phonePlaceholder: '+249912345678',
    passwordLabel: 'Password',
    submit: 'Login',
    register: 'New here? Create account',
    errPhoneEmpty: 'Enter your phone number',
    errPasswordEmpty: 'Enter your password',
    errPasswordShort: 'Password must be at least 6 characters',
    errGeneric: 'Login failed. Please try again.',
  },
  ar: {
    brand: 'توصيل',
    title: 'تسجيل الدخول',
    subtitle: 'سجّل الدخول برقم هاتفك',
    phoneLabel: 'رقم الهاتف (+249...)',
    phonePlaceholder: '+249912345678',
    passwordLabel: 'كلمة المرور',
    submit: 'تسجيل الدخول',
    register: 'حساب جديد؟ سجّل',
    errPhoneEmpty: 'أدخل رقم الهاتف',
    errPasswordEmpty: 'أدخل كلمة المرور',
    errPasswordShort: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
    errGeneric: 'فشل تسجيل الدخول. حاول مرة أخرى.',
  },
} as const;

export function LoginScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { login, lang } = useAuth();
  const t = COPY[lang === 'ar' ? 'ar' : 'en'];

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const phoneTrimmed = phone.trim();
  const canSubmit = useMemo(
    () => phoneTrimmed.length > 0 && password.length > 0 && !loading,
    [phoneTrimmed, password, loading],
  );

  const submit = async () => {
    if (loading) return;
    setErr(null);
    if (!phoneTrimmed) return setErr(t.errPhoneEmpty);
    if (!password) return setErr(t.errPasswordEmpty);
    if (password.length < 6) return setErr(t.errPasswordShort);

    setLoading(true);
    try {
      await login(phoneTrimmed, password);
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
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xxl }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.hero}>
          <Text style={styles.brand}>{t.brand}</Text>
          <Text style={styles.title}>{t.title}</Text>
          <Text style={styles.subtitle}>{t.subtitle}</Text>
        </View>

        <View style={styles.card}>
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
            title={t.register}
            onPress={() => nav.navigate('Register')}
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
  hero: { alignItems: 'center', marginBottom: spacing.xl },
  brand: { fontSize: 36, fontWeight: '800', color: colors.primary, letterSpacing: 0.5 },
  title: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text, marginTop: spacing.sm },
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