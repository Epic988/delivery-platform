import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Address, colors, fontSize, radius, spacing } from '@delivery/shared';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import type { RootStackParamList } from '../types';

export function CheckoutScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { lang } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.addresses().then((r) => {
      setAddresses(r.data);
      const def = r.data.find((a) => a.isDefault) ?? r.data[0];
      if (def) setSelected(def.id);
    }).finally(() => setLoading(false));
  }, []);

  const submit = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const res = await api.checkout({ addressId: selected });
      Alert.alert(
        lang === 'ar' ? 'تم إنشاء الطلب' : 'Order created',
        res.orders.map((o) => o.orderNumber).join('\n'),
        [{ text: 'OK', onPress: () => nav.reset({ index: 0, routes: [{ name: 'Home' }] }) }]
      );
    } catch (e: any) { Alert.alert('Error', e?.message ?? ''); }
    finally { setSubmitting(false); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={styles.heading}>{lang === 'ar' ? 'اختر عنوان التوصيل' : 'Choose delivery address'}</Text>

      {addresses.length === 0 ? (
        <View>
          <Text style={styles.muted}>{lang === 'ar' ? 'لا توجد عناوين' : 'No addresses'}</Text>
          <Button title={lang === 'ar' ? '+ إضافة عنوان' : '+ Add address'} onPress={() => nav.navigate('Addresses')} />
        </View>
      ) : (
        addresses.map((a) => (
          <Pressable key={a.id} style={[styles.addrCard, selected === a.id && styles.addrSelected]} onPress={() => setSelected(a.id)}>
            <Text style={styles.addrLabel}>{a.label ?? '—'}</Text>
            <Text style={styles.addrText}>{a.addressText}</Text>
          </Pressable>
        ))
      )}

      <View style={styles.codBadge}>
        <Text style={styles.codTxt}>{lang === 'ar' ? 'الدفع عند الاستلام' : 'Cash on Delivery'}</Text>
      </View>

      <Button
        title={lang === 'ar' ? 'تأكيد الطلب' : 'Place order'}
        onPress={submit}
        loading={submitting}
        disabled={!selected}
        style={{ marginTop: spacing.lg }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundAlt },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heading: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginBottom: spacing.md },
  addrCard: { backgroundColor: colors.background, padding: spacing.lg, borderRadius: radius.md, marginBottom: spacing.sm, borderWidth: 2, borderColor: colors.border },
  addrSelected: { borderColor: colors.primary },
  addrLabel: { fontSize: fontSize.sm, color: colors.textMuted },
  addrText: { fontSize: fontSize.md, color: colors.text, marginTop: spacing.xs },
  codBadge: { marginTop: spacing.lg, backgroundColor: colors.primaryLight, padding: spacing.md, borderRadius: radius.md, alignItems: 'center' },
  codTxt: { color: colors.primary, fontWeight: '600' },
  muted: { color: colors.textMuted, marginBottom: spacing.md },
});
