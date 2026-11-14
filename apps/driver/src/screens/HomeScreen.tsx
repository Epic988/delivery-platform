import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View, Alert } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Assignment, DriverProfile, colors, fontSize, radius, spacing } from '@delivery/shared';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../types';

export function HomeScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { lang, user, logout } = useAuth();
  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.driverMe().then((r) => {
      setDriver(r.driver);
      setAssignments(r.activeAssignments);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggleAvailable = async (v: boolean) => {
    try { await api.driverAvailability(v); load(); }
    catch (e: any) { Alert.alert('Error', e?.message ?? ''); }
  };

  if (loading) return <View style={styles.c}><ActivityIndicator color={colors.primary} /></View>;

  return (
    <ScrollView style={styles.s} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={styles.hello}>{lang === 'ar' ? `مرحباً ${user?.fullName ?? ''}` : `Hello ${user?.fullName ?? ''}`}</Text>

      <View style={styles.availCard}>
        <Text style={styles.availLabel}>{lang === 'ar' ? 'متاح للعمل' : 'Available for work'}</Text>
        <Switch value={!!driver?.isAvailable} onValueChange={toggleAvailable} trackColor={{ true: colors.success }} />
      </View>

      <Text style={styles.section}>{lang === 'ar' ? 'التعيينات النشطة' : 'Active assignments'}</Text>
      {assignments.length === 0 ? (
        <Text style={styles.empty}>{lang === 'ar' ? 'لا توجد تعيينات' : 'No assignments'}</Text>
      ) : (
        assignments.map((a) => (
          <Pressable key={a.id} style={styles.card} onPress={() => nav.navigate('AssignmentDetails', { id: a.id })}>
            <Text style={styles.num}>
              {a.orderType === 'SHOPPING' ? (a.shoppingOrder?.orderNumber ?? '—') : (a.courierOrder?.orderNumber ?? '—')}
            </Text>
            <Text style={styles.kind}>{a.orderType === 'SHOPPING' ? (lang === 'ar' ? 'تسوق' : 'Shop') : (lang === 'ar' ? 'توصيل' : 'Courier')}</Text>
            <Text style={styles.status}>{a.status}</Text>
          </Pressable>
        ))
      )}

      <Pressable onPress={logout} style={{ marginTop: spacing.xl, alignItems: 'center' }}>
        <Text style={{ color: colors.danger }}>{lang === 'ar' ? 'تسجيل الخروج' : 'Logout'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.backgroundAlt, alignItems: 'center', justifyContent: 'center' },
  s: { flex: 1, backgroundColor: colors.backgroundAlt },
  hello: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.text, marginTop: spacing.md },
  availCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.background, padding: spacing.lg, borderRadius: radius.md, marginTop: spacing.lg, borderWidth: 1, borderColor: colors.border },
  availLabel: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  section: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginTop: spacing.xl, marginBottom: spacing.sm },
  empty: { color: colors.textMuted, textAlign: 'center', padding: spacing.lg },
  card: { backgroundColor: colors.background, padding: spacing.lg, borderRadius: radius.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  num: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  kind: { fontSize: fontSize.sm, color: colors.primary, marginTop: spacing.xs },
  status: { fontSize: fontSize.sm, color: colors.warning, marginTop: spacing.xs, fontWeight: '600' },
});
