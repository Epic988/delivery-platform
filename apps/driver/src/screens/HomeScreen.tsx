import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View, RefreshControl } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Assignment, DriverProfile, colors, fontSize, radius, spacing, statusLabel } from '@delivery/shared';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import type { RootStackParamList } from '../types';

export function HomeScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { lang, user, logout } = useAuth();
  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    api.driverMe().then((r) => {
      setDriver(r.driver);
      setAssignments(r.activeAssignments);
    }).catch(() => {}).finally(() => { setLoading(false); setRefreshing(false); });
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggleAvailable = async (v: boolean) => {
    try { await api.driverAvailability(v); load(); } catch {}
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>مرحباً، {user?.fullName ?? 'السائق'}</Text>
          <Text style={styles.subGreeting}>جاهز لاستلام الطلبات اليوم؟</Text>
        </View>
        <Pressable onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={24} color={colors.danger} />
        </Pressable>
      </View>

      <View style={[styles.availCard, driver?.isAvailable ? styles.availActive : styles.availInactive]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.availTitle}>{driver?.isAvailable ? 'أنت متاح الآن' : 'أنت غير متاح'}</Text>
          <Text style={styles.availSub}>{driver?.isAvailable ? 'ستصلك الطلبات الجديدة' : 'قم بتفعيل الزر لتصلك الطلبات'}</Text>
        </View>
        <Switch 
          value={!!driver?.isAvailable} 
          onValueChange={toggleAvailable} 
          trackColor={{ true: colors.success, false: colors.border }}
          thumbColor="#fff"
        />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>التعيينات النشطة</Text>
        <View style={styles.countBadge}><Text style={styles.countTxt}>{assignments.length}</Text></View>
      </View>

      {assignments.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconBg}>
             <Ionicons name="document-text-outline" size={48} color={colors.primaryLight} />
          </View>
          <Text style={styles.emptyTitle}>لا توجد مهام حالياً</Text>
          <Text style={styles.emptySub}>ستظهر هنا الطلبات التي تعينها لك الإدارة.</Text>
        </View>
      ) : (
        assignments.map((a) => {
          const order = a.shoppingOrder ?? a.courierOrder;
          return (
            <Pressable key={a.id} style={styles.card} onPress={() => nav.navigate('AssignmentDetails', { id: a.id })}>
              <View style={styles.cardHeader}>
                <View style={styles.badgeType}>
                   <Text style={styles.badgeTypeTxt}>{a.orderType === 'SHOPPING' ? 'تسوق' : 'توصيل'}</Text>
                </View>
                <Text style={styles.orderNum}>{order?.orderNumber ?? '—'}</Text>
              </View>
              
              <View style={styles.routeInfo}>
                <View style={styles.routeRow}>
                  <Ionicons name="storefront" size={16} color={colors.textMuted} />
                  <Text style={styles.routeTxt} numberOfLines={1}>
                    {a.shoppingOrder?.store?.nameAr ?? a.courierOrder?.pickupAddressText ?? '—'}
                  </Text>
                </View>
                <View style={styles.routeRow}>
                  <Ionicons name="location" size={16} color={colors.primary} />
                  <Text style={styles.routeTxt} numberOfLines={1}>
                    {a.courierOrder?.destinationAddressText ?? '—'}
                  </Text>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <StatusBadge status={order?.status ?? ''} label={statusLabel(lang, order?.status ?? '')} />
                <Ionicons name="chevron-back" size={20} color={colors.primary} />
              </View>
            </Pressable>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.md, marginBottom: spacing.xl },
  greeting: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text },
  subGreeting: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 4 },
  logoutBtn: { padding: spacing.sm, backgroundColor: '#FEE2E2', borderRadius: radius.md },
  availCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.lg, borderRadius: radius.lg, marginBottom: spacing.xxl, borderWidth: 1 },
  availActive: { backgroundColor: '#D1FAE5', borderColor: '#34D399' },
  availInactive: { backgroundColor: colors.surface, borderColor: colors.border },
  availTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  availSub: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: 4 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  countBadge: { backgroundColor: colors.primary, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  countTxt: { color: '#fff', fontSize: fontSize.xs, fontWeight: '800' },
  emptyState: { alignItems: 'center', padding: spacing.xxl },
  emptyIconBg: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
  emptySub: { fontSize: fontSize.sm, color: colors.textMuted, textAlign: 'center' },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  badgeType: { backgroundColor: colors.primaryLight, paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radius.sm },
  badgeTypeTxt: { fontSize: fontSize.xs, fontWeight: '800', color: colors.primary },
  orderNum: { fontSize: fontSize.md, fontWeight: '800', color: colors.text },
  routeInfo: { backgroundColor: colors.background, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.md },
  routeRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 4, gap: 8 },
  routeTxt: { fontSize: fontSize.sm, color: colors.text, flex: 1 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
});
