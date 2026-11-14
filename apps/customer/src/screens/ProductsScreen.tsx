import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View, Alert } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Product, colors, fontSize, radius, spacing } from '@delivery/shared';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../types';

type Route = RouteProp<RootStackParamList, 'Products'>;

export function ProductsScreen() {
  const { params } = useRoute<Route>();
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { lang } = useAuth();
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api.products({ storeSlug: params.storeSlug, pageSize: 100 })
      .then((r) => setData(r.data))
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [params.storeSlug]);

  const addToCart = async (p: Product) => {
    try {
      await api.addToCart(p.storeId, { productId: p.id, quantity: 1 });
      Alert.alert(lang === 'ar' ? 'تم' : 'Done', lang === 'ar' ? 'أضيف للسلة' : 'Added to cart');
    } catch (e: any) {
      Alert.alert(lang === 'ar' ? 'خطأ' : 'Error', e?.message ?? 'Error');
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  if (err) return <View style={styles.center}><Text style={{ color: colors.danger }}>{err}</Text></View>;

  return (
    <FlatList
      style={{ backgroundColor: colors.backgroundAlt }}
      contentContainerStyle={{ padding: spacing.lg }}
      data={data}
      keyExtractor={(p) => p.id}
      ListEmptyComponent={<Text style={styles.empty}>{lang === 'ar' ? 'لا توجد منتجات' : 'No products'}</Text>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.name}>{lang === 'ar' ? item.nameAr : item.nameEn ?? item.nameAr}</Text>
          <Text style={styles.price}>{Number(item.price).toFixed(0)} SDG</Text>
          <Pressable style={styles.addBtn} onPress={() => addToCart(item)}>
            <Text style={styles.addTxt}>{lang === 'ar' ? '+ للسلة' : '+ Cart'}</Text>
          </Pressable>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.backgroundAlt },
  card: { backgroundColor: colors.background, padding: spacing.lg, borderRadius: radius.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  name: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  price: { fontSize: fontSize.lg, fontWeight: '700', color: colors.primary, marginTop: spacing.xs },
  addBtn: { marginTop: spacing.sm, backgroundColor: colors.primaryLight, paddingVertical: spacing.sm, borderRadius: radius.sm, alignItems: 'center' },
  addTxt: { color: colors.primary, fontWeight: '600' },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xxl },
});
