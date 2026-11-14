import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fontSize, spacing } from '@delivery/shared';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import type { RootStackParamList } from '../types';

export function RegisterScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { register, lang } = useAuth();
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setErr(null);
    setLoading(true);
    try {
      await register(phone, fullName, password);
    } catch (e: any) {
      setErr(e?.message ?? 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{lang === 'ar' ? 'حساب جديد' : 'Register'}</Text>

        <Input label={lang === 'ar' ? 'الاسم الكامل' : 'Full name'} value={fullName} onChangeText={setFullName} />
        <Input label={lang === 'ar' ? 'رقم الهاتف (+249...)' : 'Phone (+249...)'} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+249912345678" />
        <Input label={lang === 'ar' ? 'كلمة المرور (8+ أحرف)' : 'Password (8+ chars)'} value={password} onChangeText={setPassword} secureTextEntry />

        {err ? <Text style={styles.err}>{err}</Text> : null}

        <Button title={lang === 'ar' ? 'إنشاء الحساب' : 'Create account'} onPress={submit} loading={loading} />
        <Button title={lang === 'ar' ? 'لديك حساب؟ دخول' : 'Have account? Login'} onPress={() => nav.goBack()} variant="secondary" style={{ marginTop: spacing.sm }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingTop: spacing.xxl * 2 },
  title: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.primary, textAlign: 'center', marginBottom: spacing.xl },
  err: { color: colors.danger, marginBottom: spacing.md, textAlign: 'center' },
});
