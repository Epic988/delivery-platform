import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Store, colors, fontSize, radius, spacing } from '@delivery/shared';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../types';

type Route = RouteProp<RootStackParamList, 'Stores'>;

export function StoresScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { params } = useRoute<Route>();
  const { lang } = useAuth();
  const isRTL = lang === 'ar';
  const q = params?.q;

  const [data, setData] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const r = await api.stores({ q, pageSize: 50 });
      setData(r.data);
    } catch (e: any) {
      setErr(e?.message ?? (isRTL ? 'تعذّر تحميل المتاجر' : 'Failed to load stores'));
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [q, isRTL]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  if (err) {
    return (
      <View style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={48} color={colors.textMuted} />
        <Text style={styles.empty}>{err}</Text>
        <Pressable style={styles.retryBtn} onPress={load}>
          <Text style={styles.retryTxt}>{isRTL ? 'إعادة المحاولة' : 'Retry'}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.lg }}
      data={data}
      keyExtractor={(s) => s.id}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={
        <View style={styles.emptyBox}>
          <Ionicons name="storefront-outline" size={48} color={colors.textMuted} />
          <Text style={styles.empty}>
            {q
              ? (isRTL ? `لا توجد متاجر تطابق "${q}"` : `No stores match "${q}"`)
              : (isRTL ? 'لا توجد متاجر متاحة' : 'No stores available')}
          </Text>
        </View>
      }
      renderItem={({ item }) => {
        const imageUrl = (item as any).imageUrl as string | undefined;
        return (
          <Pressable style={styles.card} onPress={() => nav.navigate('StoreDetails', { slug: item.slug })}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.storeImage} resizeMode="cover" />
            ) : (
              <View style={styles.storeImagePlaceholder}>
                <Ionicons name="storefront" size={32} color={colors.primaryLight} />
              </View>
            )}
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={1}>
                {lang === 'ar' ? item.nameAr : (item.nameEn ?? item.nameAr)}
              </Text>
              <View style={styles.addrRow}>
                <Ionicons name="location-outline" size={14} color={colors.textMuted} />
                <Text style={styles.addr} numberOfLines={1}>{item.addressText}</Text>
              </View>
            </View>
            <View style={styles.arrow}>
              <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={20} color={colors.textMuted} />
            </View>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, padding: spacing.xl, gap: spacing.md },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  storeImage: { width: 64, height: 64, borderRadius: radius.md },
  storeImagePlaceholder: { width: 64, height: 64, borderRadius: radius.md, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, marginStart: spacing.md },
  name: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  addrRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs, gap: 4 },
  addr: { fontSize: fontSize.sm, color: colors.textMuted, flexShrink: 1 },
  arrow: { padding: spacing.sm },
  emptyBox: { alignItems: 'center', marginTop: spacing.xxl, gap: spacing.sm },
  empty: { textAlign: 'center', color: colors.textMuted, fontSize: fontSize.md },
  retryBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radius.md, backgroundColor: colors.primary },
  retryTxt: { color: '#fff', fontWeight: '700', fontSize: fontSize.sm },
});