import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Cart, colors, fontSize, radius, spacing } from '@delivery/shared';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../types';

export function CartScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { lang } = useAuth();
  const [carts, setCarts] = useState<Cart[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api.carts().then((r) => setCarts(r.data)).catch((e) => setErr(e.message)).finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const updateQty = async (storeId: string, productId: string, quantity: number) => {
    try {
      if (quantity <= 0) await api.deleteCartItem(storeId, productId);
      else await api.updateCartItem(storeId, productId, quantity);
      load();
    } catch (e: any) { Alert.alert('Error', e?.message ?? ''); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  if (err) return <View style={styles.center}><Text style={{ color: colors.danger }}>{err}</Text></View>;

  if (carts.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>{lang === 'ar' ? 'السلة فارغة' : 'Cart is empty'}</Text>
        <Pressable onPress={() => nav.navigate('Stores')} style={styles.linkBtn}>
          <Text style={styles.linkTxt}>{lang === 'ar' ? 'تسوق الآن' : 'Shop now'}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.backgroundAlt }}>
      <FlatList
        contentContainerStyle={{ padding: spacing.lg }}
        data={carts}
        keyExtractor={(c) => c.id}
        renderItem={({ item: cart }) => (
          <View style={styles.storeCard}>
            <Text style={styles.storeName}>{lang === 'ar' ? cart.store.nameAr : cart.store.nameEn ?? cart.store.nameAr}</Text>
            {cart.items.map((it) => (
              <View key={it.id} style={styles.itemRow}>
                <Text style={{ flex: 1 }}>{lang === 'ar' ? it.product.nameAr : it.product.nameEn ?? it.product.nameAr}</Text>
                <Pressable onPress={() => updateQty(cart.storeId, it.productId, it.quantity - 1)} style={styles.qtyBtn}><Text style={styles.qtyTxt}>−</Text></Pressable>
                <Text style={styles.qtyVal}>{it.quantity}</Text>
                <Pressable onPress={() => updateQty(cart.storeId, it.productId, it.quantity + 1)} style={styles.qtyBtn}><Text style={styles.qtyTxt}>+</Text></Pressable>
              </View>
            ))}
          </View>
        )}
      />
      <View style={styles.bottomBar}>
        <Pressable style={styles.checkoutBtn} onPress={() => nav.navigate('Checkout')}>
          <Text style={styles.checkoutTxt}>{lang === 'ar' ? 'متابعة الدفع' : 'Proceed to checkout'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.backgroundAlt, padding: spacing.xl },
  storeCard: { backgroundColor: colors.background, borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  storeName: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  qtyBtn: { width: 32, height: 32, borderRadius: radius.sm, backgroundColor: colors.backgroundAlt, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  qtyTxt: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  qtyVal: { width: 32, textAlign: 'center', fontSize: fontSize.md, fontWeight: '600' },
  bottomBar: { padding: spacing.lg, backgroundColor: colors.background, borderTopWidth: 1, borderTopColor: colors.border },
  checkoutBtn: { backgroundColor: colors.primary, padding: spacing.lg, borderRadius: radius.md, alignItems: 'center' },
  checkoutTxt: { color: '#fff', fontWeight: '700', fontSize: fontSize.md },
  empty: { fontSize: fontSize.lg, color: colors.textMuted, marginBottom: spacing.md },
  linkBtn: { padding: spacing.md },
  linkTxt: { color: colors.primary, fontWeight: '600' },
});
