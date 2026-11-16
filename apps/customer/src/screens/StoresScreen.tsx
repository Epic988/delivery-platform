import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Store, colors, fontSize, radius, spacing } from '@delivery/shared';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../types';

export function StoresScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { lang } = useAuth();
  const [data, setData] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.stores({ pageSize: 50 }).then((r) => setData(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <FlatList
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.lg }}
      data={data}
      keyExtractor={(s) => s.id}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={<Text style={styles.empty}>{lang === 'ar' ? 'لا توجد متاجر متاحة' : 'No stores available'}</Text>}
      renderItem={({ item }) => (
        <Pressable style={styles.card} onPress={() => nav.navigate('StoreDetails', { slug: item.slug })}>
          <View style={styles.storeImagePlaceholder}>
             <Ionicons name="storefront" size={32} color={colors.primaryLight} />
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{lang === 'ar' ? item.nameAr : item.nameEn ?? item.nameAr}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs }}>
              <Ionicons name="location-outline" size={14} color={colors.textMuted} />
              <Text style={styles.addr}>{item.addressText}</Text>
            </View>
          </View>
          <View style={styles.arrow}>
             <Ionicons name="chevron-back" size={20} color={colors.textMuted} />
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.lg, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border },
  storeImagePlaceholder: { width: 64, height: 64, borderRadius: radius.md, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', marginLeft: spacing.md },
  info: { flex: 1, marginLeft: spacing.md },
  name: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  addr: { fontSize: fontSize.sm, color: colors.textMuted, marginLeft: 4 },
  arrow: { padding: spacing.sm },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xxl, fontSize: fontSize.md },
});
