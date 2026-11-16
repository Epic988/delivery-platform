import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, radius, spacing } from '@delivery/shared';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import type { RootStackParamList } from '../types';

type Route = RouteProp<RootStackParamList, 'Proof'>;

const COPY = {
  en: {
    title: 'Proof of delivery',
    subtitle: 'Optional: record who received the package and any notes',
    recipientName: 'Recipient name',
    notes: 'Notes',
    submit: 'Save proof',
    success: 'Proof saved successfully',
    backHome: 'Back',
    errSubmit: 'Could not save proof',
  },
  ar: {
    title: 'إثبات التسليم',
    subtitle: 'اختياري: سجّل اسم مستلم الطرد وأي ملاحظات',
    recipientName: 'اسم المستلم',
    notes: 'ملاحظات',
    submit: 'حفظ الإثبات',
    success: 'تم حفظ الإثبات بنجاح',
    backHome: 'رجوع',
    errSubmit: 'تعذّر حفظ الإثبات',
  },
} as const;

export function ProofScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Route>();
  const { lang } = useAuth();
  const t = COPY[lang === 'ar' ? 'ar' : 'en'];

  const [recipientName, setRecipientName] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const submit = async () => {
    if (busy) return;
    setErr(null);
    setBusy(true);
    try {
      await api.submitProof(route.params.id, {
        recipientName: recipientName.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setSuccess(true);
    } catch (e: any) {
      setErr(e?.message ?? t.errSubmit);
    } finally {
      setBusy(false);
    }
  };

  if (success) {
    return (
      <View style={styles.center}>
        <Ionicons name="checkmark-circle" size={64} color={colors.success} />
        <Text style={styles.successTitle}>{t.success}</Text>
        <Button title={t.backHome} onPress={() => nav.goBack()} style={{ marginTop: spacing.lg }} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
      <Text style={styles.title}>{t.title}</Text>
      <Text style={styles.subtitle}>{t.subtitle}</Text>

      <View style={{ height: spacing.lg }} />
      <Input label={t.recipientName} value={recipientName} onChangeText={setRecipientName} />
      <View style={{ height: spacing.md }} />
      <Input label={t.notes} value={notes} onChangeText={setNotes} multiline />

      {err ? (
        <View style={styles.errBanner}>
          <Ionicons name="alert-circle" size={18} color={colors.danger} />
          <Text style={styles.errTxt}>{err}</Text>
        </View>
      ) : null}

      <View style={{ height: spacing.lg }} />
      <Button title={t.submit} onPress={submit} loading={busy} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, padding: spacing.xl },
  title: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs },
  successTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginTop: spacing.md, textAlign: 'center' },
  errBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.dangerBg, padding: spacing.md, borderRadius: radius.md, marginTop: spacing.md },
  errTxt: { color: colors.danger, fontWeight: '600', flex: 1, fontSize: fontSize.sm },
});