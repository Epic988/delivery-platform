import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Assignment, colors, fontSize, radius, spacing, statusLabel } from '@delivery/shared';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import type { RootStackParamList } from '../types';

type Route = RouteProp<RootStackParamList, 'AssignmentDetails'>;

const COPY = {
  en: {
    pickup: 'Pickup',
    from: 'From',
    to: 'To',
    recipient: 'Recipient',
    accept: 'Accept',
    decline: 'Decline',
    pickedUp: 'Package picked up',
    delivered: 'Delivered to customer',
    proof: 'Proof of delivery',
    retry: 'Retry',
    errLoad: 'Could not load assignment',
    errNotFound: 'Assignment not found',
    errAction: 'Action failed',
    errStatus: 'Status update failed',
    busy: 'Working...',
  },
  ar: {
    pickup: 'عنوان الاستلام',
    from: 'من',
    to: 'إلى',
    recipient: 'المستلم',
    accept: 'قبول',
    decline: 'رفض',
    pickedUp: 'تم استلام الطرد من المتجر',
    delivered: 'تم التوصيل للعميل',
    proof: 'إثبات التسليم',
    retry: 'إعادة المحاولة',
    errLoad: 'تعذّر تحميل التعيين',
    errNotFound: 'التعيين غير موجود',
    errAction: 'فشل تنفيذ الإجراء',
    errStatus: 'فشل تحديث الحالة',
    busy: 'جارٍ التنفيذ...',
  },
} as const;

export function AssignmentDetailsScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Route>();
  const { lang } = useAuth();
  const t = COPY[lang === 'ar' ? 'ar' : 'en'];

  const [a, setA] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionErr, setActionErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadErr(null);
    setLoading(true);
    try {
      const r = await api.driverAssignments();
      const found = r.data.find((x) => x.id === route.params.id);
      if (!found) {
        setLoadErr(t.errNotFound);
        setA(null);
      } else {
        setA(found);
      }
    } catch (e: any) {
      setLoadErr(e?.message ?? t.errLoad);
      setA(null);
    } finally {
      setLoading(false);
    }
  }, [route.params.id, t.errNotFound, t.errLoad]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const doAction = async (action: 'accept' | 'decline') => {
    if (!a || busy) return;
    setBusy(true);
    setActionErr(null);
    try {
      if (action === 'accept') await api.acceptAssignment(a.id);
      else await api.declineAssignment(a.id);
      nav.goBack();
    } catch (e: any) {
      setActionErr(e?.message ?? t.errAction);
    } finally {
      setBusy(false);
    }
  };

  const doStatus = async (status: string) => {
    if (!a || busy) return;
    setBusy(true);
    setActionErr(null);
    try {
      await api.updateAssignmentStatus(a.id, status);
      await load();
    } catch (e: any) {
      setActionErr(e?.message ?? t.errStatus);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  if (loadErr || !a) {
    return (
      <View style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={48} color={colors.textMuted} />
        <Text style={styles.emptyTxt}>{loadErr ?? t.errNotFound}</Text>
        <Pressable style={styles.retryBtn} onPress={load}>
          <Text style={styles.retryTxt}>{t.retry}</Text>
        </Pressable>
      </View>
    );
  }

  const order = a.shoppingOrder ?? a.courierOrder;
  const orderStatus = order?.status ?? '';

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
      <View style={styles.headerCard}>
        <Text style={styles.num} numberOfLines={1}>{order?.orderNumber ?? '—'}</Text>
        <View style={styles.statusPill}>
          <Text style={styles.statusTxt}>{statusLabel(lang, orderStatus)}</Text>
        </View>
      </View>

      {a.orderType === 'SHOPPING' && a.shoppingOrder ? (
        <View style={styles.infoCard}>
          <Text style={styles.label}>{t.pickup}</Text>
          <Text style={styles.value}>{a.shoppingOrder.store?.nameAr ?? '—'}</Text>
        </View>
      ) : a.courierOrder ? (
        <View style={styles.infoCard}>
          <Text style={styles.label}>{t.from}</Text>
          <Text style={styles.value}>{a.courierOrder.pickupAddressText}</Text>
          <Text style={[styles.label, { marginTop: spacing.md }]}>{t.to}</Text>
          <Text style={styles.value}>{a.courierOrder.destinationAddressText}</Text>
          <Text style={[styles.label, { marginTop: spacing.md }]}>{t.recipient}</Text>
          <Text style={styles.value}>{a.courierOrder.recipientName} — {a.courierOrder.recipientPhone}</Text>
        </View>
      ) : null}

      {actionErr ? (
        <View style={styles.errorBanner}>
          <Ionicons name="alert-circle" size={18} color={colors.danger} />
          <Text style={styles.errorTxt}>{actionErr}</Text>
        </View>
      ) : null}

      <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
        {a.status === 'ASSIGNED' ? (
          <>
            <Button title={t.accept} onPress={() => doAction('accept')} variant="primary" loading={busy} />
            <Button title={t.decline} onPress={() => doAction('decline')} variant="danger" loading={busy} />
          </>
        ) : null}

        {a.status === 'ACCEPTED' || orderStatus === 'ARRIVING_AT_PICKUP' ? (
          <Button title={t.pickedUp} onPress={() => doStatus('PICKED_UP')} loading={busy} />
        ) : null}

        {orderStatus === 'PICKED_UP' ? (
          <Button title={t.delivered} onPress={() => doStatus('DELIVERED')} variant="primary" loading={busy} />
        ) : null}

        {orderStatus === 'DELIVERED' ? (
          <Button title={t.proof} onPress={() => nav.navigate('Proof', { id: a.id })} variant="secondary" />
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, padding: spacing.xl, gap: spacing.md },
  emptyTxt: { color: colors.textMuted, fontSize: fontSize.md, textAlign: 'center' },
  retryBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radius.md, backgroundColor: colors.primary },
  retryTxt: { color: '#fff', fontWeight: '700', fontSize: fontSize.sm },
  headerCard: { backgroundColor: colors.surface, padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
  num: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text },
  statusPill: { alignSelf: 'flex-start', marginTop: spacing.sm, paddingVertical: 4, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.primaryLight },
  statusTxt: { color: colors.primary, fontWeight: '700', fontSize: fontSize.sm },
  infoCard: { backgroundColor: colors.surface, padding: spacing.lg, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border },
  label: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  value: { fontSize: fontSize.md, color: colors.text, marginTop: 4, fontWeight: '600' },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.dangerBg, padding: spacing.md, borderRadius: radius.md, marginTop: spacing.md },
  errorTxt: { color: colors.danger, fontWeight: '600', flex: 1, fontSize: fontSize.sm },
});