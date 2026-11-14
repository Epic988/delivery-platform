import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fontSize, spacing } from '@delivery/shared';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import type { RootStackParamList } from '../types';

type Route = RouteProp<RootStackParamList, 'Proof'>;

export function ProofScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Route>();
  const { lang } = useAuth();
  const [recipientName, setRecipientName] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await api.submitProof(route.params.id, { recipientName: recipientName || undefined, notes: notes || undefined });
      Alert.alert(lang === 'ar' ? 'تم' : 'Done', '', [{ text: 'OK', onPress: () => nav.goBack() }]);
    } catch (e: any) { Alert.alert('Error', e?.message ?? ''); }
    finally { setBusy(false); }
  };

  return (
    <ScrollView style={styles.s} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={styles.h}>{lang === 'ar' ? 'إثبات التسليم' : 'Proof of delivery'}</Text>
      <Input label={lang === 'ar' ? 'اسم المستلم' : 'Recipient name'} value={recipientName} onChangeText={setRecipientName} />
      <Input label={lang === 'ar' ? 'ملاحظات' : 'Notes'} value={notes} onChangeText={setNotes} multiline />
      <Button title={lang === 'ar' ? 'حفظ' : 'Submit'} onPress={submit} loading={busy} />
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  s: { flex: 1, backgroundColor: colors.backgroundAlt },
  h: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text, marginBottom: spacing.lg },
});
