import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CourierOrder, ShoppingOrder, colors, fontSize, radius, spacing, statusLabel } from '@delivery/shared';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../types';

type Row = { kind: 'SHOPPING' | 'COURIER'; id: string; orderNumber: string; status: string; createdAt: string; label: string };

export function OrdersScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { lang } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([api.shoppingOrders({ pageSize: 50 }), api.courierOrders({ pageSize: 50 })])
      .then(([sh, co]) => {
        const r1 = sh.data.map((o: ShoppingOrder): Row => ({
          kind: 'SHOPPING', id: o.id, orderNumber: o.orderNumber, status: o.status, createdAt: o.createdAt,
          label: o.store ? (lang === 'ar' ? o.store.nameAr : o.store.nameEn ?? o.store.nameAr) : '—',
        }));
        const r2 = co.data.map((o: CourierOrder): Row => ({
          kind: 'COURIER', id: o.id, orderNumber: o.orderNumber, status: o.status, createdAt: o.createdAt,
          label: o.destinationAddressText,
        }));
        setRows([...r1, ...r2].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      })
      .finally(() => setLoading(false));
  }, [lang]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;

  return (
    <FlatList
      style={{ backgroundColor: colors.backgroundAlt }}
      contentContainerStyle={{ padding: spacing.lg }}
      data={rows}
      keyExtractor={(r) => `${r.kind}-${r.id}`}
      ListEmptyComponent={<Text style={styles.empty}>{lang === 'ar' ? 'لا توجد طلبات' : 'No orders'}</Text>}
      renderItem={({ item }) => (
        <Pressable style={styles.card} onPress={() => nav.navigate('OrderDetails', { type: item.kind, id: item.id })}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={styles.num}>{item.orderNumber}</Text>
            <Text style={styles.kind}>{item.kind === 'SHOPPING' ? (lang === 'ar' ? 'تسوق' : 'Shop') : (lang === 'ar' ? 'توصيل' : 'Courier')}</Text>
          </View>
          <Text style={styles.label}>{item.label}</Text>
          <Text style={styles.status}>{statusLabel(lang, item.status)}</Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.backgroundAlt },
  card: { backgroundColor: colors.background, padding: spacing.lg, borderRadius: radius.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  num: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  kind: { fontSize: fontSize.sm, color: colors.primary, fontWeight: '600' },
  label: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs },
  status: { fontSize: fontSize.sm, marginTop: spacing.xs, color: colors.warning, fontWeight: '600' },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xxl },
});
