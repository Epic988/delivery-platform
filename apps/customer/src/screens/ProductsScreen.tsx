import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
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
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    api.products({ storeSlug: params.storeSlug, pageSize: 100 })
      .then((r) => setData(r.data))
      .catch((e) => setMsg({ type: 'error', text: e.message }))
      .finally(() => setLoading(false));
  }, [params.storeSlug]);

  const addToCart = async (p: Product) => {
    setMsg(null);
    try {
      await api.addToCart(p.storeId, { productId: p.id, quantity: 1 });
      setMsg({ type: 'success', text: lang === 'ar' ? 'تمت الإضافة إلى السلة بنجاح' : 'Added to cart' });
      setTimeout(() => setMsg(null), 3000);
    } catch (e: any) {
      setMsg({ type: 'error', text: e?.message ?? 'Failed to add' });
      setTimeout(() => setMsg(null), 5000);
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;

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
        ListEmptyComponent={<Text style={styles.empty}>{lang === 'ar' ? 'لا توجد منتجات في هذا المتجر' : 'No products in this store'}</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.imagePlaceholder}>
               <Ionicons name="image-outline" size={32} color={colors.border} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.name} numberOfLines={2}>{lang === 'ar' ? item.nameAr : item.nameEn ?? item.nameAr}</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <Text style={styles.price}>{Number(item.price).toFixed(0)} <Text style={styles.currency}>SDG</Text></Text>
                <Pressable style={styles.addBtn} onPress={() => addToCart(item)}>
                  <Ionicons name="add" size={20} color="#fff" />
                </Pressable>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  toast: { position: 'absolute', top: 20, left: 20, right: 20, zIndex: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing.md, borderRadius: radius.md, gap: 8 },
  toastTxt: { color: '#fff', fontWeight: '700', fontSize: fontSize.md },
  card: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  imagePlaceholder: { height: 120, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  cardContent: { padding: spacing.md },
  name: { fontSize: fontSize.md, fontWeight: '700', color: colors.text, marginBottom: spacing.xs, height: 40 },
  price: { fontSize: fontSize.lg, fontWeight: '800', color: colors.primary },
  currency: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textMuted },
  addBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xxl, fontSize: fontSize.md },
});
