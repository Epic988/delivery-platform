import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { CourierOrder, ShoppingOrder, colors, fontSize, radius, spacing, statusLabel } from '@delivery/shared';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
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
        const r1 = sh.data.map((o: ShoppingOrder): Row => ({ kind: 'SHOPPING', id: o.id, orderNumber: o.orderNumber, status: o.status, createdAt: o.createdAt, label: o.store ? (lang === 'ar' ? o.store.nameAr : o.store.nameEn ?? o.store.nameAr) : '—' }));
        const r2 = co.data.map((o: CourierOrder): Row => ({ kind: 'COURIER', id: o.id, orderNumber: o.orderNumber, status: o.status, createdAt: o.createdAt, label: o.destinationAddressText }));
        setRows([...r1, ...r2].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      }).finally(() => setLoading(false));
  }, [lang]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.lg }}
      data={rows}
      keyExtractor={(r) => `${r.kind}-${r.id}`}
      ListEmptyComponent={<Text style={styles.empty}>{lang === 'ar' ? 'لا توجد طلبات' : 'No orders yet'}</Text>}
      renderItem={({ item }) => (
        <Pressable style={styles.card} onPress={() => nav.navigate('OrderDetails', { type: item.kind, id: item.id })}>
          <View style={styles.cardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.iconBg}><Ionicons name={item.kind === 'SHOPPING' ? 'cart' : 'cube'} size={20} color={colors.primary} /></View>
              <Text style={styles.num}>{item.orderNumber}</Text>
            </View>
            <StatusBadge status={item.status} label={statusLabel(lang, item.status)} />
          </View>
          <Text style={styles.label}>{item.label}</Text>
          <View style={styles.cardFooter}>
             <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
             <Ionicons name="chevron-back" size={16} color={colors.textMuted} />
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  card: { backgroundColor: colors.surface, padding: spacing.lg, borderRadius: radius.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  iconBg: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  num: { fontSize: fontSize.md, fontWeight: '800', color: colors.text },
  label: { fontSize: fontSize.sm, color: colors.textMuted, marginBottom: spacing.md },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  date: { fontSize: fontSize.xs, color: colors.textMuted },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xxl, fontSize: fontSize.md },
});
