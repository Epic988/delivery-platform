import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Image, Pressable, RefreshControl,
  ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Address, Store, colors, fontSize, radius, spacing } from '@delivery/shared';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import type { RootStackParamList } from '../types';

const COPY = {
  en: {
    deliverTo: 'Deliver to',
    selectAddress: 'Select address',
    searchPlaceholder: 'Search stores or products...',
    bannerTitle: 'Fast delivery',
    bannerSub: 'Order what you need, delivered fast',
    bannerBtn: 'Shop now',
    courierTitle: 'Send a parcel',
    courierSub: 'Delivery between two addresses',
    shopTitle: 'Shop',
    shopSub: 'Browse local stores',
    featuredTitle: 'Featured stores',
    seeAll: 'See all',
    noStores: 'No stores yet',
    noStoresHint: 'Stores will appear here when available.',
    open: 'Open now',
    retry: 'Retry',
    errStores: 'Could not load stores',
  },
  ar: {
    deliverTo: 'التوصيل إلى',
    selectAddress: 'اختر عنواناً',
    searchPlaceholder: 'ابحث عن متجر أو منتج...',
    bannerTitle: 'توصيل سريع',
    bannerSub: 'اطلب احتياجاتك الآن ووصلها إليك بأسرع وقت',
    bannerBtn: 'تسوق الآن',
    courierTitle: 'أرسل طرداً',
    courierSub: 'توصيل بين عنوانين',
    shopTitle: 'تسوق',
    shopSub: 'تصفح المتاجر المحلية',
    featuredTitle: 'متاجر مميزة',
    seeAll: 'عرض الكل',
    noStores: 'لا توجد متاجر بعد',
    noStoresHint: 'ستظهر المتاجر هنا عند توفرها.',
    open: 'مفتوح',
    retry: 'إعادة المحاولة',
    errStores: 'تعذّر تحميل المتاجر',
  },
} as const;

export function HomeScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { lang } = useAuth();
  const t = COPY[lang === 'ar' ? 'ar' : 'en'];
  const isRTL = lang === 'ar';

  const [search, setSearch] = useState('');
  const [defaultAddress, setDefaultAddress] = useState<Address | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [storesLoading, setStoresLoading] = useState(true);
  const [storesErr, setStoresErr] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadDefaultAddress = useCallback(async () => {
    try {
      const r = await api.addresses();
      const preferred = r.data.find((a) => a.isDefault) ?? r.data[0] ?? null;
      setDefaultAddress(preferred);
    } catch {
      setDefaultAddress(null);
    }
  }, []);

  const loadStores = useCallback(async () => {
    setStoresErr(null);
    setStoresLoading(true);
    try {
      const r = await api.stores({ pageSize: 6 });
      setStores(r.data);
    } catch (e: any) {
      setStoresErr(e?.message ?? t.errStores);
      setStores([]);
    } finally {
      setStoresLoading(false);
    }
  }, [t.errStores]);

  useEffect(() => { loadStores(); }, [loadStores]);

  useFocusEffect(useCallback(() => { loadDefaultAddress(); }, [loadDefaultAddress]));

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadDefaultAddress(), loadStores()]);
    setRefreshing(false);
  };

  const onSearchSubmit = () => {
    const q = search.trim();
    nav.navigate('Stores', { q });
  };

  const addressText = defaultAddress?.addressText ?? t.selectAddress;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.deliverTo}>{t.deliverTo}</Text>
          <Pressable style={styles.locationBtn} onPress={() => nav.navigate('Addresses')}>
            <Ionicons name="location" size={16} color={colors.primary} />
            <Text style={styles.locationText} numberOfLines={1}>{addressText}</Text>
            <Ionicons name="chevron-down" size={16} color={colors.text} />
          </Pressable>
        </View>
        <Pressable onPress={() => nav.navigate('Profile')} style={styles.avatar}>
          <Ionicons name="person" size={24} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            placeholder={t.searchPlaceholder}
            placeholderTextColor={colors.textMuted}
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={onSearchSubmit}
            returnKeyType="search"
            textAlign={isRTL ? 'right' : 'left'}
          />
          {search.length > 0 ? (
            <Pressable onPress={() => setSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>

        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.banner}
        >
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>{t.bannerTitle}</Text>
            <Text style={styles.bannerSub}>{t.bannerSub}</Text>
            <Pressable style={styles.bannerBtn} onPress={() => nav.navigate('Stores', {})}>
              <Text style={styles.bannerBtnTxt}>{t.bannerBtn}</Text>
            </Pressable>
          </View>
          <MaterialCommunityIcons name="moped" size={80} color="#ffffff40" style={styles.bannerIcon} />
        </LinearGradient>

        <View style={styles.serviceRow}>
          <Pressable style={[styles.serviceCard, { backgroundColor: colors.accent }]} onPress={() => nav.navigate('CourierRequest')}>
            <View style={styles.serviceIconBg}>
              <MaterialCommunityIcons name="package-variant-closed" size={28} color={colors.accent} />
            </View>
            <Text style={styles.serviceTitle}>{t.courierTitle}</Text>
            <Text style={styles.serviceSub}>{t.courierSub}</Text>
          </Pressable>
          <Pressable style={[styles.serviceCard, { backgroundColor: colors.primary }]} onPress={() => nav.navigate('Stores', {})}>
            <View style={styles.serviceIconBg}>
              <Ionicons name="storefront" size={28} color={colors.primary} />
            </View>
            <Text style={styles.serviceTitle}>{t.shopTitle}</Text>
            <Text style={styles.serviceSub}>{t.shopSub}</Text>
          </Pressable>
        </View>

        {/* TODO (Commit 3b): Categories section will be restored from api.categories({}) once Category type is confirmed. */}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t.featuredTitle}</Text>
          <Pressable onPress={() => nav.navigate('Stores', {})}>
            <Text style={styles.seeAll}>{t.seeAll}</Text>
          </Pressable>
        </View>

        {storesLoading ? (
          <View style={styles.storesLoading}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : storesErr ? (
          <View style={styles.storesEmpty}>
            <Text style={styles.emptyText}>{storesErr}</Text>
            <Pressable style={styles.retryBtn} onPress={loadStores}>
              <Text style={styles.retryTxt}>{t.retry}</Text>
            </Pressable>
          </View>
        ) : stores.length === 0 ? (
          <View style={styles.storesEmpty}>
            <Ionicons name="storefront-outline" size={40} color={colors.textMuted} />
            <Text style={styles.emptyText}>{t.noStores}</Text>
            <Text style={styles.emptyHint}>{t.noStoresHint}</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storesList}>
            {stores.map((s) => {
              const name = lang === 'ar' ? s.nameAr : (s.nameEn ?? s.nameAr);
              const imageUrl = (s as any).imageUrl as string | undefined;
              return (
                <Pressable
                  key={s.id}
                  style={styles.storeCard}
                  onPress={() => nav.navigate('StoreDetails', { slug: s.slug })}
                >
                  {imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={styles.storeImage} resizeMode="cover" />
                  ) : (
                    <View style={styles.storeImagePlaceholder}>
                      <Ionicons name="storefront" size={40} color={colors.primaryLight} />
                    </View>
                  )}
                  <Text style={styles.storeCardName} numberOfLines={1}>{name}</Text>
                  <Text style={styles.storeCardStatus}>{t.open}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.xxl, paddingBottom: spacing.md, backgroundColor: colors.surface },
  deliverTo: { fontSize: fontSize.xs, color: colors.textMuted, marginBottom: 2 },
  locationBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, maxWidth: 240 },
  locationText: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, flexShrink: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: spacing.lg, paddingBottom: 100 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: spacing.md, height: 50, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg, gap: spacing.sm },
  searchIcon: { marginRight: 2 },
  searchInput: { flex: 1, fontSize: fontSize.md, color: colors.text },
  banner: { flexDirection: 'row', borderRadius: radius.xl, padding: spacing.xl, marginBottom: spacing.lg, overflow: 'hidden', alignItems: 'center' },
  bannerContent: { flex: 1, zIndex: 2 },
  bannerTitle: { fontSize: fontSize.xl, fontWeight: '800', color: '#fff', marginBottom: spacing.xs },
  bannerSub: { fontSize: fontSize.sm, color: '#ffffffdd', marginBottom: spacing.md, lineHeight: 20 },
  bannerBtn: { backgroundColor: '#fff', alignSelf: 'flex-start', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.pill },
  bannerBtnTxt: { color: colors.primary, fontWeight: '800', fontSize: fontSize.sm },
  bannerIcon: { position: 'absolute', right: -10, bottom: -10, opacity: 0.5 },
  serviceRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  serviceCard: { flex: 1, borderRadius: radius.lg, padding: spacing.lg },
  serviceIconBg: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  serviceTitle: { fontSize: fontSize.lg, fontWeight: '800', color: '#fff' },
  serviceSub: { fontSize: fontSize.xs, color: '#ffffffdd', marginTop: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  seeAll: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '600' },
  storesLoading: { paddingVertical: spacing.xl, alignItems: 'center' },
  storesEmpty: { paddingVertical: spacing.xl, alignItems: 'center', gap: spacing.sm },
  emptyText: { color: colors.textMuted, fontSize: fontSize.md, textAlign: 'center' },
  emptyHint: { color: colors.textMuted, fontSize: fontSize.sm, textAlign: 'center' },
  retryBtn: { marginTop: spacing.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radius.md, backgroundColor: colors.primary },
  retryTxt: { color: '#fff', fontWeight: '700', fontSize: fontSize.sm },
  storesList: { gap: spacing.md, paddingBottom: spacing.md },
  storeCard: { width: 160, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  storeImage: { height: 80, borderRadius: radius.md, marginBottom: spacing.sm, width: '100%' },
  storeImagePlaceholder: { height: 80, backgroundColor: colors.background, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  storeCardName: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  storeCardStatus: { fontSize: fontSize.xs, color: colors.success, marginTop: 4 },
});