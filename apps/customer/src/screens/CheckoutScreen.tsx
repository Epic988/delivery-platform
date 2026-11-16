import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Address, colors, fontSize, radius, spacing } from '@delivery/shared';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
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
      Alert.alert(lang === 'ar' ? 'تم الطلب' : 'Order placed', `تم إنشاء ${res.orders.length} طلب بنجاح`, [{ text: 'OK', onPress: () => nav.reset({ index: 0, routes: [{ name: 'Home' }] }) }]);
    } catch (e: any) { Alert.alert('Error', e?.message ?? ''); }
    finally { setSubmitting(false); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={styles.heading}>{lang === 'ar' ? 'عنوان التوصيل' : 'Delivery Address'}</Text>
        
        {addresses.length === 0 ? (
          <View style={styles.noAddressCard}>
            <Ionicons name="location-outline" size={40} color={colors.textMuted} />
            <Text style={styles.noAddressTxt}>{lang === 'ar' ? 'لا توجد عناوين محفوظة' : 'No saved addresses'}</Text>
            <Pressable onPress={() => nav.navigate('Addresses')} style={styles.addAddressBtn}>
              <Text style={styles.addAddressTxt}>{lang === 'ar' ? 'إضافة عنوان' : 'Add Address'}</Text>
            </Pressable>
          </View>
        ) : (
          addresses.map((a) => (
            <Pressable key={a.id} style={[styles.addrCard, selected === a.id && styles.addrSelected]} onPress={() => setSelected(a.id)}>
              <View style={styles.radio}>{selected === a.id && <View style={styles.radioInner} />}</View>
              <View style={{ flex: 1 }}>
                <Text style={styles.addrLabel}>{a.label ?? (lang === 'ar' ? 'المنزل' : 'Home')}</Text>
                <Text style={styles.addrText}>{a.addressText}</Text>
              </View>
            </Pressable>
          ))
        )}

        <Text style={styles.heading}>{lang === 'ar' ? 'طريقة الدفع' : 'Payment Method'}</Text>
        <View style={styles.paymentCard}>
          <Ionicons name="cash-outline" size={24} color={colors.primary} />
          <Text style={styles.paymentTxt}>{lang === 'ar' ? 'الدفع عند الاستلام (كاش)' : 'Cash on Delivery'}</Text>
          <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Pressable style={[styles.payBtn, !selected && { opacity: 0.5 }]} onPress={submit} disabled={!selected || submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.payBtnTxt}>{lang === 'ar' ? 'تأكيد الطلب' : 'Place Order'}</Text>}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  heading: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text, marginBottom: spacing.md, marginTop: spacing.sm },
  noAddressCard: { backgroundColor: colors.surface, padding: spacing.xl, borderRadius: radius.lg, alignItems: 'center', borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
  noAddressTxt: { fontSize: fontSize.md, color: colors.textMuted, marginVertical: spacing.md },
  addAddressBtn: { backgroundColor: colors.primaryLight, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.pill },
  addAddressTxt: { color: colors.primary, fontWeight: '700' },
  addrCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: spacing.lg, borderRadius: radius.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  addrSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginLeft: spacing.md },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },
  addrLabel: { fontSize: fontSize.md, fontWeight: '800', color: colors.text },
  addrText: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 4 },
  paymentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.primary },
  paymentTxt: { flex: 1, fontSize: fontSize.md, fontWeight: '700', color: colors.text, marginLeft: spacing.md },
  bottomBar: { padding: spacing.lg, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  payBtn: { backgroundColor: colors.primary, padding: spacing.lg, borderRadius: radius.md, alignItems: 'center' },
  payBtnTxt: { color: '#fff', fontWeight: '800', fontSize: fontSize.md },
});
