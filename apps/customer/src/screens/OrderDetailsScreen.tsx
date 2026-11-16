import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { CourierOrder, ShoppingOrder, colors, fontSize, spacing, statusLabel } from '@delivery/shared';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../types';

type Route = RouteProp<RootStackParamList, 'OrderDetails'>;

export function OrderDetailsScreen() {
  const [refreshKey, setRefreshKey] = useState(0);
  const { params } = useRoute<Route>();
  const { lang } = useAuth();
  const [order, setOrder] = useState<ShoppingOrder | CourierOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const call = params.type === 'SHOPPING' ? api.shoppingOrder(params.id) : api.courierOrder(params.id);
    call.then((r) => setOrder(r.order)).finally(() => setLoading(false));
  }, [params.type, params.id, refreshKey]);

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  if (!order) return <View style={styles.center}><Text>Not found</Text></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
        <Text style={styles.num}>{order.orderNumber}</Text>
        <Pressable onPress={() => setRefreshKey(k => k + 1)} style={{backgroundColor: colors.primaryLight, padding: 8, borderRadius: 8}}>
          <Text style={{color: colors.primary, fontWeight: 'bold'}}>تحديث الحالة</Text>
        </Pressable>
      </View>
      <Text style={styles.status}>{statusLabel(lang, order.status)}</Text>

      {'items' in order && order.items ? (
        <View style={{ marginTop: spacing.lg }}>
          <Text style={styles.h}>{lang === 'ar' ? 'المنتجات' : 'Items'}</Text>
          {order.items.map((it) => (
            <View key={it.id} style={styles.row}>
              <Text style={{ flex: 1 }}>{it.product ? (lang === 'ar' ? it.product.nameAr : it.product.nameEn ?? it.product.nameAr) : it.productId}</Text>
              <Text>×{it.quantity}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={{ marginTop: spacing.lg }}>
        {'events' in order && order.events ? order.events.map((ev) => (
          <View key={ev.id} style={styles.eventRow}>
            <Text style={styles.evStatus}>{statusLabel(lang, ev.status)}</Text>
            <Text style={styles.evTime}>{new Date(ev.createdAt).toLocaleString()}</Text>
          </View>
        )) : null}
      </View>

      {'total' in order ? (
        <View style={styles.totals}>
          <Text style={styles.totalLabel}>{lang === 'ar' ? 'الإجمالي' : 'Total'}: {Number(order.total).toFixed(0)} SDG</Text>
        </View>
      ) : 'quotedPrice' in order && order.quotedPrice ? (
        <View style={styles.totals}>
          <Text style={styles.totalLabel}>{lang === 'ar' ? 'السعر' : 'Price'}: {Number(order.quotedPrice).toFixed(0)} SDG</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundAlt },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  num: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  status: { fontSize: fontSize.md, color: colors.primary, fontWeight: '600', marginTop: spacing.xs },
  h: { fontSize: fontSize.lg, fontWeight: '700', marginBottom: spacing.sm, color: colors.text },
  row: { flexDirection: 'row', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  eventRow: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  evStatus: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  evTime: { fontSize: fontSize.xs, color: colors.textMuted },
  totals: { marginTop: spacing.lg, padding: spacing.lg, backgroundColor: colors.primaryLight, borderRadius: 10 },
  totalLabel: { fontSize: fontSize.lg, fontWeight: '700', color: colors.primary },
});

