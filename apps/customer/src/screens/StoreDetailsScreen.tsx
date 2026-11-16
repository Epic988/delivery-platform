import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Store, Product, colors, fontSize, radius, spacing } from '@delivery/shared';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../types';

type Route = RouteProp<RootStackParamList, 'StoreDetails'>;

const COPY = {
  en: {
    viewProducts: 'View all products',
    categories: 'Categories',
    featured: 'Featured items',
    openNow: 'Open now',
    closed: 'Closed',
    retry: 'Retry',
    errStore: 'Could not load store',
    errProducts: 'Could not load products',
    noProducts: 'No products in this store yet',
    noCategories: 'No categories',
    back: 'Back',
  },
  ar: {
    viewProducts: 'عرض جميع المنتجات',
    categories: 'الفئات',
    featured: 'منتجات مختارة',
    openNow: 'مفتوح الآن',
    closed: 'مغلق',
    retry: 'إعادة المحاولة',
    errStore: 'تعذّر تحميل المتجر',
    errProducts: 'تعذّر تحميل المنتجات',
    noProducts: 'لا توجد منتجات في هذا المتجر بعد',
    noCategories: 'لا توجد فئات',
    back: 'رجوع',
  },
} as const;

export function StoreDetailsScreen() {
  const { params } = useRoute<Route>();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { lang } = useAuth();
  const t = COPY[lang === 'ar' ? 'ar' : 'en'];
  const isRTL = lang === 'ar';

  const [store, setStore] = useState<Store | null>(null);
  const [storeLoading, setStoreLoading] = useState(true);
  const [storeErr, setStoreErr] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsErr, setProductsErr] = useState<string | null>(null);

  const loadStore = useCallback(async () => {
    setStoreErr(null);
    setStoreLoading(true);
    try {
      const r = await api.store(params.slug);
      setStore(r.store);
    } catch (e: any) {
      setStoreErr(e?.message ?? t.errStore);
    } finally {
      setStoreLoading(false);
    }
  }, [params.slug, t.errStore]);

  const loadProducts = useCallback(async () => {
    setProductsErr(null);
    setProductsLoading(true);
    try {
      const r = await api.products({ storeSlug: params.slug, pageSize: 6 });
      setProducts(r.data);
    } catch (e: any) {
      setProductsErr(e?.message ?? t.errProducts);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  }, [params.slug, t.errProducts]);

  useEffect(() => {
    loadStore();
    loadProducts();
  }, [loadStore, loadProducts]);

  if (storeLoading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  if (storeErr || !store) {
    return (
      <View style={styles.center}>
        <Ionicons name="cloud-offline-outline" size={48} color={colors.textMuted} />
        <Text style={styles.empty}>{storeErr ?? t.errStore}</Text>
        <Pressable style={styles.retryBtn} onPress={loadStore}>
          <Text style={styles.retryTxt}>{t.retry}</Text>
        </Pressable>
      </View>
    );
  }

  const storeName = lang === 'ar' ? store.nameAr : (store.nameEn ?? store.nameAr);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
      <View style={styles.heroWrap}>
        {store.logoUrl ? (
          <Image source={{ uri: store.logoUrl }} style={styles.heroImage} resizeMode="cover" />
        ) : (
          <View style={styles.heroPlaceholder}>
            <Ionicons name="storefront" size={56} color={colors.primaryLight} />
          </View>
        )}
      </View>

      <View style={{ paddingHorizontal: spacing.lg }}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>{storeName}</Text>
          <View style={[styles.statusPill, { backgroundColor: store.isOpen ? colors.successBg : colors.dangerBg }]}>
            <Text style={[styles.statusTxt, { color: store.isOpen ? colors.success : colors.danger }]}>
              {store.isOpen ? t.openNow : t.closed}
            </Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={16} color={colors.textMuted} />
          <Text style={styles.addr} numberOfLines={2}>{store.addressText}</Text>
        </View>

        {store.description ? (
          <Text style={styles.description}>{store.description}</Text>
        ) : null}

        <Pressable
          style={styles.primaryBtn}
          onPress={() => nav.navigate('Products', { storeSlug: store.slug, title: storeName })}
        >
          <Ionicons name="list" size={18} color="#fff" />
          <Text style={styles.primaryBtnTxt}>{t.viewProducts}</Text>
        </Pressable>

        {store.categories && store.categories.length > 0 ? (
          <View style={{ marginTop: spacing.xl }}>
            <Text style={styles.sectionTitle}>{t.categories}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catList}>
              {store.categories.map((c) => {
                const catName = lang === 'ar' ? c.nameAr : (c.nameEn ?? c.nameAr);
                return (
                  <Pressable
                    key={c.id}
                    style={styles.catChip}
                    onPress={() => nav.navigate('Products', {
                      storeSlug: store.slug,
                      categoryId: c.id,
                      title: catName,
                    })}
                  >
                    <Text style={styles.catChipTxt}>{catName}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}

        <View style={{ marginTop: spacing.xl }}>
          <Text style={styles.sectionTitle}>{t.featured}</Text>
          {productsLoading ? (
            <View style={styles.inlineLoading}><ActivityIndicator color={colors.primary} /></View>
          ) : productsErr ? (
            <View style={styles.inlineEmpty}>
              <Text style={styles.empty}>{productsErr}</Text>
              <Pressable style={styles.retryBtn} onPress={loadProducts}>
                <Text style={styles.retryTxt}>{t.retry}</Text>
              </Pressable>
            </View>
          ) : products.length === 0 ? (
            <View style={styles.inlineEmpty}>
              <Ionicons name="cube-outline" size={36} color={colors.textMuted} />
              <Text style={styles.empty}>{t.noProducts}</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.prodList}>
              {products.map((p) => {
                const pName = lang === 'ar' ? p.nameAr : (p.nameEn ?? p.nameAr);
                return (
                  <Pressable
                    key={p.id}
                    style={styles.prodCard}
                    onPress={() => nav.navigate('Products', { storeSlug: store.slug, title: storeName })}
                  >
                    {p.imageUrl ? (
                      <Image source={{ uri: p.imageUrl }} style={styles.prodImage} resizeMode="cover" />
                    ) : (
                      <View style={styles.prodImagePlaceholder}>
                        <Ionicons name="image-outline" size={28} color={colors.border} />
                      </View>
                    )}
                    <View style={styles.prodBody}>
                      <Text style={styles.prodName} numberOfLines={2}>{pName}</Text>
                      <Text style={styles.prodPrice}>
                        {Number(p.price).toFixed(0)} <Text style={styles.currency}>{p.currency}</Text>
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, padding: spacing.xl, gap: spacing.md },
  heroWrap: { width: '100%', height: 180, backgroundColor: colors.background },
  heroImage: { width: '100%', height: '100%' },
  heroPlaceholder: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg, gap: spacing.sm },
  title: { fontSize: fontSize.xxl, fontWeight: '800', color: colors.text, flex: 1 },
  statusPill: { paddingVertical: 4, paddingHorizontal: spacing.md, borderRadius: radius.pill },
  statusTxt: { fontSize: fontSize.xs, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm },
  addr: { fontSize: fontSize.sm, color: colors.textMuted, flex: 1 },
  description: { fontSize: fontSize.md, color: colors.text, marginTop: spacing.md, lineHeight: 22 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: radius.lg, marginTop: spacing.lg },
  primaryBtnTxt: { color: '#fff', fontWeight: '800', fontSize: fontSize.md },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  catList: { gap: spacing.sm, paddingBottom: spacing.xs },
  catChip: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  catChipTxt: { color: colors.text, fontWeight: '600', fontSize: fontSize.sm },
  inlineLoading: { paddingVertical: spacing.xl, alignItems: 'center' },
  inlineEmpty: { paddingVertical: spacing.lg, alignItems: 'center', gap: spacing.sm },
  empty: { color: colors.textMuted, fontSize: fontSize.md, textAlign: 'center' },
  retryBtn: { marginTop: spacing.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radius.md, backgroundColor: colors.primary },
  retryTxt: { color: '#fff', fontWeight: '700', fontSize: fontSize.sm },
  prodList: { gap: spacing.md },
  prodCard: { width: 160, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  prodImage: { width: '100%', height: 100 },
  prodImagePlaceholder: { width: '100%', height: 100, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  prodBody: { padding: spacing.sm },
  prodName: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text, minHeight: 36 },
  prodPrice: { fontSize: fontSize.md, fontWeight: '800', color: colors.primary, marginTop: 4 },
  currency: { fontSize: fontSize.xs, fontWeight: '600', color: colors.textMuted },
});