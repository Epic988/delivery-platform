import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { colors, fontSize, spacing } from '@delivery/shared';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

export function LoginScreen() {
  const { login, lang } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setErr(null); setLoading(true);
    try { await login(phone, password); }
    catch (e: any) { setErr(e?.message ?? 'Login failed'); }
    finally { setLoading(false); }
  };

  return (
    <KeyboardAvoidingView style={styles.c} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{lang === 'ar' ? 'توصيل — السائق' : 'Delivery — Driver'}</Text>
        <Text style={styles.sub}>{lang === 'ar' ? 'تسجيل الدخول' : 'Login'}</Text>
        <Input label={lang === 'ar' ? 'رقم الهاتف (+249...)' : 'Phone (+249...)'} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+249912345678" />
        <Input label={lang === 'ar' ? 'كلمة المرور' : 'Password'} value={password} onChangeText={setPassword} secureTextEntry />
        {err ? <Text style={styles.err}>{err}</Text> : null}
        <Button title={lang === 'ar' ? 'تسجيل الدخول' : 'Login'} onPress={submit} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingTop: 120 },
  title: { fontSize: 28, fontWeight: '700', color: colors.primary, textAlign: 'center', marginBottom: spacing.xs },
  sub: { fontSize: fontSize.lg, color: colors.textMuted, textAlign: 'center', marginBottom: spacing.xl },
  err: { color: colors.danger, marginBottom: spacing.md, textAlign: 'center' },
});
