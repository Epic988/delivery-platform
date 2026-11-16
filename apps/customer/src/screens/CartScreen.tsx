import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Cart, colors, fontSize, radius, spacing } from '@delivery/shared';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../types';

export function CartScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { lang } = useAuth();
  const [carts, setCarts] = useState<Cart[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api.carts().then((r) => setCarts(r.data)).finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const updateQty = async (storeId: string, productId: string, quantity: number) => {
    try {
      if (quantity <= 0) await api.deleteCartItem(storeId, productId);
      else await api.updateCartItem(storeId, productId, quantity);
      load();
    } catch (e: any) { Alert.alert('Error', e?.message ?? ''); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;

  if (carts.length === 0) {
    return (
      <View style={styles.center}>
        <View style={styles.emptyIcon}><Ionicons name="cart-outline" size={64} color={colors.border} /></View>
        <Text style={styles.emptyTxt}>{lang === 'ar' ? 'السلة فارغة' : 'Cart is empty'}</Text>
        <Pressable onPress={() => nav.navigate('Stores')} style={styles.shopBtn}>
          <Text style={styles.shopBtnTxt}>{lang === 'ar' ? 'تسوق الآن' : 'Shop now'}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}
        data={carts}
        keyExtractor={(c) => c.id}
        renderItem={({ item: cart }) => (
          <View style={styles.storeCard}>
            <View style={styles.storeHeader}>
              <Ionicons name="storefront-outline" size={20} color={colors.primary} />
              <Text style={styles.storeName}>{lang === 'ar' ? cart.store.nameAr : cart.store.nameEn ?? cart.store.nameAr}</Text>
            </View>
            {cart.items.map((it) => (
              <View key={it.id} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{lang === 'ar' ? it.product.nameAr : it.product.nameEn ?? it.product.nameAr}</Text>
                  <Text style={styles.itemPrice}>{Number(it.unitPrice).toFixed(0)} SDG</Text>
                </View>
                <View style={styles.qtyControl}>
                  <Pressable onPress={() => updateQty(cart.storeId, it.productId, it.quantity - 1)} style={styles.qtyBtn}><Ionicons name="remove" size={16} color={colors.primary} /></Pressable>
                  <Text style={styles.qtyVal}>{it.quantity}</Text>
                  <Pressable onPress={() => updateQty(cart.storeId, it.productId, it.quantity + 1)} style={styles.qtyBtn}><Ionicons name="add" size={16} color={colors.primary} /></Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      />
      <View style={styles.bottomBar}>
        <Pressable style={styles.checkoutBtn} onPress={() => nav.navigate('Checkout')}>
          <Text style={styles.checkoutTxt}>{lang === 'ar' ? 'متابعة الدفع' : 'Proceed to checkout'}</Text>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, padding: spacing.xl },
  emptyIcon: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  emptyTxt: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text, marginBottom: spacing.xl },
  shopBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.xxl, paddingVertical: spacing.md, borderRadius: radius.pill },
  shopBtnTxt: { color: '#fff', fontSize: fontSize.md, fontWeight: '700' },
  storeCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
  storeHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, gap: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: spacing.sm },
  storeName: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  itemInfo: { flex: 1 },
  itemName: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
  itemPrice: { fontSize: fontSize.sm, color: colors.primary, fontWeight: '700', marginTop: 2 },
  qtyControl: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderRadius: radius.pill, padding: 4 },
  qtyBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  qtyVal: { width: 32, textAlign: 'center', fontSize: fontSize.md, fontWeight: '700' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: spacing.lg, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  checkoutBtn: { flexDirection: 'row', backgroundColor: colors.primary, padding: spacing.lg, borderRadius: radius.md, alignItems: 'center', justifyContent: 'space-between' },
  checkoutTxt: { color: '#fff', fontWeight: '800', fontSize: fontSize.md },
});
