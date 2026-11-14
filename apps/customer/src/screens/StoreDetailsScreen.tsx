import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Store, colors, fontSize, radius, spacing } from '@delivery/shared';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../types';

type Route = RouteProp<RootStackParamList, 'StoreDetails'>;

export function StoreDetailsScreen() {
  const { params } = useRoute<Route>();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { lang } = useAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api.store(params.slug).then((r) => setStore(r.store)).catch((e) => setErr(e.message)).finally(() => setLoading(false));
  }, [params.slug]);

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  if (err || !store) return <View style={styles.center}><Text style={{ color: colors.danger }}>{err ?? 'Not found'}</Text></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={styles.title}>{lang === 'ar' ? store.nameAr : store.nameEn ?? store.nameAr}</Text>
      <Text style={styles.addr}>{store.addressText}</Text>

      <Pressable style={styles.btn} onPress={() => nav.navigate('Products', { storeSlug: store.slug, title: lang === 'ar' ? store.nameAr : store.nameEn ?? store.nameAr })}>
        <Text style={styles.btnTxt}>{lang === 'ar' ? 'عرض المنتجات' : 'View Products'}</Text>
      </Pressable>

      {store.categories && store.categories.length > 0 ? (
        <View style={{ marginTop: spacing.lg }}>
          <Text style={styles.subheading}>{lang === 'ar' ? 'الفئات' : 'Categories'}</Text>
          {store.categories.map((c) => (
            <Pressable key={c.id} style={styles.catRow} onPress={() => nav.navigate('Products', { storeSlug: store.slug, title: lang === 'ar' ? c.nameAr : c.nameEn ?? c.nameAr })}>
              <Text style={styles.catTxt}>{lang === 'ar' ? c.nameAr : c.nameEn ?? c.nameAr}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.backgroundAlt },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.backgroundAlt },
  title: { fontSize: fontSize.xxl, fontWeight: '700', color: colors.text },
  addr: { fontSize: fontSize.md, color: colors.textMuted, marginTop: spacing.xs },
  btn: { backgroundColor: colors.primary, padding: spacing.lg, borderRadius: radius.md, marginTop: spacing.lg, alignItems: 'center' },
  btnTxt: { color: '#fff', fontWeight: '700', fontSize: fontSize.md },
  subheading: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  catRow: { backgroundColor: colors.background, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  catTxt: { fontSize: fontSize.md, color: colors.text },
});
