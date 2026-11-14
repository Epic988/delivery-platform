import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Assignment, colors, fontSize, radius, spacing, statusLabel } from '@delivery/shared';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import type { RootStackParamList } from '../types';

type Route = RouteProp<RootStackParamList, 'AssignmentDetails'>;

export function AssignmentDetailsScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<Route>();
  const { lang } = useAuth();
  const [a, setA] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.driverAssignments().then((r) => {
      const found = r.data.find((x) => x.id === route.params.id);
      setA(found ?? null);
    }).finally(() => setLoading(false));
  }, [route.params.id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const doAction = async (action: 'accept' | 'decline') => {
    if (!a) return;
    setBusy(true);
    try {
      if (action === 'accept') await api.acceptAssignment(a.id);
      else await api.declineAssignment(a.id);
      nav.goBack();
    } catch (e: any) { Alert.alert('Error', e?.message ?? ''); }
    finally { setBusy(false); }
  };

  const doStatus = async (status: string) => {
    if (!a) return;
    setBusy(true);
    try { await api.updateAssignmentStatus(a.id, status); load(); }
    catch (e: any) { Alert.alert('Error', e?.message ?? ''); }
    finally { setBusy(false); }
  };

  if (loading) return <View style={styles.c}><ActivityIndicator color={colors.primary} /></View>;
  if (!a) return <View style={styles.c}><Text>Not found</Text></View>;

  const order = a.shoppingOrder ?? a.courierOrder;
  const orderStatus = order?.status ?? '';

  return (
    <ScrollView style={styles.s} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={styles.num}>{order?.orderNumber ?? '—'}</Text>
      <Text style={styles.status}>{statusLabel(lang, orderStatus)}</Text>

      {a.orderType === 'SHOPPING' && a.shoppingOrder ? (
        <View style={styles.info}>
          <Text style={styles.h}>{lang === 'ar' ? 'عنوان الاستلام' : 'Pickup'}</Text>
          <Text>{a.shoppingOrder.store?.nameAr ?? '—'}</Text>
          <Text style={styles.h}>{lang === 'ar' ? 'التوصيل إلى' : 'Deliver to'}</Text>
          <Text>{a.shoppingOrder.storeId}</Text>
        </View>
      ) : a.courierOrder ? (
        <View style={styles.info}>
          <Text style={styles.h}>{lang === 'ar' ? 'من' : 'From'}</Text>
          <Text>{a.courierOrder.pickupAddressText}</Text>
          <Text style={styles.h}>{lang === 'ar' ? 'إلى' : 'To'}</Text>
          <Text>{a.courierOrder.destinationAddressText}</Text>
          <Text style={styles.h}>{lang === 'ar' ? 'المستلم' : 'Recipient'}</Text>
          <Text>{a.courierOrder.recipientName} — {a.courierOrder.recipientPhone}</Text>
        </View>
      ) : null}

      <View style={{ marginTop: spacing.lg, gap: spacing.sm }}>
        {a.status === 'ASSIGNED' ? (
          <>
            <Button title={lang === 'ar' ? 'قبول' : 'Accept'} onPress={() => doAction('accept')} variant="success" loading={busy} />
            <Button title={lang === 'ar' ? 'رفض' : 'Decline'} onPress={() => doAction('decline')} variant="danger" loading={busy} />
          </>
        ) : null}
        {a.status === 'ACCEPTED' && orderStatus === 'ACCEPTED' ? (
          <Button title={lang === 'ar' ? 'وصلت لمكان الاستلام' : 'Arrived at pickup'} onPress={() => doStatus('ARRIVING_AT_PICKUP')} loading={busy} />
        ) : null}
        {orderStatus === 'ARRIVING_AT_PICKUP' ? (
          <Button title={lang === 'ar' ? 'تم استلام الطرد' : 'Picked up'} onPress={() => doStatus('PICKED_UP')} loading={busy} />
        ) : null}
        {orderStatus === 'PICKED_UP' ? (
          <Button title={lang === 'ar' ? 'قيد التوصيل' : 'In transit'} onPress={() => doStatus('IN_TRANSIT')} loading={busy} />
        ) : null}
        {orderStatus === 'IN_TRANSIT' ? (
          <>
            <Button title={lang === 'ar' ? 'تم التوصيل' : 'Delivered'} onPress={() => doStatus('DELIVERED')} variant="success" loading={busy} />
            <Button title={lang === 'ar' ? 'فشل' : 'Failed'} onPress={() => doStatus('FAILED')} variant="danger" loading={busy} />
          </>
        ) : null}
        {orderStatus === 'DELIVERED' ? (
          <Button title={lang === 'ar' ? 'إثبات التسليم' : 'Proof of delivery'} onPress={() => nav.navigate('Proof', { id: a.id })} variant="secondary" />
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  s: { flex: 1, backgroundColor: colors.backgroundAlt },
  num: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  status: { fontSize: fontSize.md, color: colors.primary, fontWeight: '600', marginTop: spacing.xs },
  info: { marginTop: spacing.lg, backgroundColor: colors.background, padding: spacing.lg, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  h: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.sm },
});
