import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Product, colors, fontSize, radius, spacing } from '@delivery/shared';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../types';

type Route = RouteProp<RootStackParamList, 'Products'>;

export function ProductsScreen() {
  const { params } = useRoute<Route>();
  const { lang } = useAuth();
  const isRTL = lang === 'ar';

  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const r = await api.products({
        storeSlug: params.storeSlug,
        categoryId: params.categoryId,
        q: params.q,
        pageSize: 100,
      });
      setData(r.data);
    } catch (e: any) {
      setErr(e?.message ?? (isRTL ? 'تعذّر تحميل المنتجات' : 'Failed to load products'));
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [params.storeSlug, params.categoryId, params.q, isRTL]);

  useEffect(() => { load(); }, [load]);

  const addToCart = async (p: Product) => {
    setMsg(null);
    try {
      await api.addToCart(p.storeId, { productId: p.id, quantity: 1 });
      setMsg({ type: 'success', text: isRTL ? 'تمت الإضافة إلى السلة بنجاح' : 'Added to cart' });
      setTimeout(() => setMsg(null), 3000);
    } catch (e: any) {
      setMsg({ type: 'error', text: e?.message ?? (isRTL ? 'فشل الإضافة' : 'Failed to add') });
      setTimeout(() => setMsg(null), 5000);
    }
  };

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
    <View style={styles.container}>
      {msg && (
        <View style={[styles.toast, { backgroundColor: msg.type === 'success' ? colors.success : colors.danger }]}>
          <Ionicons name={msg.type === 'success' ? 'checkmark-circle' : 'alert-circle'} size={20} color="#fff" />
          <Text style={styles.toastTxt}>{msg.text}</Text>
        </View>
      )}

      <FlatList
        contentContainerStyle={{ padding: spacing.lg }}
        data={data}
        numColumns={2}
        columnWrapperStyle={{ gap: spacing.md }}
        keyExtractor={(p) => p.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons name="cube-outline" size={48} color={colors.textMuted} />
            <Text style={styles.empty}>
              {isRTL ? 'لا توجد منتجات هنا' : 'No products here'}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const imageUrl = (item as any).imageUrl as string | undefined;
          return (
            <View style={styles.card}>
              {imageUrl ? (
                <Image source={{ uri: imageUrl }} style={styles.image} resizeMode="cover" />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="image-outline" size={32} color={colors.border} />
                </View>
              )}
              <View style={styles.cardContent}>
                <Text style={styles.name} numberOfLines={2}>
                  {lang === 'ar' ? item.nameAr : (item.nameEn ?? item.nameAr)}
                </Text>
                <View style={styles.priceRow}>
                  <Text style={styles.price}>
                    {Number(item.price).toFixed(0)} <Text style={styles.currency}>SDG</Text>
                  </Text>
                  <Pressable style={styles.addBtn} onPress={() => addToCart(item)}>
                    <Ionicons name="add" size={20} color="#fff" />
                  </Pressable>
                </View>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, padding: spacing.xl, gap: spacing.md },
  toast: { position: 'absolute', top: 20, left: 20, right: 20, zIndex: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing.md, borderRadius: radius.md, gap: 8 },
  toastTxt: { color: '#fff', fontWeight: '700', fontSize: fontSize.md },
  card: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  image: { height: 120, width: '100%' },
  imagePlaceholder: { height: 120, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  cardContent: { padding: spacing.md },
  name: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, marginBottom: spacing.xs, minHeight: 40 },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  price: { fontSize: fontSize.lg, fontWeight: '800', color: colors.primary },
  currency: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textMuted },
  addBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  emptyBox: { alignItems: 'center', marginTop: spacing.xxl, gap: spacing.sm },
  empty: { textAlign: 'center', color: colors.textMuted, fontSize: fontSize.md },
  retryBtn: { marginTop: spacing.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radius.md, backgroundColor: colors.primary },
  retryTxt: { color: '#fff', fontWeight: '700', fontSize: fontSize.sm },
});