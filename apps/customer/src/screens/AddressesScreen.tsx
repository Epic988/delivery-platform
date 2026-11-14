import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Address, colors, fontSize, radius, spacing } from '@delivery/shared';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

export function AddressesScreen() {
  const { lang } = useAuth();
  const [data, setData] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [text, setText] = useState('');
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.addresses().then((r) => setData(r.data)).finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const submit = async () => {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await api.createAddress({ addressText: text, label: label || undefined });
      setText(''); setLabel(''); setShowForm(false); load();
    } catch (e: any) { Alert.alert('Error', e?.message ?? ''); }
    finally { setSaving(false); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: colors.backgroundAlt, padding: spacing.lg }}>
      <FlatList
        data={data}
        keyExtractor={(a) => a.id}
        ListEmptyComponent={<Text style={styles.empty}>{lang === 'ar' ? 'لا توجد عناوين' : 'No addresses'}</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.label}>{item.label ?? '—'}</Text>
            <Text style={styles.addr}>{item.addressText}</Text>
          </View>
        )}
      />
      {showForm ? (
        <View style={{ marginTop: spacing.md }}>
          <Input label={lang === 'ar' ? 'العنوان' : 'Address'} value={text} onChangeText={setText} />
          <Input label={lang === 'ar' ? 'تسمية (اختياري)' : 'Label (optional)'} value={label} onChangeText={setLabel} />
          <Button title={lang === 'ar' ? 'حفظ' : 'Save'} onPress={submit} loading={saving} />
        </View>
      ) : (
        <Button title={lang === 'ar' ? '+ إضافة عنوان' : '+ Add address'} onPress={() => setShowForm(true)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.backgroundAlt },
  card: { backgroundColor: colors.background, padding: spacing.lg, borderRadius: radius.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  label: { fontSize: fontSize.sm, color: colors.textMuted, marginBottom: spacing.xs },
  addr: { fontSize: fontSize.md, color: colors.text },
  empty: { textAlign: 'center', color: colors.textMuted, marginVertical: spacing.xxl },
});
