import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { CourierOrder, ShoppingOrder, colors, fontSize, radius, spacing, statusLabel } from '@delivery/shared';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import type { RootStackParamList } from '../types';

type Route = RouteProp<RootStackParamList, 'OrderDetails'>;

export function OrderDetailsScreen() {
  const { params } = useRoute<Route>();
  const { lang } = useAuth();
  const [order, setOrder] = useState<ShoppingOrder | CourierOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const call = params.type === 'SHOPPING' ? api.shoppingOrder(params.id) : api.courierOrder(params.id);
    call.then((r) => setOrder(r.order)).finally(() => setLoading(false));
  }, [params.type, params.id]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  if (!order) return <View style={styles.center}><Text>Not found</Text></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <View style={styles.headerCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.num}>{order.orderNumber}</Text>
          <StatusBadge status={order.status} label={statusLabel(lang, order.status)} />
        </View>
      </View>

      {'items' in order && order.items && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{lang === 'ar' ? 'المنتجات' : 'Items'}</Text>
          {order.items.map((it) => (
            <View key={it.id} style={styles.itemRow}>
              <Text style={styles.itemName}>{it.product ? (lang === 'ar' ? it.product.nameAr : it.product.nameEn ?? it.product.nameAr) : it.productId}</Text>
              <Text style={styles.itemQty}>×{it.quantity}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{lang === 'ar' ? 'حالة الطلب' : 'Order Status'}</Text>
        <View style={styles.timeline}>
          {'events' in order && order.events ? order.events.map((ev, idx) => (
            <View key={ev.id} style={styles.timelineItem}>
              <View style={styles.timelineIcon}>
                <View style={[styles.dot, idx === order.events!.length - 1 ? { backgroundColor: colors.primary } : { backgroundColor: colors.border }]} />
                {idx !== order.events!.length - 1 && <View style={styles.line} />}
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineStatus}>{statusLabel(lang, ev.status)}</Text>
                <Text style={styles.timelineDate}>{new Date(ev.createdAt).toLocaleString()}</Text>
              </View>
            </View>
          )) : <Text style={{ color: colors.textMuted }}>لا توجد تحديثات</Text>}
        </View>
      </View>

      {'total' in order && (
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>{lang === 'ar' ? 'الإجمالي' : 'Total'}</Text>
          <Text style={styles.totalVal}>{Number(order.total).toFixed(0)} SDG</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerCard: { backgroundColor: colors.surface, padding: spacing.lg, borderRadius: radius.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
  num: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text },
  section: { backgroundColor: colors.surface, padding: spacing.lg, borderRadius: radius.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  itemName: { fontSize: fontSize.md, color: colors.text },
  itemQty: { fontSize: fontSize.md, fontWeight: '700', color: colors.primary },
  timeline: { marginTop: spacing.sm },
  timelineItem: { flexDirection: 'row', marginBottom: 0 },
  timelineIcon: { alignItems: 'center', width: 24 },
  dot: { width: 12, height: 12, borderRadius: 6, marginTop: 6 },
  line: { width: 2, flex: 1, backgroundColor: colors.border, marginVertical: 4 },
  timelineContent: { flex: 1, paddingBottom: spacing.xl, paddingLeft: spacing.md },
  timelineStatus: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  timelineDate: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },
  totalBox: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.primaryLight, padding: spacing.xl, borderRadius: radius.lg },
  totalLabel: { fontSize: fontSize.lg, fontWeight: '700', color: colors.primary },
  totalVal: { fontSize: fontSize.xl, fontWeight: '800', color: colors.primary },
});
