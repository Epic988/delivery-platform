import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fontSize, radius, spacing } from '@delivery/shared';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../types';

const CATEGORIES = [
  { id: '1', name: 'بقالة', icon: 'cart' },
  { id: '2', name: 'مطاعم', icon: 'fast-food' },
  { id: '3', name: 'صيدلية', icon: 'medkit' },
  { id: '4', name: 'إلكترونيات', icon: 'phone-portrait' },
];

export function HomeScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, lang } = useAuth();

  return (
    <View style={styles.container}>
      {/* Header Area */}
      <View style={styles.header}>
        <View>
          <Text style={styles.deliverTo}>التوصيل إلى</Text>
          <Pressable style={styles.locationBtn}>
            <Ionicons name="location" size={16} color={colors.primary} />
            <Text style={styles.locationText}>الخرطوم، السودان</Text>
            <Ionicons name="chevron-down" size={16} color={colors.text} />
          </Pressable>
        </View>
        <Pressable onPress={() => nav.navigate('Profile')} style={styles.avatar}>
          <Ionicons name="person" size={24} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput placeholder="ابحث عن متجر أو منتج..." style={styles.searchInput} placeholderTextColor={colors.textMuted} />
        </View>

        {/* Promotional Banner */}
        <LinearGradient colors={['#0F6B50', '#084C3B']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.banner}>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>توصيل سريع</Text>
            <Text style={styles.bannerSub}>أطلب احتياجاتك الآن ووصلها إليك بأسرع وقت</Text>
            <Pressable style={styles.bannerBtn}>
              <Text style={styles.bannerBtnTxt}>تسوق الآن</Text>
            </Pressable>
          </View>
          <MaterialCommunityIcons name="moped" size={80} color="#ffffff40" style={styles.bannerIcon} />
        </LinearGradient>

        {/* Service Cards */}
        <View style={styles.serviceRow}>
          <Pressable style={[styles.serviceCard, { backgroundColor: colors.accent }]} onPress={() => nav.navigate('CourierRequest')}>
            <View style={styles.serviceIconBg}>
              <MaterialCommunityIcons name="package-variant-closed" size={28} color={colors.accent} />
            </View>
            <Text style={styles.serviceTitle}>أرسل طرداً</Text>
            <Text style={styles.serviceSub}>توصيل بين عنوانين</Text>
          </Pressable>
          
          <Pressable style={[styles.serviceCard, { backgroundColor: colors.primary }]} onPress={() => nav.navigate('Stores')}>
            <View style={styles.serviceIconBg}>
              <Ionicons name="storefront" size={28} color={colors.primary} />
            </View>
            <Text style={styles.serviceTitle}>تسوق</Text>
            <Text style={styles.serviceSub}>تصفح المتاجر المحلية</Text>
          </Pressable>
        </View>

        {/* Categories */}
        <Text style={styles.sectionTitle}>الفئات</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
          {CATEGORIES.map(cat => (
            <Pressable key={cat.id} style={styles.categoryItem}>
              <View style={styles.categoryIconBg}>
                <Ionicons name={cat.icon as any} size={24} color={colors.primary} />
              </View>
              <Text style={styles.categoryName}>{cat.name}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Featured Stores */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>متاجر مميزة</Text>
          <Pressable onPress={() => nav.navigate('Stores')}>
            <Text style={styles.seeAll}>عرض الكل</Text>
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storesList}>
           {/* Placeholder for actual stores if needed, or rely on Stores screen */}
           <Pressable style={styles.storeCard} onPress={() => nav.navigate('Stores')}>
              <View style={styles.storeImagePlaceholder}>
                <Ionicons name="storefront" size={40} color={colors.primaryLight} />
              </View>
              <Text style={styles.storeCardName}>متجر تجريبي</Text>
              <Text style={styles.storeCardStatus}>مفتوح الآن</Text>
           </Pressable>
        </ScrollView>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.xxl, paddingBottom: spacing.md, backgroundColor: colors.surface },
  deliverTo: { fontSize: fontSize.xs, color: colors.textMuted, marginBottom: 2 },
  locationBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: spacing.lg, paddingBottom: 100 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: spacing.md, height: 50, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg },
  searchIcon: { marginRight: spacing.sm },
  searchInput: { flex: 1, fontSize: fontSize.md, color: colors.text, textAlign: 'right' },
  banner: { flexDirection: 'row', borderRadius: radius.xl, padding: spacing.xl, marginBottom: spacing.lg, overflow: 'hidden', alignItems: 'center' },
  bannerContent: { flex: 1, zIndex: 2 },
  bannerTitle: { fontSize: fontSize.xl, fontWeight: '800', color: '#fff', marginBottom: spacing.xs },
  bannerSub: { fontSize: fontSize.sm, color: '#ffffffdd', marginBottom: spacing.md, lineHeight: 20 },
  bannerBtn: { backgroundColor: '#fff', alignSelf: 'flex-start', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.pill },
  bannerBtnTxt: { color: colors.primary, fontWeight: '800', fontSize: fontSize.sm },
  bannerIcon: { position: 'absolute', right: -10, bottom: -10, opacity: 0.5 },
  serviceRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  serviceCard: { flex: 1, borderRadius: radius.lg, padding: spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  serviceIconBg: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  serviceTitle: { fontSize: fontSize.lg, fontWeight: '800', color: '#fff' },
  serviceSub: { fontSize: fontSize.xs, color: '#ffffffdd', marginTop: 4 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text, marginBottom: spacing.md },
  seeAll: { color: colors.primary, fontSize: fontSize.sm, fontWeight: '600' },
  categoryList: { gap: spacing.md, paddingBottom: spacing.xl },
  categoryItem: { alignItems: 'center', width: 70 },
  categoryIconBg: { width: 64, height: 64, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  categoryName: { fontSize: fontSize.sm, color: colors.text, fontWeight: '600' },
  storesList: { gap: spacing.md },
  storeCard: { width: 160, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border },
  storeImagePlaceholder: { height: 80, backgroundColor: colors.background, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  storeCardName: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  storeCardStatus: { fontSize: fontSize.xs, color: colors.success, marginTop: 4 },
});
