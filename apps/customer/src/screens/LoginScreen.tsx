import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fontSize, spacing } from '@delivery/shared';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import type { RootStackParamList } from '../types';

export function LoginScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { login, lang } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setErr(null);
    setLoading(true);
    try {
      await login(phone, password);
    } catch (e: any) {
      setErr(e?.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{lang === 'ar' ? 'توصيل' : 'Delivery'}</Text>
        <Text style={styles.subtitle}>{lang === 'ar' ? 'تسجيل الدخول' : 'Login'}</Text>

        <Input label={lang === 'ar' ? 'رقم الهاتف (+249...)' : 'Phone (+249...)'} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+249912345678" />
        <Input label={lang === 'ar' ? 'كلمة المرور' : 'Password'} value={password} onChangeText={setPassword} secureTextEntry />

        {err ? <Text style={styles.err}>{err}</Text> : null}

        <Button title={lang === 'ar' ? 'تسجيل الدخول' : 'Login'} onPress={submit} loading={loading} />
        <Button title={lang === 'ar' ? 'حساب جديد؟ سجّل' : 'New? Register'} onPress={() => nav.navigate('Register')} variant="secondary" style={{ marginTop: spacing.sm }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingTop: spacing.xxl * 2 },
  title: { fontSize: 32, fontWeight: '700', color: colors.primary, textAlign: 'center', marginBottom: spacing.xs },
  subtitle: { fontSize: fontSize.lg, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.xl },
  err: { color: colors.danger, marginBottom: spacing.md, textAlign: 'center' },
});
